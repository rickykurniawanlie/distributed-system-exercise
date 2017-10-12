// TODO: Get list of cluster member.
// TODO: Get list of IPs from service repository.
// TODO: Ping every IPs
// TODO: Count quorum

module.exports = {
  any: function(req, res, next) {
    req.quorum = 'ok';
    next();
  },
  majority: function (req, res, next) {
    // TODO: Implement.
    req.quorum = 'ok';
    next();
  },
  full: function (req, res, next) {
    // TODO: Implement.
    req.quorum = 'ok';
    next();
  }
}