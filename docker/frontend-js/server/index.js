const apm = require("elastic-apm-node");
apm.start({
  serviceName: "frontend-gateway",
  serverUrl:
    process.env.ELASTIC_APM_SERVER_URLS,
  secretToken: process.env.ELASTIC_APM_SERVER_URLS,
  logLevel: "error",
});
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const { json } = require("body-parser");
const cors = require("cors")({ origin: '*' });
const grpc = require("grpc");

const PORT = process.env.PORT || 3001;

const productcatalogservice = process.env.PRODUCTCATALOGSERVICE
const recommendationservice = process.env.RECOMMENDATIONSERVICE
const advertservice = process.env.ADVERTSERVICE
const cartservice = process.env.CARTSERVICE
const checkoutservice = process.env.CHECKOUTSERVICE

const PROTO_PATH = path.join(__dirname, "./demo.proto");
const { gallivant } = grpc.load(PROTO_PATH, "proto");

const interceptor = (options, nextCall) => {
  return new grpc.InterceptingCall(nextCall(options), {
    start: function (metadata, listener, next) {
      metadata.add("traceparent", apm.currentTraceparent);
      metadata.add("elastic-apm-traceparent", apm.currentTraceparent);
      next(metadata, listener, next);
    },
  });
};

const productService = new gallivant.ProductCatalogService(
  productcatalogservice,
  grpc.credentials.createSsl(),
  { interceptors: [interceptor] }
);

const recommendationsService = new gallivant.RecommendationService(
  recommendationservice,
  grpc.credentials.createSsl(),
  { interceptors: [interceptor] }
);

const advertService = new gallivant.AdService(
  advertservice,
  grpc.credentials.createSsl(),
  { interceptors: [interceptor] }
);

const cartService = new gallivant.CartService(
  cartservice,
  grpc.credentials.createSsl(),
  { interceptors: [interceptor] }
);

const checkoutService = new gallivant.CheckoutService(
  checkoutservice,
  grpc.credentials.createSsl(),
  { interceptors: [interceptor] }
);

const handleError = (err, res) => {
  res.statusCode = 500;
  res.end(JSON.stringify("[]"));
};

const handleResponse = (res, data) => {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
};

express()
  .use(cookieParser(), cors, json())
  .get("/products", async (req, res) => {
    productService.listProducts({}, (err, response) => {
      if (err) {
        apm.captureError(err);
        handleError(err, res);
      } else {
        handleResponse(res, response.products);
      }
    });
  })
  .get("/product/:id", (req, res) => {
    productService.GetProduct(req.params.id, (err, response) => {
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, response);
      }
    });
  })
  .get("/recommendations", (req, res) => {
    const user_id = req.cookies["local_user_id"];
    recommendationsService.listRecommendations(
      {
        user_id,
      },
      (err, response) => {
        if (err) {
          console.log("err", err);
          handleError(err, res);
        } else {
          handleResponse(res, response["product_ids"]);
        }
      }
    );
  })
  .get("/ads", (req, res) => {
    advertService.getAds({}, (err, response) => {
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, response.ads);
      }
    });
  })
  .post("/add-cart", (req, res) => {
    const { productId, quantity } = req.body;
    const user_id = req.cookies["local_user_id"];
    cartService.addItem(
      {
        user_id,
        item: {
          product_id: productId,
          quantity: Number(quantity),
        },
      },
      (err) => {
        if (err) {
          handleError(err, res);
        } else {
          handleResponse(res, {
            redirect: "/cart",
          });
        }
      }
    );
  })
  .post("/empty-cart", (req, res) => {
    const user_id = req.cookies["local_user_id"];
    cartService.emptyCart({ user_id }, (err, response) => {
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, {
          redirect: "/",
        });
      }
    });
  })
  .get("/cart", (req, res) => {
    const user_id = req.cookies["local_user_id"];
    cartService.getCart({ user_id }, (err, response) => {
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, response);
      }
    });
  })
  .post("/checkout", (req, res) => {
    const {
      email,
      street_address,
      zip_code,
      city,
      state,
      country,
      credit_card_number,
      credit_card_cvv,
      credit_card_expiration_year,
      credit_card_expiration_month,
    } = req.body;
    const user_id = req.cookies["local_user_id"];
    checkoutService.placeOrder(
      {
        user_id,
        user_currency: "USD",
        address: {
          street_address,
          city,
          state,
          country,
          zip_code: Number(zip_code),
        },
        email,
        credit_card: {
          credit_card_number,
          credit_card_cvv: Number(credit_card_cvv),
          credit_card_expiration_year: Number(credit_card_expiration_year),
          credit_card_expiration_month: Number(credit_card_expiration_month),
        },
      },
      (err, response) => {
        if (err) {
          handleError(err, res);
        } else {
          handleResponse(res, response.order);
        }
      }
    );
  })
  .listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Running on localhost:${PORT}`);
  });
