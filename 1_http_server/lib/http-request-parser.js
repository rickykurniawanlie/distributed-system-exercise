/*
 * Module to parse HTTP header to a request object
 */
var Request = require('../model/request.js');

const CRLF = '\r\n';
const HTTP_METHOD = require('methods');

var Parser = (function () {
  function parseQuery (queryString) {
    var input = {};
    var queries = queryString.split('&');
    for (var i = 0; i < queries.length; i++) {
      var entry = queries[i].split('=');
      input[entry[0]] = entry[1];
    }
    return input;
  }

  function parseRequestLine(reqLine) {
    var arr = reqLine.split(' ');

    if (arr.length !== 3) {
      throw new Error('Invalid Request Line');
    }

    if (!HTTP_METHOD.includes(arr[0].toLowerCase())) {
      throw new Error('Unknown HTTP Method');
    }

    var uriComponents = arr[1].split('?');
    var uri = uriComponents[0];
    var input = [];
    if (uriComponents.length > 1) {
      input = parseQuery(uriComponents[1]);
    }

    return {
      method: arr[0],
      uri: uri,
      input: input,
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

  function parse(req) {
    var lines = req.raw.split(CRLF);

    if (lines.length < 1) {
      throw new Error('500');
    }

    req.setRequestLine(parseRequestLine(lines[0]));

    var i = 1;
    var headers = {};
    while (lines[i] !== '') {
      var header = parseHeader(lines[i]);
      headers[header.key] = header.value;
      i = i + 1;
    }
    req.setHeaders(headers);

    i = i + 1; // Skip header-body-separator

    if (req.getHeader('Content-Type') === 'application/x-www-form-urlencoded') {
      req.input = parseQuery(lines[i].replace('+', ' '));
    } else if (req.getHeader('Content-Type') === 'application/json') {
      // console.log('[DEBUG] CType json: ' + lines[i]);
      req.input = JSON.parse(lines[i]);
    }
    var body = lines[i];
    req.setBody(body);
  }

  return {
    parse: parse
  };
})();

module.exports = Parser;