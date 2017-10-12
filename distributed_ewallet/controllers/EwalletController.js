let User = require('../models/user');

const ERROR_CODES = {
  'SUCCESS': 1,
  'QUORUM': -2,
  'DATABASE': -4,
  'UNDEFINED': -99
};

module.exports = {
  register: function (req, res) {
    if (!req.quorum) {
      return res.json({ "status_register": ERROR_CODES['QUORUM']});
    }

    let isOk = req.body.user_id && req.body.nama;
    console.log(req.body);
    if (!isOk) {
      console.log('bad format');
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
    res.sendStatus(501);
  },
  getTotalSaldo: function (req, res) {
    res.sendStatus(501);
  },
  transfer: function (req, res) {
    res.sendStatus(501);
  }
}