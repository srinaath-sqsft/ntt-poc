const apm = require("elastic-apm-node");

apm.start({
  serviceName: process.env.ELASTIC_APM_SERVICE_NAME,
  serverUrl: process.env.ELASTIC_APM_SERVER_URLS,
  logLevel: "error",
  captureBody: "all",
});
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const { json } = require("body-parser");
const cors = require("cors")({ origin: true, credentials: true })
const grpc = require("grpc");
const pino = require('pino');
const http = require('http');
const request = require('request');


let lowdb = require("lowdb");
const FileSync = require('lowdb/adapters/FileSync')


const PORT = process.env.PORT || 3001;

const productcatalogservice = process.env.PRODUCTCATALOGSERVICE
const recommendationservice = process.env.RECOMMENDATIONSERVICE
const frontendNode = process.env.FRONTEND_NODE
const advertservice = process.env.ADVERTSERVICE
const cartservice = process.env.CARTSERVICE
const checkoutservice = process.env.CHECKOUTSERVICE

const PROTO_PATH = path.join(__dirname, "./demo.proto");
const { gallivant } = grpc.load(PROTO_PATH, "proto");

process.on('uncaughtException', function (exception) {
  console.log(exception); // to see your exception details in the console
  // if you are on production, maybe you can send the exception details to your
  // email as well ?
});

const interceptor = (options, nextCall) => {
  return new grpc.InterceptingCall(nextCall(options), {
    start: function (metadata, listener, next) {
      metadata.add("tracestate", "es=s:1");
      metadata.add("traceparent", apm.currentTraceparent);
      metadata.add("elastic-apm-traceparent", apm.currentTraceparent);
      next(metadata, listener, next);
    },
  });
};

const logger = pino({
  name: 'paymentservice-server',
  timestamp: () => `,"@timestamp":"${Date.now()}"`,
  messageKey: 'message',
  changeLevelName: 'log.level',
  useLevelLabels: true,
  mixin () {
    return {
      "process.pid": process.pid,
      "event.dataset": "frontend-node.log" ,
      "trace.id": apm.currentTraceIds["trace.id"]
    }
  }
});

const productService = new gallivant.ProductCatalogService(
  productcatalogservice,
  grpc.credentials.createInsecure(),
  { interceptors: [interceptor] }
);

const recommendationsService = new gallivant.RecommendationService(
  recommendationservice,
  grpc.credentials.createInsecure(),
  { interceptors: [interceptor] }
);

const advertService = new gallivant.AdService(
  advertservice,
  grpc.credentials.createInsecure(),
  { interceptors: [interceptor] }
);

const cartService = new gallivant.CartService(
  cartservice,
  grpc.credentials.createInsecure(),
  { interceptors: [interceptor], "grpc.lb_policy_name": "round_robin" }
);

const checkoutService = new gallivant.CheckoutService(
  checkoutservice,
  grpc.credentials.createInsecure(),
  { interceptors: [interceptor] }
);

const handleError = (err, res) => {
  console.log(err);
  logger.error(err);
  apm.captureError(err);
  res.statusCode = 500;
  res.end(JSON.stringify("[]"));
};

const handleResponse = (res, data) => {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
};  

const app = express()
  .use(cookieParser(), cors, json())
  .use((req,res,next)=>{
    apm.currentTransaction.setLabel('userId', req.cookies["local_user_id"])
    next();
  })

const adapter = new FileSync('products.json')
const db = lowdb(adapter);
db.defaults({ products: [] }).write();
app.get('/api/products-detail/:id', (req, res) => {
  console.log(req.params.id)
  const post = db.get('products')
    .find({ id: req.params.id })
    .value()

  res.send(post)
})
.all("/api/user", async (req, res) => {
    if (req.method === 'GET') {
        var user = ""
        try {
            if (typeof req.headers['x-forwarded-user'] !== 'undefined' && req.headers['x-forwarded-user']) {
              user = req.headers['x-forwarded-user']
            } else {
              user = ""
            }
            handleResponse(res, '{"user": "' + user + '"}');
         }
         catch (e) {
            handleResponse(res, '{"user": ""}');
         }
    } else {
        res.set('Allow', 'GET');
        res.send(405, 'Method Not Allowed');
    }
  })
  .get("/api/products", async (req, res) => {
    logger.info("TRACESTATE: " + req.headers['tracestate'])
    const user_id = req.cookies["local_user_id"];
    console.log('user_id: ' + user_id)
    productService.listProducts(
    {
      user_id
    }
    , (err, response) => {
       logger.info('/products - fetching products');
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, response.products);
      }
    });
  })
  .get("/api/product/:id", (req, res) => {
    const user_id = req.cookies["local_user_id"];
    const id = req.params.id;
    productService.GetProduct(
    {
      id,
      user_id
    }, (err, response) => {
      logger.info('/product/:id - fetching product by ID');
      
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, response);
      }
    });
  })
  .get("/api/recommendations", (req, res) => {
    var user_id = "unknown";
    if(typeof req.cookies["local_user_id"] !== "undefined")
    {
      user_id = req.cookies["local_user_id"]
    }
    recommendationsService.listRecommendations(
      {
        user_id,
      },
      (err, response) => {
        logger.info('/recommendations - fetching recommendations');
        if (err) {
          handleError(err, res);
        } else {
          handleResponse(res, response["product_ids"]);
        }
      }
    );
  })
  .get("/api/ads", (req, res) => {
    const user_id = req.cookies["local_user_id"];
    var categories = ["Vintage", "Photography", "Cookware", "Gardening", "Cycling", "Music"]
    var context_keys = categories[Math.floor(Math.random() * categories.length)]
    advertService.getAds({
      context_keys,
      user_id,
    }, (err, response) => {
      logger.info('/ads - fetching ads');
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, response.ads);
      }
    });
  })
  .post("/api/add-cart", (req, res) => {
    const { productId, quantity, price, name, image } = req.body;
    const user_id = req.cookies["local_user_id"];
    cartService.addItem(
      {
        user_id,
        item: {
          product_id: productId,
          quantity: Number(quantity),
          price: Number(price),
          name: name,
          image: image
        },
      },
      (err) => {
        logger.info('/add-cart - adding product to cart');
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
  .post("/api/empty-cart", (req, res) => {
    const user_id = req.cookies["local_user_id"];
    cartService.emptyCart({ user_id }, (err, response) => {
      logger.info('/empty-cart - emptying cart');
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, {
          redirect: "/",
        });
      }
    });
  })
  .get("/api/cart", (req, res) => {
    const user_id = req.cookies["local_user_id"];
    cartService.getCart({ user_id }, (err, response) => {
      logger.info('/cart - fetching cart for user: ' + user_id);
      if (err) {
        handleError(err, res);
      } else {
        handleResponse(res, response);
      }
    });
  })
  .all("/api/checkout", (req, res) => {
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
    if (req.method === 'POST') {
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
        logger.info('/checkout - checking out');
        if (err) {
          handleError(err, res);
        } else {
          handleResponse(res, response.order);
        }
      }
    );
    } else {
        res.set('Allow', 'POST');
        res.send(405, 'Method Not Allowed');
    }
  })
  .get("/api/attack", (req, res) => {
    const user_id = req.cookies["local_user_id"];
    console.log("attack initiated by: " + user_id)
    console.log("http://" + frontendNode + "/api/checkout?credit_card_credit_card_number=340000000000009&credit_card_cvv=473&credit_card_expiration_year=2023&credit_card_expiration_month=10&user_id=john&address_street_address=Elastic+Avenue&address_city=Denver&address_state=Colorado&address_country=USA&address_zip_code=80022&email=john.elastic@temp-mail.org")

    for (let i = 0; i <100; i++) {
      request.put({
        url:"http://" + frontendNode + ":3000" +  "/api/checkout?email=dev@gallivant.inc&credit_card_credit_card_number=" + Math.floor(Math.random() * 9999999999999999).toString()  + "&credit_card_cvv=473&credit_card_expiration_year=2023&credit_card_expiration_month=10&user_id=john&address_street_address=Elastic+Avenue&address_city=Denver&address_state=Colorado&address_country=USA&address_zip_code=80022",
        headers: {'X-Forwarded-For': '123.123.123.123', 'User-Agent': ''},
        timeout: 1000
      });
      request.post({
        url:"http://" + frontendNode + ":3000" +  "/api/add-cart?email=dev@gallivant.inc&credit_card_credit_card_number=" + Math.floor(Math.random() * 9999999999999999).toString()  + "&credit_card_cvv=473&credit_card_expiration_year=2023&credit_card_expiration_month=10&user_id=john&address_street_address=Elastic+Avenue&address_city=Denver&address_state=Colorado&address_country=USA&address_zip_code=80022",
        headers: {'X-Forwarded-For': '123.123.123.123', 'User-Agent': ''},
        timeout: 1000
      });
      request.post({
        url:"http://" + frontendNode + ":3000" +  "/api/checkout?email=dev@gallivant.inc&credit_card_credit_card_number=" + Math.floor(Math.random() * 9999999999999999).toString()  + "&credit_card_cvv=473&credit_card_expiration_year=2023&credit_card_expiration_month=10&user_id=john&address_street_address=Elastic+Avenue&address_city=Denver&address_state=Colorado&address_country=USA&address_zip_code=80022",
        headers: {'X-Forwarded-For': '123.123.123.123', 'User-Agent': ''},
        timeout: 1000
      });
    }

    request.put({
        url:"http://" + frontendNode + ":3000" +  "/api/checkout?email=dev@gallivant.inc&credit_card_credit_card_number=340000000000009&credit_card_cvv=473&credit_card_expiration_year=2023&credit_card_expiration_month=10&user_id=john&address_street_address=Elastic+Avenue&address_city=Denver&address_state=Colorado&address_country=USA&address_zip_code=80022",
        headers: {'X-Forwarded-For': '123.123.123.123', 'User-Agent': ''},
        timeout: 1000
    }, function(error, response, body){
      handleResponse(res, response);
    });


  })
  .listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Running on localhost:${PORT}`);
  });
