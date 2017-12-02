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
    await ewalletService.registerUser(req.user_id, req.name, 0, function (result) {
      var response = {
        'action': 'register',
        'type': 'response',
        'status_register': result,
        'ts': getTimestamp(new Date())
      };
      res('RESP_' + req.user_id, response);
    });
  },
  getSaldo: async function (req, res) {
    await ewalletService.getLocalBalance(req.user_id, function (result) {
      var response = {
        'action': 'get_saldo',
        'type': 'response',
        'nilai_saldo': result,
        'ts': getTimestamp(new Date())
      };
      res('RESP_' + req.user_id, response);
    });
  },
  getTotalSaldo: async function (req, res) {
    var user_id = req.user_id + "";   // convert to string

    var callback = function (result) {
      var response = {
        'action': 'get_total_saldo',
        'type': 'response',
        'nilai_saldo': result,
        'ts': getTimestamp(new Date())
      };
      res('RESP_' + req.user_id, response);
    };

    if (req.user_id === process.env.APP_ID) {
      await ewalletService.getHostGlobalBalance(callback);
    } else {
      await ewalletService.getGlobalBalance(req.user_id, callback);
    }
  },
  transfer: async function (req, res) {
    await ewalletService.transfer(req.user_id, req.nilai, function (result) {
      var response = {
        'action': 'transfer',
        'type': 'response',
        'status_transfer': result,
        'ts': getTimestamp(new Date())
      };
      res('RESP_' + req.user_id, response);
    });
  }
}}