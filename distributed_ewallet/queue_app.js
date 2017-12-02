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

// app.subscribeDirect('EX_REGISTER', 'REQ_' + process.env.APP_ID, async function (req, res) {
//   await ewalletService.registerUser(req.user_id, req.name, 0, function (result) {
//     var response = {
//       'action': 'register',
//       'type': 'response',
//       'status_register': result,
//       'ts': getTimestamp(new Date())
//     };
//     res('RESP_' + req.user_id, response);
//   });
// });

// app.subscribeDirect('EX_GET_SALDO', 'REQ_' + process.env.APP_ID, async function (req, res) {
//   console.log(infraQueueController.getQuorumSize());
//   await ewalletService.getLocalBalance(req.user_id, function (result) {
//     var response = {
//       'action': 'get_saldo',
//       'type': 'response',
//       'nilai_saldo': result,
//       'ts': getTimestamp(new Date())
//     };
//     res('RESP_' + req.user_id, response);
//   });
// });

// app.subscribeDirect('EX_TRANSFER', 'REQ_' + process.env.APP_ID, async function (req, res) {
//   await ewalletService.transfer(req.user_id, req.nilai, function (result) {
//     var response = {
//       'action': 'transfer',
//       'type': 'response',
//       'status_transfer': result,
//       'ts': getTimestamp(new Date())
//     };
//     res('RESP_' + req.user_id, response);
//   });
// });

// app.subscribeDirect('EX_GET_TOTAL_SALDO', 'REQ_' + process.env.APP_ID, async function (req, res) {
//   var user_id = req.user_id + "";   // convert to string

//   var callback = function (result) {
//     var response = {
//       'action': 'get_total_saldo',
//       'type': 'response',
//       'nilai_saldo': result,
//       'ts': getTimestamp(new Date())
//     };
//     res('RESP_' + req.user_id, response);
//   };

//   if (req.user_id === process.env.APP_ID) {
//     await ewalletService.getHostGlobalBalance(callback);
//   } else {
//     await ewalletService.getGlobalBalance(req.user_id, callback);
//   }
// });
