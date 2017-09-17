var HttpStatus = require('http-status');
module.exports = function httpLimitation(req, res, next) {
  if (req.version !== 'HTTP/1.0' && req.version !== 'HTTP/1.1') {
    res.error(HttpStatus.BAD_REQUEST);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.error(HttpStatus.NOT_IMPLEMENTED);
    return;
  }

  next();
}