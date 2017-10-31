let ERROR_CODES = require('../const/errorConstant');

module.exports = function (ewalletService, clusterService) { return {
  register: async function (req, res) {
    if (!req.quorum || req.quorum !== 'ok') {
      return res.json({ "status_register": ERROR_CODES['QUORUM']});
    }

    let isOk = req.body.user_id && req.body.nama;
    if (!isOk) {
      return res.json({ "status_register": ERROR_CODES['UNDEFINED'] });
    }

    await ewalletService.registerUser(req, res);
  },
  getSaldo: async function (req, res) {
    if (!req.quorum || req.quorum !== 'ok') {
      return res.json({ 'nilai_saldo': ERROR_CODES['QUORUM']});
    }

    if (!req.body.user_id) {
      return res.json({ 'nilai_saldo': ERROR_CODES['UNDEFINED']});
    }

    await ewalletService.getLocalBalance(req, res);
  },
  getTotalSaldo: async function (req, res) {
    if (!req.quorum || req.quorum !== 'ok') {
      return res.json({ "nilai_saldo": ERROR_CODES['QUORUM']});
    }

    var user_id = req.body.user_id + "";   // convert to string
    var callback = function (balance) {
      res.json({
        'nilai_saldo': balance
      });
    };

    if (user_id === process.env.APP_ID) {
      await ewalletService.getHostGlobalBalance(callback);
    } else {
      await ewalletService.getGlobalBalance(user_id, callback);
    }
  },
  transfer: async function (req, res) {
    if (!req.quorum || req.quorum !== 'ok') {
      return res.json({ "status_register": ERROR_CODES['QUORUM']});
    }

    let isOk = req.body.user_id && req.body.nilai;
    if (!isOk) {
      return res.json({ "status_transfer": ERROR_CODES['UNDEFINED']});
    }

    await ewalletService.transfer(req, res);
  }
}}