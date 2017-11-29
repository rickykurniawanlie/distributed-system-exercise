let User = require('../models/user');
let rp = require('request-promise');
let promise = require('bluebird');
let ERROR_CODES = require('../const/errorConstant');
let axios = require('axios');

class EwalletService {
  constructor(clusterService) {
    this.clusterService = clusterService;
  }

  async registerUser(user_id, name, balance, cb) {
    let newUser = new User({
      _id: user_id,
      name: name,
      balance: balance
    });
    newUser.save(function (err) {
      if (err) {
        cb(ERROR_CODES['DATABASE']);
      } else {
        cb(ERROR_CODES['SUCCESS']);
      }
    });
  }

  async getLocalBalance(user_id, cb) {
    User.find({ _id: user_id}, function (err, users) {
      if (users.length === 0) {
        return cb(ERROR_CODES['UNREGISTERED']);
      }
      return cb(users[0].balance);
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

  async transfer(user_id, amount, cb) {
    console.log('[Transfer] Start');
    if (amount < 0 || amount > 1000000000) {
      console.log('[Transfer] Limit exceeded');
      return cb(ERROR_CODES['LIMIT_EXCEEDED']);
    }

    try {
      console.log('[Transfer] Find user');
      var userResult = await User.findOneAndUpdate({ _id: user_id }, {
        $inc: { balance: amount }
      }, function (err, data) {
        console.log('[Transfer] Read DB error');
        console.log(err);
        console.log('[Transfer] Read DB result');
        console.log(data);
        if (!data) {
          return cb(ERROR_CODES['UNREGISTERED']);
        } else {
          return cb(ERROR_CODES['SUCCESS']);
        }
      });
    } catch (e) {
      return cb(ERROR_CODES['DATABASE']);
    }
  }
}

module.exports = EwalletService;
