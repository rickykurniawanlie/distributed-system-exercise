var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

module.exports = {
  register: function (req, res) {
    console.log('register');
    res.send('OK');
  },
  getSaldo: function (req, res) {

  },
  getTotalSaldo: function (req, res) {

  },
  transfer: function (req, res) {

  }
}