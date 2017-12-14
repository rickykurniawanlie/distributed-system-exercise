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

var infraCache = new MemoryCache('INFRA');
/**
 * Services
 */
var ClusterService = require('./services/ClusterService');
var clusterService = new ClusterService(clusterCachedAccessor);
var EwalletService = require('./services/EwalletService');
var ewalletService = new EwalletService(clusterService);
var UserService = require('./services/UserService');
var userService = new UserService();
var QuorumService = require('./services/QuorumService');
var quorumService = new QuorumService(infraCache, clusterService)

/**
 * Controllers
 */
var InfraQueueController = require('./controllers/InfraQueueController');
var infraQueueController = new InfraQueueController(quorumService);
var EwalletQueueController = require('./controllers/EwalletQueueController');
var ewalletQueueController = EwalletQueueController(ewalletService, clusterService, quorumService);

var app = new Qiu(process.env.RABBITMQ_URL);

app.start(function() {
  var routingKey = 'REQ_' + process.env.APP_ID;
  app.pubsubFanout('EX_PING', '', infraQueueController.pingSubscribe.bind(infraQueueController));
  app.pubIntervalFanout('EX_PING', '', 5000, infraQueueController.pingPublish.bind(infraQueueController));

  app.pubsubDirect('EX_REGISTER', routingKey, ewalletQueueController.register);
  app.pubsubDirect('EX_GET_SALDO', routingKey, ewalletQueueController.getSaldo);
  app.pubsubDirect('EX_TRANSFER', routingKey, ewalletQueueController.transfer);
  app.pubsubDirect('EX_GET_TOTAL_SALDO', routingKey, ewalletQueueController.getTotalSaldo);
});
