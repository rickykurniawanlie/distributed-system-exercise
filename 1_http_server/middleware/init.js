var Request = require('../model/request.js');
var Response = require('../model/response.js');
var httpRequestParser = require('../lib/http-request-parser');
var HttpStatus = require('http-status');

module.exports = function middlewareInit(req, res, next) {
  try {
    httpRequestParser.parse(req);
    next();
  } catch (err) {
    console.log(err);
    res.error(HttpStatus.BAD_REQUEST);
    return;
  }
};