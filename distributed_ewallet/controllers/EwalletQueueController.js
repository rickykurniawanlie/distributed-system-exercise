let ERROR_CODES = require('../const/errorConstant');
let printf = require('printf');
let amqp = require('amqplib/callback_api');
let logger = require('../services/Logger');

module.exports = function (ewalletService, clusterService,  quorumService, ewalletCache) {
  var getTimestamp = function (date) {
    return printf('%02d-%02d-%02d %02d:%02d:%02d',
      date.getFullYear(), date.getMonth(), date.getDate(),
      date.getHours(), date.getMinutes(), date.getSeconds()
    );
  };

  return {
  register: async function (req, res) {
    if (!req.user_id || !req.nama || !req.sender_id) return;

    var isMajority = await quorumService.isMajority();
    if (!isMajority) {
      var response = {
        'action': 'register',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'status_register': ERROR_CODES['QUORUM'],
        'ts': getTimestamp(new Date())
      };
      return res('RESP_' + req.sender_id, response);
    }

    await ewalletService.registerUser(req.user_id, req.nama, 0, function (result) {
      var response = {
        'action': 'register',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'status_register': result,
        'ts': getTimestamp(new Date())
      };
      res('RESP_' + req.sender_id, response);
    });
  },
  getSaldo: async function (req, res) {
    if (!req.user_id || !req.sender_id) return;

    var isMajority = await quorumService.isMajority();
    if (!isMajority) {
      var response = {
        'action': 'get_saldo',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'status_register': ERROR_CODES['QUORUM'],
        'ts': getTimestamp(new Date())
      };
      res('RESP_' + req.sender_id, response);
      return;
    }

    await ewalletService.getLocalBalance(req.user_id, function (result) {
      var response = {
        'action': 'get_saldo',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'nilai_saldo': result,
        'ts': getTimestamp(new Date())
      };
      console.log(response);
      res('RESP_' + req.sender_id, response);
    });
  },
  getTotalSaldo: async function (req, res) {
    if (!req.user_id || !req.sender_id) return;
    var user_id = req.user_id + "";   // convert to string

    var isFullQuorum = await quorumService.isFullQuorum();
    if (!isFullQuorum) {
      var response = {
        'action': 'transfer',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'status_transfer': ERROR_CODES['QUORUM'],
        'ts': getTimestamp(new Date())
      };
      return res('RESP_' + req.sender_id, response);
    }
    const clusterMembers = await clusterService.getMembers();

    var total_saldo = 0;
    var counter = 0;

    /** Create new channel */
    amqp.connect(process.env.RABBITMQ_URL, function(err, conn) {
      if (err) {
        return logger.error('[RABBITMQ] Failed to connect to ' + process.env.RABBITMQ_URL, err);
      }
      conn.createChannel(function(err, ch) {
        if (err) {
          return logger.error('[EX_GET_SALDO] Create channel failed', err);
        }

        const exchangeName = 'EX_GET_SALDO';
        const routeIn = 'RESP_' + process.env.APP_ID;

        console.log('READY to PUBLISH');
        ch.assertExchange(exchangeName, 'direct', { durable: true });

        ch.assertQueue('', { exclusive: true }, function(err, q) {
          if (err) {
            return logger.error('[' + exchangeName + '][' + routeIn + '] Assert queue error', err);
          }
          logger.verbose('[' + exchangeName + '][' + routeIn + '] Queue ' + q.queue + ' created');
          ch.bindQueue(q.queue, exchangeName, routeIn);
          logger.verbose('[' + exchangeName + '][' + routeIn + '] ' + q.queue + ' successfully binded to ' + exchangeName);

          Object.keys(clusterMembers).forEach(function (member_id) {
            ch.publish(exchangeName, 'REQ_' + member_id, new Buffer(JSON.stringify({
              action: 'get_saldo',
              sender_id: process.env.APP_ID + '',
              user_id: member_id,
              type: 'request',
              ts: new Date()
            })));
          });

          ch.consume(q.queue, async function(msg) {
            try {
              logger.verbose('[' + exchangeName + '][' + routeIn + '] ' + q.queue + ' receive a message ' + typeof msg.content.toString());
              let req = JSON.parse(msg.content.toString());
              logger.verbose(req);

              counter = 0;
              total_saldo = total_saldo + parseInt(req.nilai_saldo);
            } catch (e) {
              logger.error(e);
            }
          }, {noAck: true});
          setTimeout(function () {
            ch.close();
          }, 4000);
        });
      });
    });
    setTimeout(async function () {
      console.log('TIMEOUT FOR GET_TOTAL_SALDO REACHED');
      const result = ERROR_CODES['HOST_DOWN'];

      if (counter == clusterMembers.length)
        result = total_saldo;

      var response = {
        'action': 'get_total_saldo',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'nilai_saldo': result,
        'ts': getTimestamp(new Date())
      };
      return res('RESP_' + req.sender_id, response);
    }, 5000);
  },
  transfer: async function (req, res) {
    if (!req.user_id || !req.nilai || !req.sender_id) return;

    var isMajority = await quorumService.isMajority();
    if (!isMajority) {
      var response = {
        'action': 'transfer',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'status_transfer': ERROR_CODES['QUORUM'],
        'ts': getTimestamp(new Date())
      };
      return res('RESP_' + req.sender_id, response);
    }

    await ewalletService.transfer(req.user_id, req.nilai, function (result) {
      var response = {
        'action': 'transfer',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'status_transfer': result,
        'ts': getTimestamp(new Date())
      };
      res('RESP_' + req.sender_id, response);
    });
  }
}}