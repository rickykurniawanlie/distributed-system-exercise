const CRLF = '\r\n';

var net = require('net');
var http = require('./lib/http-parser');
var Middleware = require('./lib/middleware');
var HttpStatus = require('http-status-codes');

var server = net.createServer(function (socket) {
  socket.setEncoding('utf-8');
});
server.on('connection', handleConnection);

server.listen(9000, '127.0.0.1', function() {
  console.log('server listening to %j', server.address());
});

function handleConnection(socket) {
  var remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
  console.log('new client connection from %s', remoteAddress);

  socket.on('data', onConnData);
  socket.once('close', onConnClose);
  socket.on('error', onConnError);

  function onConnData(d) {
    console.log(d.split(CRLF));
    var req;
    var res = {
      version: 'HTTP/1.1',
      status: HttpStatus.OK,
      headers: [
        'X-Powered-By: Ricky',
        'Connection: close'
      ],
      body: ''
    };
    try {
      req = http.parse(d);
    } catch (err) {
      res.status = HttpStatus.BAD_REQUEST;
      buildResponse(res);
      return;
    }

    var middleware = new Middleware();

    middleware.use(function (next) {
      var self = this;
      if (req.version !== 'HTTP/1.0' && req.version !== 'HTTP/1.1') {
        res.status = HttpStatus.BAD_REQUEST;
        buildResponse(res);
        return;
      }

      if (req.method !== 'GET' && req.version !== 'POST') {
        res.status = HttpStatus.NOT_IMPLEMENTED;
        buildResponse(res);
        return;
      }

      next();
    });
    middleware.use(function (next) {
      var self = this;
      console.log('2');
      next();
      console.log('22');
    });

    middleware.go(function() {
      if (req.uri === '') {
        // Do something
      }
      buildResponse(res);
    });

    // console.log('connection data from %s: %j', remoteAddress, d);
    // conn.write(d.toString());
  }

  function buildResponse(res) {
    socket.write('HTTP/1.1 ' + res.status + ' ' + HttpStatus.getStatusText(res.status) + CRLF);
    for (var i = 0; i < res.headers.length; i++) {
      socket.write(res.headers[i] + CRLF);
    }
    socket.write(CRLF);
    socket.write(res.body);
    socket.end();
  }

  function onConnClose() {
    console.log('connection from %s closed', remoteAddress);
  }

  function onConnError(err) {
    console.log('Connection %s error: %s', remoteAddress, err.message);
  }
}