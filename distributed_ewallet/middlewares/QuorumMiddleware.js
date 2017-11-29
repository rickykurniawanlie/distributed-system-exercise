// TODO: Get list of cluster member.
// TODO: Get list of IPs from service repository.
// TODO: Ping every IPs
// TODO: Count quorum
let rp = require('request-promise');
let promise = require('bluebird');
let axios = require('axios');

module.exports = function (clusterService) {

  return {
    any: function(req, res, next) {
      req.quorum = 'ok';
      next();
    },
    majority: async function (req, res, next) {
      let nodes = await clusterService.getMembers();
      let healthyNode = 0;
      let totalNode = 0;
      let promises = [];

      for (nodeId in nodes) {
        totalNode++;
        // var options = {
        //   method: 'POST',
        //   url: 'http://' + nodes[nodeId] + '/ewallet/ping',
        //   body: {},
        //   json: true
        // };
        // promise = rp(options).then(function (body) {
        //   console.log(body);
        //   healthyNode++;
        // }).catch(function(error) {
        //   // console.log(error);
        // });
        // promises.push(promise);

        promise = axios({
          method: 'post',
          url: 'http://' + nodes[nodeId] + '/ewallet/ping',
          timeout: 2000
        }).then(function (response) {
          healthyNode++;
        }).catch(function (error) {
          console.log('[Quorum] Failed: ' + nodes[nodeId]);
        });
        promises.push(promise);
      }
      Promise.all(promises).then(function (result) {
        console.log('[Quorum] Result: ' + healthyNode + '/' + totalNode + '. Required >50%');
        if (healthyNode/totalNode > 0.5)
          req.quorum = 'ok';
        else
          req.quorum = null;
        next();
      });
    },
    full: async function (req, res, next) {
      let nodes = await clusterService.getMembers();
      let healthyNode = 0;
      let totalNode = 0;
      let promises = [];

      for (nodeId in nodes) {
        totalNode++;
        promise = axios({
          method: 'post',
          url: 'http://' + nodes[nodeId] + '/ewallet/ping',
          timeout: 1000
        }).then(function (response) {
          healthyNode++;
        }).catch(function (error) {
          console.log('[Quorum] Failed: ' + nodes[nodeId]);
        });
        promises.push(promise);
      }
      Promise.all(promises).then(function (result) {
        console.log('[Quorum] Result: ' + healthyNode + '/' + totalNode + '. Required 100%');
        if (healthyNode/totalNode === 1)
          req.quorum = 'ok';
        else
          req.quorum = null;
        next();
      });
    }
  }
}
