var axios = require('axios');
var ERROR_CODES = require('../const/errorConstant');
var User = require('../models/user');

module.exports = function (clusterService, userService) { return {
  ping: async function (req, res) {
    var destUrl = req.body.destUrl;

    try {
      var response = await axios({
        method: 'post',
        url: 'http://' + destUrl + '/ewallet/ping',
        timeout: 1000
      });
      res.json(response.data);
    } catch (e) {
      console.log(e);
      res.json({ error: 'Failed to connect to ' + destUrl });
    }
  },
  register: async function (req, res) {
    var destUrl = req.body.destUrl;
    var user_id = req.body.user_id;
    var nama = req.body.nama;

    try {
      var response = await axios({
        method: 'post',
        url: 'http://' + destUrl + '/ewallet/register',
        timeout: 1000,
        json: true,
        data: { user_id: user_id, nama: nama }
      });
      res.json(response.data);
    } catch (e) {
      console.log(e);
      res.json({ error: 'Failed to connect to ' + destUrl });
    }
  },
  saldo: async function (req, res) {
    var destUrl = req.body.destUrl;
    var user_id = req.body.user_id;

    try {
      var response = await axios({
        method: 'post',
        url: 'http://' + destUrl + '/ewallet/getSaldo',
        timeout: 1000,
        json: true,
        data: { user_id: user_id }
      });
      res.json(response.data);
    } catch (e) {
      console.log(e);
      res.json({ error: 'Failed to connect to ' + destUrl });
    }
  },
  totalSaldo: async function (req, res) {
    var destUrl = req.body.destUrl;
    var user_id = req.body.user_id;

    try {
      var response = await axios({
        method: 'post',
        url: 'http://' + destUrl + '/ewallet/getTotalSaldo',
        timeout: 1000,
        json: true,
        data: { user_id: user_id }
      });
      res.json(response.data);
    } catch (e) {
      console.log(e);
      res.json({ error: 'Failed to connect to ' + destUrl });
    }
  },
  transfer: async function(req, res) {
    var user_id = req.body.user_id;
    var amount = req.body.amount;
    var destUserId = req.body.destUserId;
    var destUserIp;

    try {
      // Check if user exists in local db
      accountOwner = await userService.getUser(user_id);
      if (!accountOwner) {
        return res.json({ 'status_transfer': ERROR_CODES['UNREGISTERED'] });
      }

      // Check destination user id's IP
      destUserIp = await clusterService.getIpById(destUserId);
      if (!destUserIp) {
        return res.json({ 'status_transfer': ERROR_CODES['IP_NOT_FOUND'] });
      }

      // Check amount that is going to be sent
      if (amount < 0 || amount > 1000000000) {
        return res.json({ 'status_transfer': ERROR_CODES['LIMIT_EXCEEDED'] });
      }

      User.findOneAndUpdate({ _id: user_id, balance: { '$gte': amount } }, {
        '$inc': { balance: amount * -1 }
      }, async function (err, data) {
        if (err)
          return res.json({
            'status_transfer': ERROR_CODES['DATABASE'],
            'message': 'Error saat mengurangi dana saat pra-transaksi'
          });

        if (!data) {
          return res.json({
            'status_transfer': ERROR_CODES['UNDEFINED'],
            'message': 'Dana tidak mencukupi'
          })
        }

        console.log(data);

        var destResponse = await axios({
          method: 'post',
          url: 'http://' + destUserIp + '/ewallet/transfer',
          timeout: 1000,
          json: true,
          headers: {'Content-Type': 'application/json', 'Accepts': 'application/json'},
          data: { user_id: user_id, nilai: amount }
        });

        if (!destResponse.data.status_transfer ||
            destResponse.data.status_transfer != 1) {
          User.findOneAndUpdate({ _id: user_id }, {
            '$inc': { balance: amount }
          }, function (err, data) {
            if (!err) {
              return res.json({
                'status_transfer': ERROR_CODES['DATABASE'],
                'message': 'Gagal mengembalikan dana pra-tansaksi karena error DB di ' + process.env.APP_URL
              });
            } else {
              return res.json({
                'status_transfer': destResponse.data.status_transfer
              });
            }
          });
        } else {
          return res.json({ 'status_transfer': destResponse.data.status_transfer });
        }
      });

    } catch (e) {
      console.log(e);
      return res.json({
        'status_transfer': ERROR_CODES['UNDEFINED'],
        'message': 'Response cannot be parsed'
      });
    }
  },
  getIpFromId: async function (req, res) {
    var ip = await clusterService.getIpById(req.params.user_id);
    res.json({
      ip: ip,
      status: 'OK'
    });
  }
};}