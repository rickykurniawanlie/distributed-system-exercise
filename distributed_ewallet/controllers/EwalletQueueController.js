let ERROR_CODES = require('../const/errorConstant');
let printf = require('printf');

module.exports = function (ewalletService, clusterService) {
  var getTimestamp = function (date) {
    return printf('%02d-%02d-%02d %02d:%02d:%02d',
      date.getFullYear(), date.getMonth(), date.getDate(),
      date.getHours(), date.getMinutes(), date.getSeconds()
    );
  };

  return {
  register: async function (req, res) {
    if (!req.user_id || !req.name || !req.sender_id) return;

    await ewalletService.registerUser(req.user_id, req.name, 0, function (result) {
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
    console.log(req);

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

    var callback = function (result) {
      var response = {
        'action': 'get_total_saldo',
        'sender_id': process.env.APP_ID + '',
        'type': 'response',
        'nilai_saldo': result,
        'ts': getTimestamp(new Date())
      };
      res('RESP_' + req.sender_id, response);
    };

    if (req.user_id === process.env.APP_ID) {
      await ewalletService.getHostGlobalBalance(callback);
    } else {
      await ewalletService.getGlobalBalance(req.user_id, callback);
    }
  },
  transfer: async function (req, res) {
    if (!req.user_id || !req.nilai || !req.sender_id) return;

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