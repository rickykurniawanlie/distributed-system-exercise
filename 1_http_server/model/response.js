var HttpStatus = require('http-status');

const CRLF = '\r\n';

var Response = function () {
  this.version = 'HTTP/1.1';
  this.status = HttpStatus.OK;
  this.headers = [];
  this.body = [];
}

Response.prototype.getHeader = function (name) {
  return this.headers[name];
}

Response.prototype.getHeaders = function (name) {
  return this.headers;
}

Response.prototype.write = function (str) {
  if (typeof str === 'undefined') {
    str = '';
  }
  this.body.push(str);
}

Response.prototype.writeHead = function (key, value, attr) {
  if (attr) {
    value += ';';
    for (var idx in attr) {
      value += idx + attr[idx];
    }
  }
  this.headers[key] = value;
}

Response.prototype.headerExists = function (key) {
  return (this.headers[key])? true : false;
}

Response.prototype.send = function (code, message) {
  this.status = code;
  this.write(message);
  this.end();
}

Response.prototype.ok = function (message) {
  this.send(HttpStatus.OK, message);
}

Response.prototype.error = function (code, message) {
  this.send(code, message);
}

Response.prototype.notFound = function (message) {
  this.send(HttpStatus.NOT_FOUND, message);
}

Response.prototype.found = function (location) {
  this.status = HttpStatus.FOUND;
  this.writeHead('Location', location);
  this.end();
} 

Response.prototype.end = function (str) {
  if (typeof str === 'string') {
    this.write(str);
  }

  if (this.socket) {
    var sock = this.socket;
    sock.write('HTTP/1.1 ' + this.status + ' ' + HttpStatus[this.status] + CRLF);
    
    var body = this.body.join('\n');
    
    if (!this.headerExists('Content-Type')) {
      this.writeHead('Content-Type', 'text/plain');
    }
    this.writeHead('Content-Length', body.length);

    for (let key in this.headers) {
      sock.write(key + ': ' + this.headers[key] + CRLF);
    }
    sock.write(CRLF);
    sock.write(body);
    sock.end();

  } else {
    console.log('No socket found');
  }
}

module.exports = Response;
