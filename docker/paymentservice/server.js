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

const cardValidator = require('simple-card-validator');
const uuid = require('uuid/v4');
const pino = require('pino');
var sleep = require('sleep');


var apm = require('elastic-apm-node').start({
  serviceName: process.env.ELASTIC_APM_SERVICE_NAME,
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
})

const logger = pino({
  name: 'paymentservice-server',
  timestamp: () => `,"@timestamp":"${Date.now()}"`,  
  messageKey: 'message',
  changeLevelName: 'log.level',
  useLevelLabels: true,
  mixin () {
    return { 
      "process.pid": process.pid,
      "event.dataset": process.env.ELASTIC_APM_SERVICE_NAME + ".log" ,
      "trace.id": apm.currentTraceIds["trace.id"]
    }
  }
});
var sleep = require('sleep');


// attach to transaction
class CreditCardError extends Error {
  constructor (message, code) {
    super(message);
    this.code = code; // Invalid argument error
  }
}

class InvalidCreditCard extends CreditCardError {
  constructor (cardType, code) {
    super(`Credit card info is invalid`, code);
  }
}

class UnacceptedCreditCard extends CreditCardError {
  constructor (cardType, code) {
    super(`We cannot process ${cardType} credit cards. Only VISA or MasterCard is accepted.`, code);
  }
}

class ExpiredCreditCard extends CreditCardError {
  constructor (number, month, year, code) {
    super(`Your credit card (ending ${number.substr(-4)}) expired on ${month}/${year}`, code);
  }
}

function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * Verifies the credit card number and (pretend) charges the card.
 *
 * @param {*} request
 * @return transaction_id - a random uuid v4.
 */
function charge (request, transaction) {
  var span = apm.startSpan('charge');
  const { amount, credit_card: creditCard, user_id } = request;
  transaction.setLabel('userId',user_id);
  toggle = Math.random()
  var countries = [ "Brazil", "Mexico", "Colombia", "Argentina", "United States", "United States", "United States", "United States", "United States", "United States", "United States", "United States", "Canada","Canada","Canada","United States", "Canada","China","China", "China", "Japan"]
  country = countries[Math.floor(Math.random() * countries.length)]
  const cardNumber = creditCard.credit_card_number;
  if (toggle > 0.2) {
    //cardNumber = '3732-8015-6152-045'
    country = 'Canada'
    //sleep.sleep(35)
  }
  span.setLabel('country',country);


  const cardInfo = cardValidator(cardNumber);
  const {
    card_type: cardType,
    valid
  } = cardInfo.getCardDetails();

  // if (!valid) { throw new InvalidCreditCard(); }

  toggle = Math.random()
  transaction.addLabels({'cardType': cardType});

  transaction.setLabel('country',country);

  var year = creditCard.credit_card_expiration_year;
  if (toggle > 0.9 && !user_id.includes('@')) {
    year = 19
  }

  //if (toggle > 0.95) {
   // sleep.msleep(Math.random() * 500 + 100)
   // span.setLabel('toggle', "true");
   // span.transaction.setLabel('toggle', "true");
  //} else {
  //  span.setLabel('toggle', "false");
  //  span.transaction.setLabel('toggle', "false");
  //}

  // Only VISA and mastercard is accepted, other card types (AMEX, dinersclub) will
  // throw UnacceptedCreditCard error.
  if (!(cardType === 'visa' || cardType === 'mastercard')) { throw new UnacceptedCreditCard(cardType, 405); }

  // Also validate expiration is > today.
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { credit_card_expiration_month: month } = creditCard;
  if ((currentYear * 12 + currentMonth) > (year * 12 + month)) { throw new ExpiredCreditCard(cardNumber.replace('-', ''), month, year, 401); }

  logger.info(`Transaction processed: ${cardType} ending ${cardNumber.substr(-4)} \
    Amount: ${amount.currency_code}${amount.units}.${amount.nanos}`);
  const transaction_id = uuid();
  span.setLabel('transaction_id', transaction_id);
  span.end()
  return { transaction_id: transaction_id };
};

const path = require('path');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');





class GallivantShopServer {
  constructor (protoRoot, port = GallivantShopServer.PORT) {
    this.port = port;

    this.packages = {
      gallivant: this.loadProto(path.join(protoRoot, 'demo.proto')),
      health: this.loadProto(path.join(protoRoot, 'grpc/health/v1/health.proto'))
    };

    this.server = new grpc.Server();
    this.loadAllProtos(protoRoot);
  }

  /**
   * Handler for PaymentService.Charge.
   * @param {*} call  { ChargeRequest }
   * @param {*} callback  fn(err, ChargeResponse)
   */
  static ChargeServiceHandler (call, callback) {
    try {
      logger.info('Getting supported currencies...');
      const traceparents = call.metadata.get('elastic-apm-traceparent');
      var traceparent = null;
      if (traceparents.length > 0) {
        traceparent = traceparents[0];
      }
      var transaction = apm.startTransaction('/gallivant.PaymentService/ChargeServiceHandler', 'request', { childOf: traceparent });
      const json_request = JSON.stringify(call.request);
      logger.info(`PaymentService#Charge invoked with request ${json_request}`);

      //apm.setCustomContext(json_request);
      const response = charge(call.request, transaction);
      const { amount, credit_card: creditCard } = call.request;
      transaction.addLabels({'amount': amount.units, 'currency_code': amount.currency_code, 'charged': true });
      var span = transaction.startSpan('send_response', 'channel_write');
      callback(null, response);
      span.end();
      transaction.setOutcome('success');
      transaction.end('success');
    } catch (err) {
        if (err instanceof UnacceptedCreditCard) {
            logger.error(err);
            callback(err);
            transaction.addLabels({'chargeCardResponseCode': err.code});
            apm.captureError(err);
            transaction.setOutcome('failure');
            transaction.end('failure');
        } else {
            logger.error(err);
            callback(err);
            transaction.addLabels({'chargeCardResponseCode': err.code});
            apm.captureError(err);
            transaction.setOutcome('failure');
            transaction.end('failure');
        }
    }
  }

  static CheckHandler (call, callback) {
    var transaction = apm.startTransaction('/gallivant.PaymentService/CheckHandler', 'request');
    callback(null, { status: 'SERVING' });
    transaction.setOutcome('success');
    transaction.end('success')
  }

  listen () {
    this.server.bind(`0.0.0.0:${this.port}`, grpc.ServerCredentials.createInsecure());
    logger.info(`PaymentService grpc server listening on ${this.port}`);
    this.server.start();
  }

  loadProto (path) {
    const packageDefinition = protoLoader.loadSync(
      path,
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      }
    );
    return grpc.loadPackageDefinition(packageDefinition);
  }

  loadAllProtos (protoRoot) {
    const gallivantPackage = this.packages.gallivant.gallivant;
    const healthPackage = this.packages.health.grpc.health.v1;

    this.server.addService(
      gallivantPackage.PaymentService.service,
      {
        charge: GallivantShopServer.ChargeServiceHandler.bind(this)
      }
    );

    this.server.addService(
      healthPackage.Health.service,
      {
        check: GallivantShopServer.CheckHandler.bind(this)
      }
    );
  }
}

GallivantShopServer.PORT = process.env.PORT;

module.exports = GallivantShopServer;
