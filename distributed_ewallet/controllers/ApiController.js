let axios = require('axios');
let ERROR_CODES = require('../const/errorConstant');

module.exports = function (clusterService, userService) { return {
  transfer: async function(req, res) {
    var user_id = req.body.user_id;
    var amount = req.body.amount;
    var destUserId = req.body.destUserId;
    var destUserIp;

    try {
      accountOwner = await userService.getUser(user_id);
      if (!accountOwner) {
        return res.json({ 'status_transfer': ERROR_CODES['UNREGISTERED'] });
      }

      destUserIp = await clusterService.getIpById(destUserId);
      if (!destUserIp) {
        return res.json({ 'status_transfer': ERROR_CODES['IP_NOT_FOUND'] });
      }

      if (amount < 0 && amount > 1000000000) {
        return res.json({ 'status_transfer': ERROR_CODES['LIMIT_EXCEEDED'] });
      }

      var destResponse = await axios({
        method: 'post',
        url: 'http://' + destUserIp + '/ewallet/transfer',
        timeout: 1000,
        json: true,
        data: { user_id: user_id, nilai: amount }
      });

      console.log(destResponse.data);

      if (!destResponse.data.status_transfer) {
        return res.json({
          'status_transfer': ERROR_CODES['UNDEFINED'],
          'message': 'Response cannot be parsed'
        });
      }

      destResponse.data.status_transfer += '';
      if (destResponse.data.status_transfer === '1') {
        var userResult = await User.findOneAndUpdate({ _id: user_id }, {
          $dec: { balance: amount }
        });
        return res.json({
          'status_transfer': destResponse.data.status_transfer
        });
      }
    } catch (e) {
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