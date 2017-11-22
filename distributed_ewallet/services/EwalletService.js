let User = require('../models/user');
let rp = require('request-promise');
let promise = require('bluebird');
let ERROR_CODES = require('../const/errorConstant');
let axios = require('axios');

class EwalletService {
  constructor(clusterService) {
    this.clusterService = clusterService;
  }

  async registerUser(req, res) {
    let newUser = new User({
      _id: req.body.user_id,
      name: req.body.nama,
      balance: 0
    });
    newUser.save(function (err) {
      if (err) {
        res.json({ 'status_register': ERROR_CODES['DATABASE'] })
      } else {
        res.json({ 'status_register': ERROR_CODES['SUCCESS'] });
      }
    });
  }

  async getLocalBalance(req, res) {
    User.find({ _id: req.body.user_id}, function (err, users) {
      if (users.length === 0) {
        return res.json({ 'nilai_saldo': ERROR_CODES['UNREGISTERED']});
      }
      return res.json({ 'nilai_saldo': users[0].balance });
    });
  }

  async getGlobalBalance(user_id, callback) {
    console.log('[totalSaldo][' + user_id + ']');
    console.log('[totalSaldo][' + user_id + '] Get IP');
    var user_ip = await this.clusterService.getIpById(user_id);
    console.log('[totalSaldo][' + user_id + '] IP: ' + user_ip);
    if (!user_ip) {
      console.log('[totalSaldo][' + user_id + '] Not registered');
      return callback(ERROR_CODES['UNREGISTERED']);
    }

    // Check inconsistent service repository
    var this_user_ip = await this.clusterService.getIpById(process.env.APP_ID);
    if (this_user_ip === user_ip) {
      return callback(ERROR_CODES['INCONSISTENT_DATA']);
    }

    try {
      console.log('[totalSaldo][' + user_id + '] Send request to ' + user_ip);
      var response = await axios({
        method: 'POST',
        url: 'http://' + user_ip + '/ewallet/getTotalSaldo',
        data: { 'user_id': user_id },
        json: true,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      console.log('[totalSaldo][' + user_id + '] Result:');
      console.log(response.data);
      return callback(response.data.nilai_saldo);
    } catch (e) {
      console.log('[totalSaldo][' + user_id + '] Failed');
      console.log(e);
      return callback(ERROR_CODES['UNDEFINED']);
    }
  }

  async getHostGlobalBalance(callback) {
    var user_id = process.env.APP_ID;
    let nodes = await this.clusterService.getMembers();

    let successCount = 0;
    let totalNode = 0;
    let unreachableNode = [];
    let errorNode = []
    let totalBalance = 0;

    let promises = [];
    for (nodeId in nodes) {
      totalNode++;
      var options = {
        method: 'POST',
        url: 'http://' + nodes[nodeId] + '/ewallet/getSaldo',
        body: { 'user_id': user_id },
        json: true
      };
      promise = rp(options).then(function (body) {
        var nilaiSaldo;
        try {
          nilaiSaldo = parseInt(body.nilai_saldo);
          if (nilaiSaldo >= 0) {
            totalBalance += body.nilai_saldo;
            successCount++;
          } else {
            console.log('[totalSaldo][host] ip:' + nodes[nodeId] + '; nilai_saldo: ' + nilaiSaldo);
          }
        } catch (e) {
          errorNode.push(nodeId);
        }
      }).catch(function(error) {
        unreachableNode.push(nodeId);
      });
      promises.push(promise);
    }
    Promise.all(promises).then(function (result) {
      console.log('Result of quorum = ' + successCount + '/' + totalNode + '. Required 100%');
      if (successCount === totalNode)
        callback(totalBalance);
      else {
        console.log('[getTotalSaldo] unreachable: ' + JSON.stringify(unreachableNode));
        console.log('[getTotalSaldo] error: ' + JSON.stringify(errorNode));
        callback(ERROR_CODES['HOST_DOWN']);
      }
    });
  }

  async transfer(req, res) {
    console.log('[Transfer] Start');
    if (req.body.nilai < 0 || req.body.nilai > 1000000000) {
      return res.json({ 'status_transfer': ERROR_CODES['LIMIT_EXCEEDED']});
      console.log('[Transfer] Limit exceeded');
    }

    try {
      console.log('[Transfer] Find user');
      var userResult = await User.findOneAndUpdate({ _id: req.body.user_id }, {
        $inc: { balance: req.body.nilai }
      }, function (err, data) {
        console.log('[Transfer] Read DB error');
        console.log(err);
        console.log('[Transfer] Read DB result');
        console.log(data);
        if (!data) {
          return res.json({ 'status_transfer': ERROR_CODES['UNREGISTERED']});
        } else {
          return res.json({ 'status_transfer': ERROR_CODES['SUCCESS'] });
        }
      });
    } catch (e) {
      return res.json({ 'status_transfer': ERROR_CODES['DATABASE']});
    }
  }
}

module.exports = EwalletService;
