// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"checkoutservice/custom_apmgrpc"
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"go.elastic.co/apm"
	"go.elastic.co/apm/module/apmgrpc"
	"go.elastic.co/apm/module/apmlogrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"net"
	"os"
	"time"

	pb "checkoutservice/genproto"
	"checkoutservice/money"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

const (
	listenPort  = "8000"
	usdCurrency = "USD"
)

var ecsLogger *logrus.Entry
var log = &logrus.Logger{
	Out:   os.Stderr,
	Hooks: make(logrus.LevelHooks),
	Level: logrus.InfoLevel,
	Formatter: &logrus.JSONFormatter{
		FieldMap: logrus.FieldMap{
			logrus.FieldKeyTime:  "@timestamp",
			logrus.FieldKeyLevel: "log.level",
			logrus.FieldKeyMsg:   "message",
			logrus.FieldKeyFunc:  "function.name", // non-ECS
		},
		TimestampFormat: time.RFC3339Nano,
	},
}
func init() {
	// add default ECS fields to the logger
	if s := os.Getenv("ELASTIC_APM_SERVICE_NAME"); s != "" {
		ecsLogger = log.WithFields(logrus.Fields{"event.dataset": s + ".log"})
	} else {
		ecsLogger = log.WithFields(logrus.Fields{"event.dataset": "checkoutService.log"})
	}

	apm.DefaultTracer.SetLogger(ecsLogger)
}

type checkoutService struct {
	productCatalogSvcAddr string
	cartSvcAddr           string
	currencySvcAddr       string
	shippingSvcAddr       string
	emailSvcAddr          string
	paymentSvcAddr        string
}

func main() {
	port := listenPort
	if os.Getenv("PORT") != "" {
		port = os.Getenv("PORT")
	}
	run(port)
	select {}
}

func run(port string) string {
	l, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		ecsLogger.Fatal(err)
	}
	srv := grpc.NewServer(grpc.UnaryInterceptor(apmgrpc.NewUnaryServerInterceptor()))
	svc := new(checkoutService)
	mustMapEnv(&svc.shippingSvcAddr, "SHIPPING_SERVICE_ADDR")
	mustMapEnv(&svc.productCatalogSvcAddr, "PRODUCT_CATALOG_SERVICE_ADDR")
	mustMapEnv(&svc.cartSvcAddr, "CART_SERVICE_ADDR")
	mustMapEnv(&svc.currencySvcAddr, "CURRENCY_SERVICE_ADDR")
	mustMapEnv(&svc.emailSvcAddr, "EMAIL_SERVICE_ADDR")
	mustMapEnv(&svc.paymentSvcAddr, "PAYMENT_SERVICE_ADDR")
	ecsLogger.Infof("service config: %+v", svc)
	pb.RegisterCheckoutServiceServer(srv, svc)
	healthpb.RegisterHealthServer(srv, svc)
	ecsLogger.Infof("Checkout Service listening on port %s", port)
	go srv.Serve(l)
	return l.Addr().String()
}


func mustMapEnv(target *string, envKey string) {
	v := os.Getenv(envKey)
	if v == "" {
		panic(fmt.Sprintf("environment variable %q not set", envKey))
	}
	*target = v
}

func (cs *checkoutService) Check(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	return &healthpb.HealthCheckResponse{Status: healthpb.HealthCheckResponse_SERVING}, nil
}

func (cs *checkoutService) Watch(req *healthpb.HealthCheckRequest, ws healthpb.Health_WatchServer) error {
	return status.Errorf(codes.Unimplemented, "health check via Watch not implemented")
}

func (cs *checkoutService) PlaceOrder(ctx context.Context, req *pb.PlaceOrderRequest) (*pb.PlaceOrderResponse, error) {
	log := ecsLogger.WithFields(apmlogrus.TraceContext(ctx))
	log.Infof("[PlaceOrder] user_id=%q user_currency=%q", req.UserId, req.UserCurrency)

	transaction :=  apm.TransactionFromContext(ctx)
    transaction.Context.SetLabel("userId", req.UserId)


	orderID, err := uuid.NewUUID()
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, status.Errorf(codes.Internal, "failed to generate order uuid")
	}

	prep, err := cs.prepareOrderItemsAndShippingQuoteFromCart(ctx, req.UserId, req.UserCurrency, req.Address)
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, status.Errorf(codes.Internal, err.Error())
	}
	span, ctx := apm.StartSpan(ctx, "calculate_charge", "app")

	total := pb.Money{CurrencyCode: req.UserCurrency,
		Units: 0,
		Nanos: 0}
	total = money.Must(money.Sum(total, *prep.shippingCostLocalized))

	for _, it := range prep.orderItems {
		total = money.Must(money.Sum(total, *it.Cost))
	}
	defer span.End()

	txID, err := cs.chargeCard(ctx, &total, req.CreditCard, req.UserId)
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, status.Errorf(codes.Internal, "failed to charge card: %+v", err)
	}
	log.Infof("payment went through (transaction_id: %s)", txID)

	shippingTrackingID, err := cs.shipOrder(ctx, req.Address, prep.cartItems, req.UserId)
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, status.Errorf(codes.Unavailable, "shipping error: %+v", err)
	}

	_ = cs.emptyUserCart(ctx, req.UserId)

	orderResult := &pb.OrderResult{
		OrderId:            orderID.String(),
		ShippingTrackingId: shippingTrackingID,
		ShippingCost:       prep.shippingCostLocalized,
		ShippingAddress:    req.Address,
		Items:              prep.orderItems,
	}

	if err := cs.sendOrderConfirmation(ctx, req.Email, orderResult, req.UserId); err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		log.Warnf("failed to send order confirmation to %q: %+v", req.Email, err)
	} else {
		log.Infof("order confirmation email sent to %q", req.Email)
	}
	resp := &pb.PlaceOrderResponse{Order: orderResult}
	return resp, nil
}

type orderPrep struct {
	orderItems            []*pb.OrderItem
	cartItems             []*pb.CartItem
	shippingCostLocalized *pb.Money
}

func (cs *checkoutService) prepareOrderItemsAndShippingQuoteFromCart(ctx context.Context, userID, userCurrency string, address *pb.Address) (orderPrep, error) {
	span, ctx := apm.StartSpan(ctx, "prepareOrderItemsAndShippingQuoteFromCart", "request")

	tx := apm.TransactionFromContext(ctx);
	tx.Context.SetLabel("userId", userID)
	if tx != nil {
		tx.Context.SetUsername(userID)
		tx.Context.SetUserID(userID)
		tx.Context.SetTag("currency", userCurrency)
		tx.Context.SetCustom("address", address)
	}
	var out orderPrep
	cartItems, err := cs.getUserCart(ctx, userID)

	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.SetTransaction(tx)
		e.Send()
		return out, fmt.Errorf("cart failure: %+v", err)
	}
	orderItems, err := cs.prepOrderItems(ctx, cartItems, userCurrency, userID)
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.SetTransaction(tx)
		e.Send()
		return out, fmt.Errorf("failed to prepare order: %+v", err)
	}

	shippingUSD, err := cs.quoteShipping(ctx, address, cartItems, userID)
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.SetTransaction(tx)
		e.Send()
		return out, fmt.Errorf("shipping quote failure: %+v", err)
	}
	shippingPrice, err := cs.convertCurrency(ctx, shippingUSD, userCurrency, userID)
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.SetTransaction(tx)
		e.Send()
		return out, fmt.Errorf("failed to convert shipping cost to currency: %+v", err)
	}

	out.shippingCostLocalized = shippingPrice
	out.cartItems = cartItems
	out.orderItems = orderItems
	defer span.End()
	return out, nil
}

func (cs *checkoutService) getUserCart(ctx context.Context, userID string) ([]*pb.CartItem, error) {
	span, ctx := apm.StartSpan(ctx, "getUserCart", "app")

	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.cartSvcAddr }
	conn, err := grpc.DialContext(ctx, cs.cartSvcAddr, grpc.WithInsecure(), grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, fmt.Errorf("could not connect cart service: %+v", err)
	}
	defer conn.Close()

	cart, err := pb.NewCartServiceClient(conn).GetCart(ctx, &pb.GetCartRequest{UserId: userID})
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, fmt.Errorf("failed to get user cart during checkout: %+v", err)
	}
	defer span.End()
	return cart.GetItems(), nil
}

func (cs *checkoutService) prepOrderItems(ctx context.Context, items []*pb.CartItem, userCurrency string, userId string) ([]*pb.OrderItem, error) {
	span, ctx := apm.StartSpan(ctx, "prepOrderItems", "request")
	out := make([]*pb.OrderItem, len(items))

	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.productCatalogSvcAddr }
	conn, err := grpc.DialContext(ctx, cs.productCatalogSvcAddr, grpc.WithInsecure(), grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, fmt.Errorf("could not connect product catalog service: %+v", err)
	}
	defer conn.Close()
	cl := pb.NewProductCatalogServiceClient(conn)

	for i, item := range items {
		p_span, ctx := apm.StartSpan(ctx, "GetProduct", "app")

		product, err := cl.GetProduct(ctx, &pb.GetProductRequest{Id: item.GetProductId(), UserId: userId})
		if err != nil {
			e := apm.CaptureError(ctx, err)
			e.Send()
			return nil, fmt.Errorf("failed to get product #%q", item.GetProductId())
		}
		defer p_span.End()
		c_span, ctx := apm.StartSpan(ctx, "convertCurrency", "app")

		price, err := cs.convertCurrency(ctx, product.GetPriceUsd(), userCurrency, userId)
		if err != nil {
			e := apm.CaptureError(ctx, err)
			e.Send()
			return nil, fmt.Errorf("failed to convert price of %q to %s", item.GetProductId(), userCurrency)
		}
		out[i] = &pb.OrderItem{
			Item: item,
			Cost: price}
		defer c_span.End()
	}
	defer span.End()
	return out, nil
}

func (cs *checkoutService) quoteShipping(ctx context.Context, address *pb.Address, items []*pb.CartItem, userID string) (*pb.Money, error) {
	span, ctx := apm.StartSpan(ctx, "quoteShipping", "app")

	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.shippingSvcAddr }
	conn, err := grpc.DialContext(ctx, cs.shippingSvcAddr,
		grpc.WithInsecure(),
		grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, fmt.Errorf("could not connect shipping service: %+v", err)
	}
	defer conn.Close()

	shippingQuote, err := pb.NewShippingServiceClient(conn).
		GetQuote(ctx, &pb.GetQuoteRequest{
			Address: address,
			Items:   items,
		    UserId:  userID})
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, fmt.Errorf("failed to get shipping quote: %+v", err)
	}
	defer span.End()
	return shippingQuote.GetCostUsd(), nil
}

func (cs *checkoutService) convertCurrency(ctx context.Context, from *pb.Money, toCurrency string, userId string) (*pb.Money, error) {
	span, ctx := apm.StartSpan(ctx, "convertCurrency", "app")
	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.currencySvcAddr }
	conn, err := grpc.DialContext(ctx, cs.currencySvcAddr, grpc.WithInsecure(), grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, fmt.Errorf("could not connect currency service: %+v", err)
	}
	defer conn.Close()
	result, err := pb.NewCurrencyServiceClient(conn).Convert(ctx, &pb.CurrencyConversionRequest{
		From:   from,
		ToCode: toCurrency,
 	    UserId: userId})
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil, fmt.Errorf("failed to convert currency: %+v", err)
	}
	defer span.End()
	return result, err
}

func (cs *checkoutService) emptyUserCart(ctx context.Context, userID string) error {
	span, ctx := apm.StartSpan(ctx, "emptyUserCart", "request")
	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.cartSvcAddr }
	conn, err := grpc.DialContext(ctx, cs.cartSvcAddr, grpc.WithInsecure(), grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return fmt.Errorf("could not connect cart service: %+v", err)
	}
	defer conn.Close()

	if _, err = pb.NewCartServiceClient(conn).EmptyCart(ctx, &pb.EmptyCartRequest{UserId: userID}); err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return fmt.Errorf("failed to empty user cart during checkout: %+v", err)
	}
	defer span.End()
	return nil
}

func (cs *checkoutService) addItemCart(ctx context.Context, userID string, item *pb.CartItem) error {
	span, ctx := apm.StartSpan(ctx, "addItemCart", "request")
	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.cartSvcAddr }
	conn, err := grpc.DialContext(ctx, cs.cartSvcAddr, grpc.WithInsecure(), grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return fmt.Errorf("could not connect cart service: %+v", err)
	}
	defer conn.Close()
	if _, err =  pb.NewCartServiceClient(conn).AddItem(ctx, &pb.AddItemRequest{ UserId: userID, Item: item}); err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return fmt.Errorf("failed to add item to cart: %+v", err)
	}
	defer span.End()
	return nil
}

func (cs *checkoutService) chargeCard(ctx context.Context, amount *pb.Money, paymentInfo *pb.CreditCardInfo, userId string) (string, error) {
	span, ctx := apm.StartSpan(ctx, "chargeCard", "request")
	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.paymentSvcAddr }
	conn, err := grpc.DialContext(ctx, cs.paymentSvcAddr, grpc.WithInsecure(), grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return "", fmt.Errorf("failed to connect payment service: %+v", err)
	}
	defer conn.Close()

	paymentResp, err := pb.NewPaymentServiceClient(conn).Charge(ctx, &pb.ChargeRequest{
		Amount:     amount,
		CreditCard: paymentInfo,
	    UserId: userId})
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return "", fmt.Errorf("could not charge the card: %+v", err)
	}
	defer span.End()
	return paymentResp.GetTransactionId(), nil
}

func (cs *checkoutService) sendOrderConfirmation(ctx context.Context, email string, order *pb.OrderResult, testuserId string) error {
	span, ctx := apm.StartSpan(ctx, "sendOrderConfirmation", "app")
	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.emailSvcAddr }
	conn, err := grpc.DialContext(ctx, cs.emailSvcAddr, grpc.WithInsecure(), grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return fmt.Errorf("failed to connect email service: %+v", err)
	}
	defer conn.Close()
	_, err = pb.NewEmailServiceClient(conn).SendOrderConfirmation(ctx, &pb.SendOrderConfirmationRequest{
		Email: email,
		Order: order,
		UserId: testuserId})
	defer span.End()
	return err
}

func (cs *checkoutService) shipOrder(ctx context.Context, address *pb.Address, items []*pb.CartItem, userId string) (string, error) {
	span, ctx := apm.StartSpan(ctx, "shipOrder", "app")
	span_ctx := apm.DestinationServiceSpanContext{ Name: "grpc", Resource: cs.shippingSvcAddr }
	conn, err := grpc.DialContext(ctx, cs.shippingSvcAddr, grpc.WithInsecure(), grpc.WithUnaryInterceptor(custom_apmgrpc.NewUnaryClientInterceptor(span_ctx)))
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return "", fmt.Errorf("failed to connect shipping service: %+v", err)
	}
	defer conn.Close()
	resp, err := pb.NewShippingServiceClient(conn).ShipOrder(ctx, &pb.ShipOrderRequest{
		Address: address,
		Items:   items,
		UserId: userId})
	if err != nil {
		e := apm.CaptureError(ctx, err)
		e.Send()
		return "", fmt.Errorf("shipment failed: %+v", err)
	}
	defer span.End()
	return resp.GetTrackingId(), nil
}

// TODO: Dial and create client once, reuse.
