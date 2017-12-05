var dotenv = require('dotenv').config()
var MemoryCache = require('memory-cache').Cache;
var mongoose = require('mongoose');
var Qiu = require('./qiu');
var printf = require('printf');

mongoose.Promise = require('bluebird');
try {
  mongoose.connect(process.env.MONGO_STRING);
} catch (err) {
  console.log(err);
}

/**
 * Accessors
 */
var clusterCache = new MemoryCache('CLUSTER');
var ClusterCachedAccessor = require('./accessors/ClusterCachedAccessor');
var clusterCachedAccessor = new ClusterCachedAccessor(clusterCache);

/**
 * Services
 */
var ClusterService = require('./services/ClusterService');
var clusterService = new ClusterService(clusterCachedAccessor);
var EwalletService = require('./services/EwalletService');
var ewalletService = new EwalletService(clusterService);
var UserService = require('./services/UserService');
var userService = new UserService();

/**
 * Controllers
 */
var infraCache = new MemoryCache('INFRA');
var InfraQueueController = require('./controllers/InfraQueueController');
var infraQueueController = new InfraQueueController(infraCache, clusterService);
var ewalletQueueController = require('./controllers/EwalletQueueController')(ewalletService, clusterService);
var apiQueueController = require('./controllers/ApiQueueController')(clusterService, userService);

var app = new Qiu(process.env.RABBITMQ_URL);

infraQueueController.start(process.env.RABBITMQ_URL,
  {
    name: 'EX_PING',
    type: 'fanout',
    routing_key: '',
    opts: {
      durable: false
    }
  },
  {
    name: '',
    type: 'fanout',
    routing_key: '',
    opts: {
      exclusive: true
    }
  }
);

var routingKey = 'REQ_' + process.env.APP_ID;
app.subscribeDirect('EX_REGISTER', routingKey, ewalletQueueController.register);
app.subscribeDirect('EX_GET_SALDO', routingKey, ewalletQueueController.getSaldo);
app.subscribeDirect('EX_TRANSFER', routingKey, ewalletQueueController.transfer);
app.subscribeDirect('EX_GET_TOTAL_SALDO', routingKey, ewalletQueueController.getTotalSaldo);
