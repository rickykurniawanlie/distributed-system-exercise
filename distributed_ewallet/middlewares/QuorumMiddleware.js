// TODO: Get list of cluster member.
// TODO: Get list of IPs from service repository.
// TODO: Ping every IPs
// TODO: Count quorum
let rp = require('request-promise');
let promise = require('bluebird');

module.exports = function (clusterService) {

  return {
    any: function(req, res, next) {
      req.quorum = 'ok';
      next();
    },
    majority: async function (req, res, next) {
      let nodes = await clusterService.getMembers();
      console.log(nodes);
      let healthyNode = 0;
      let totalNode = 0;
      let promises = [];

      for (nodeId in nodes) {
        console.log(nodes[nodeId]);
        totalNode++;
        var options = {
          method: 'POST',
          url: 'http://' + nodes[nodeId] + '/ewallet/ping',
          body: {},
          json: true
        };
        promise = rp(options).then(function (body) {
          console.log(body);
          healthyNode++;
        }).catch(function(error) {
          // console.log(error);
        });
        promises.push(promise);
      }
      Promise.all(promises).then(function (result) {
        console.log('Result of quorum = ' + healthyNode + '/' + totalNode);
        if (healthyNode/totalNode > 0.5)
          req.quorum = 'ok';
        else
          req.quorum = null;
        next();
      });
    },
    full: async function (req, res, next) {
      let nodes = await clusterService.getMembers();
      console.log(nodes);
      let healthyNode = 0;
      let totalNode = 0;
      let promises = [];

      for (nodeId in nodes) {
        console.log(nodes[nodeId]);
        totalNode++;
        var options = {
          method: 'POST',
          url: 'http://' + nodes[nodeId] + '/ewallet/ping',
          body: {},
          json: true
        };
        promise = rp(options).then(function (body) {
          console.log(body);
          healthyNode++;
        }).catch(function(error) {
          // console.log(error);
        });
        promises.push(promise);
      }
      Promise.all(promises).then(function (result) {
        console.log('Result of quorum = ' + healthyNode + '/' + totalNode);
        if (healthyNode/totalNode === 1)
          req.quorum = 'ok';
        else
          req.quorum = null;
        next();
      });
    }
  }
}