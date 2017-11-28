let ERROR_CODES = require('../const/errorConstant');

module.exports = function (ewalletService, clusterService) { return {
  register: async function (req, res) {
    if (!req.quorum || req.quorum !== 'ok') {
      return res.json({ "status_register": ERROR_CODES['QUORUM']});
    }

    let user_id = req.body.user_id;
    let nama = req.body.nama;
    let isOk = user_id && nama;
    if (!isOk) {
      return res.json({ "status_register": ERROR_CODES['UNDEFINED'] });
    }

    await ewalletService.registerUser(user_id, nama, 0,
      (status) => {
        res.json({ 'status_register': status });
      }
    );
  },
  getSaldo: async function (req, res) {
    if (!req.quorum || req.quorum !== 'ok') {
      return res.json({ 'nilai_saldo': ERROR_CODES['QUORUM']});
    }

    let user_id = req.body.user_id;
    if (!user_id) {
      return res.json({ 'nilai_saldo': ERROR_CODES['UNDEFINED']});
    }

    await ewalletService.getLocalBalance(user_id, (result) => {
      res.json({ 'nilai_saldo': result });
    });
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

    let user_id = req.body.user_id;
    let amount = req.body.nilai;
    let isOk = user_id && nilai;
    if (!isOk) {
      return res.json({ "status_transfer": ERROR_CODES['UNDEFINED']});
    }

    await ewalletService.transfer(user_id, amount, (result) => {
      res.json({ 'status_transfer': result });
    });
  }
}}