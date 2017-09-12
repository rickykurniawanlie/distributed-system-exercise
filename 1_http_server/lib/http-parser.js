/*
 * Module to parse HTTP header to a request object
 */
var Request = require('../model/request.js');

const CRLF = '\r\n';
const HTTP_METHOD = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];

var Parser = (function () {
  function parseRequestLine(reqLine) {
    var arr = reqLine.split(' ');

    if (arr.length !== 3) {
      throw new Error('Invalid Request Line');
    }

    if (!HTTP_METHOD.includes(arr[0])) {
      throw new Error('Unknown HTTP Method');
    }

    return {
      method: arr[0],
      uri: arr[1],
      version: arr[2]
    }
  }

  function parseHeader(header) {
    var arr = [];

    arr[0] = header.substring(0, header.indexOf(':'));
    arr[1] = header.substring(header.indexOf(':') + 1);

    return {
      key: arr[0].trim(),
      value: arr[1].trim()
    }
  }

  function parse(data) {
    var lines = data.split(CRLF);

    if (lines.length < 1) {
      throw new Error('500');
    }

    var requestLine = parseRequestLine(lines[0]);

    var i = 1;
    var headers = {};
    while (lines[i] !== '') {
      var header = parseHeader(lines[i]);
      headers[header.key] = header.value;
      i = i + 1;
    }

    i = i + 1; // Skip header-body-separator
    // TODO: Handle body parsing.
    var body = 'TODO: Ricky';
    return new Request(
        requestLine,
        headers,
        body
    );
  }

  return {
    parse: parse
  };
})();
module.exports = Parser;