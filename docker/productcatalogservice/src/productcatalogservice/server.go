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
	"bytes"
	"context"
	"database/sql"
	"flag"
	"fmt"
	"github.com/golang/protobuf/jsonpb"
	"github.com/sirupsen/logrus"
	"go.elastic.co/apm"
	"go.elastic.co/apm/module/apmgrpc"
	"go.elastic.co/apm/module/apmlogrus"
	"go.elastic.co/apm/module/apmsql"
	_ "go.elastic.co/apm/module/apmsql/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
	"io/ioutil"
	"net"
	"os"
	"os/signal"
	pb "productcatalogservice/genproto"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

var (
	cat          pb.ListProductsResponse
	catalogMutex *sync.Mutex
	extraLatency time.Duration

	port = "9000"

	reloadCatalog bool
	db *sql.DB
)

var ecsLogger *logrus.Entry
var log = &logrus.Logger{
	Out:   os.Stderr,
	Hooks: make(logrus.LevelHooks),
	Level: logrus.DebugLevel,
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
	if s := os.Getenv("ELASTIC_APM_SERVICE_NAME"); s != "" {
		ecsLogger = log.WithFields(logrus.Fields{"event.dataset": s + ".log"})
	} else {
		ecsLogger = log.WithFields(logrus.Fields{"event.dataset": "productCatalogService.log"})
	}

	apm.DefaultTracer.SetLogger(ecsLogger)

	catalogMutex = &sync.Mutex{}
	err := readCatalogFile(&cat, nil)
	if err != nil {
		ecsLogger.Warnf("could not parse product catalog")
	}
}
// netErr exception
func main() {
	flag.Parse()

	// set injected latency
	if s := os.Getenv("EXTRA_LATENCY"); s != "" {
		v, err := time.ParseDuration(s)
		if err != nil {
			log.Fatalf("failed to parse EXTRA_LATENCY (%s) as time.Duration: %+v", v, err)
		}
		extraLatency = v
		ecsLogger.Infof("extra latency enabled (duration: %v)", extraLatency)
	} else {
		extraLatency = time.Duration(0)
	}
	var err error

	db, err = apmsql.Open("postgres", "postgres://postgres:password@postgres:5432?sslmode=disable&dbname=hipster")
	if err != nil {
		log.Fatalf("failed to connect to postgres")

	}

// 	statement := `SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname = 'hipster');`
//
// 	row := db.QueryRow(statement)
// 	var exists bool
// 	err = row.Scan(&exists)
// 	if err != nil {
// 		log.Fatalf("failed to connect to postgres")
// 	}
//
// 	if exists == false {
// 		statement = `CREATE DATABASE hipster;`
// 		_, err = db.Exec(statement)
// 		if err != nil {
// 			log.Fatalf("error %s", err)
// 		}
// 	}
//
// 	db.Exec(`CREATE TABLE IF NOT EXISTS products(
// 	   id                    VARCHAR(10) NOT NULL PRIMARY KEY
// 	  ,name                  VARCHAR(200) NOT NULL
// 	  ,description           VARCHAR(200) NOT NULL
// 	  ,picture               VARCHAR(200) NOT NULL
// 	  ,priceUsdcurrencyCode  VARCHAR(200) NOT NULL
// 	  ,priceUsdunits         INTEGER  NOT NULL
// 	  ,priceUsdnanos         INTEGER
// 	  ,categories           VARCHAR(200) NOT NULL
// 	);`)NULL

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	catalogJSON, err := ioutil.ReadFile("products.json")
	if err != nil {
		log.Fatalf("failed to open product catalog json file: %v", err)
		panic(err)
	}
	if err := jsonpb.Unmarshal(bytes.NewReader(catalogJSON), &cat); err != nil {
		log.Warnf("failed to parse the catalog JSON: %v", err)
		panic(err)
	}
	log.Info("successfully parsed product catalog json")
	for _, product := range cat.Products {
		log.Info("product logging")
		_, err = db.Exec("INSERT INTO products(id,name,description,picture,priceUsdcurrencyCode,priceUsdunits,priceUsdnanos,categories) VALUES ('"+ product.Id + "','" + product.Name + "','" + strings.Replace(product.Description, "'", "", -1) + "','" + product.Picture + "','" + product.GetPriceUsd().GetCurrencyCode() + "','" + strconv.FormatInt(product.GetPriceUsd().GetUnits(), 10) + "','" + fmt.Sprint(product.GetPriceUsd().GetNanos()) + "','" + strings.Join(product.Categories, ";") + "')ON CONFLICT (id) DO NOTHING;")
		if err != nil {
			log.Warn("error loading product: %v", err)
			panic(err)
		}
	}

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGUSR1, syscall.SIGUSR2)
	go func() {
		for {
			sig := <-sigs
			log.Printf("Received signal: %s", sig)
			if sig == syscall.SIGUSR1 {
				reloadCatalog = true
				ecsLogger.Infof("Enable catalog reloading")
			} else {
				reloadCatalog = false
				ecsLogger.Infof("Disable catalog reloading")
			}
		}
	}()

	if os.Getenv("PORT") != "" {
		port = os.Getenv("PORT")
	}
	ecsLogger.Infof("starting grpc server at :%s", port)
	run(port)
	select {}
}

func run(port string) string {

	l, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatal(err)
	}

	srv := grpc.NewServer(grpc.UnaryInterceptor(apmgrpc.NewUnaryServerInterceptor()))
	svc := &productCatalog{}
	pb.RegisterProductCatalogServiceServer(srv, svc)
	healthpb.RegisterHealthServer(srv, svc)
	go srv.Serve(l)
	return l.Addr().String()
}


type productCatalog struct{}

func readCatalogFile(catalog *pb.ListProductsResponse, ctx context.Context) error {
	// log := ecsLogger.WithFields(apmlogrus.TraceContext(ctx))
	if ctx != nil {
		span, _ := apm.StartSpan(ctx, "readCatalogFile", "file_read")
		defer span.End()
	}
	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	catalogJSON, err := ioutil.ReadFile("products.json")
	if err != nil {
		log.Fatalf("failed to open product catalog json file: %v", err)
		e := apm.CaptureError(ctx, err)
		e.Send()
		return err
	}
	if err := jsonpb.Unmarshal(bytes.NewReader(catalogJSON), catalog); err != nil {
		log.Warnf("failed to parse the catalog JSON: %v", err)
		e := apm.CaptureError(ctx, err)
		e.Send()
		return err
	}
	log.Info("successfully parsed product catalog json")
	return nil
}

func parseCatalog(ctx context.Context) []*pb.Product {
	tx := apm.TransactionFromContext(ctx)
	result, err := db.QueryContext(ctx, "SELECT * FROM products")
	defer result.Close()
	if err != nil {
		log.Warnf("failed to read product catalog from Postgres: %v", err)
		tx.Outcome = "failure"
		e := apm.CaptureError(ctx, err)
		e.Send()
		return nil
	}
	got := []*pb.Product{}
	for result.Next() {
		var r *pb.Product
		var categories string
		var priceusdcurrencycode string
		var priceusdunits int64
		var priceusdnanos int64
		var id, name, description, picture, code string

		err = result.Scan(&id, &name, &description, &picture,&code, &priceusdunits, &priceusdnanos, &categories)

		if err != nil {
			log.Warnf("failed to scan rows", err)
			tx.Outcome = "failure"
			e := apm.CaptureError(ctx, err)
			e.Send()
			return nil
		}

		r = &pb.Product{
			Id: id,
			Name: name,
			Description: description,
			Picture: picture,
			PriceUsd: &pb.Money{
				CurrencyCode: priceusdcurrencycode,
				Units: priceusdunits,
				Nanos: int32(priceusdnanos),
			},
			Categories: strings.Split(categories, ";"),
		}

		got = append(got, r)
	}
	result.Close()
	return got
}

func (p *productCatalog) Check(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	span, ctx := apm.StartSpan(ctx, "Check", "request")
	h_response := &healthpb.HealthCheckResponse{Status: healthpb.HealthCheckResponse_SERVING}
	defer span.End()
	return h_response, nil
}

func (p *productCatalog) Watch(req *healthpb.HealthCheckRequest, ws healthpb.Health_WatchServer) error {
	return status.Errorf(codes.Unimplemented, "health check via Watch not implemented")
}

func (p *productCatalog) ListProducts(ctx context.Context, req *pb.ListProductsRequest) (*pb.ListProductsResponse, error) {
	log := ecsLogger.WithFields(apmlogrus.TraceContext(ctx))
	tx := apm.TransactionFromContext(ctx)

	tx.Context.SetLabel("userId", req.UserId)
	span, ctx := apm.StartSpan(ctx, "ListProducts", "request")
	log.Info("listing products")

	time.Sleep(extraLatency)


	catalogue := &pb.ListProductsResponse{
		Products: parseCatalog(ctx),
	}
	defer span.End()
	return catalogue, nil
}

func (p *productCatalog) GetProduct(ctx context.Context, req *pb.GetProductRequest) (*pb.Product, error) {
	log := ecsLogger.WithFields(apmlogrus.TraceContext(ctx))
	tx := apm.TransactionFromContext(ctx)
	tx.Context.SetLabel("userId", req.UserId)
	span, ctx := apm.StartSpan(ctx, "GetProduct", "request")
	time.Sleep(extraLatency)
	var found *pb.Product

// 	tx := apm.TransactionFromContext(ctx)
// 	span.Outcome = "failure"
// 	tx.Outcome = "failure"
//
// 	err := status.Errorf(codes.InvalidArgument, "Invalid Argument, expected 'identifier'")
// 	ecsLogger.Error("Invalid Argument, expected 'identifier'")
// 	e := apm.CaptureError(ctx, err)
// 	e.Send()
// 	return nil, err


	log.Info("Getting product with ID ", req.Id )
	var productcatalogue = parseCatalog(ctx)
	for i := 0; i < len(productcatalogue); i++ {
		if req.Id == productcatalogue[i].Id {
			found = productcatalogue[i]
		}
	}
	if found == nil {
		return nil, status.Errorf(codes.NotFound, "no product with ID %s", req.Id)
	}
	log.Info("Found product with ID ", req.Id )
	defer span.End()
	return found, nil
}

func (p *productCatalog) SearchProducts(ctx context.Context, req *pb.SearchProductsRequest) (*pb.SearchProductsResponse, error) {
	tx := apm.TransactionFromContext(ctx)
	tx.Context.SetLabel("userId", req.UserId)
	span, ctx := apm.StartSpan(ctx, "SearchProducts", "request")
	log.Info("Searching products")
	time.Sleep(extraLatency)
	// Intepret query as a substring match in name or description.
	var ps []*pb.Product
	for _, p := range parseCatalog(ctx) {
		if strings.Contains(strings.ToLower(p.Name), strings.ToLower(req.Query)) ||
			strings.Contains(strings.ToLower(p.Description), strings.ToLower(req.Query)) {
			ps = append(ps, p)
		}
	}
	defer span.End()
	return &pb.SearchProductsResponse{Results: ps}, nil
}
