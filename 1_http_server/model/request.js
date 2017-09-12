var Request = function (requestLine, headers, body) {
  this.method = requestLine.method;
  this.uri = requestLine.uri;
  this.version = requestLine.version;
  this.headers = headers;
  this.body = body;
}

Request.prototype.getHeader = function (name) {
  return this.headers[name];
}

Request.prototype.getHeaders = function (name) {
  return this.headers;
}

module.exports = Request;
