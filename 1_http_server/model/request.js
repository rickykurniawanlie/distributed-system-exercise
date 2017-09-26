var Request = function (raw) {
  this.raw = raw;
}

Request.prototype.setRequestLine = function (requestLine) {
  this.method = requestLine.method;
  this.uri = requestLine.uri;
  this.version = requestLine.version;
  this.input = requestLine.input;
}

Request.prototype.setHeaders = function (headers) {
  this.headers = headers;
}

Request.prototype.setBody = function (body) {
  this.body = body;
}

Request.prototype.getHeader = function (name) {
  return this.headers[name];
}

Request.prototype.getHeaders = function (name) {
  return this.headers;
}

module.exports = Request;
