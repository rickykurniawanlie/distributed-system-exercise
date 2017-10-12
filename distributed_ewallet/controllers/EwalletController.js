let User = require('../models/user');

const ERROR_CODES = {
  'SUCCESS': 1,
  'UNREGISTERED': -1,
  'QUORUM': -2,
  'DATABASE': -4,
  'UNDEFINED': -99
};

module.exports = {
  register: function (req, res) {
    if (!req.quorum || req.quorum !== 'ok') {
      return res.json({ "status_register": ERROR_CODES['QUORUM']});
    }

    let isOk = req.body.user_id && req.body.nama;
    if (!isOk) {
      return res.json({ "status_register": ERROR_CODES['UNDEFINED'] });
    }

    let newUser = new User({
      _id: req.body.user_id,
      name: req.body.nama,
      balance: 0
    });
    newUser.save(function (err) {
      if (err) {
        res.json({ "status_register": ERROR_CODES['DATABASE']})
      } else {
        res.json({ "status_register": ERROR_CODES['SUCCESS'] });
      }
    });
  },
  getSaldo: function (req, res) {
    console.log('enter get saldo');
    if (!req.quorum || req.quorum !== 'ok') {
      return res.json({ 'nilai_saldo': ERROR_CODES['QUORUM']});
    }

    if (!req.body.user_id) {
      return res.json({ 'nilai_saldo': ERROR_CODES['UNDEFINED']});
    }

    User.find({ _id: req.body.user_id}, function (err, users) {
      if (users.length === 0) {
        return res.json({ 'nilai_saldo': ERROR_CODES['UNREGISTERED']});
      }
      return res.json({ 'nilai_saldo': users[0].balance });
    });
  },
  getTotalSaldo: function (req, res) {
    res.sendStatus(501);
  },
  transfer: function (req, res) {
    res.sendStatus(501);
  }
}