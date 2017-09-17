const CRLF = '\r\n';

var fs = require('fs');
var net = require('net');
var mimeTypes = require('mime-types');
var httpRequestParser = require('./lib/http-request-parser');
var Middleware = require('./lib/middleware');
var HttpStatus = require('http-status');
var Response = require('./model/response');
var Request = require('./model/request');
var merge = require('merge');

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

  function onConnData(rawData) {
    var response = new Response();
    response.socket = socket;
    response.writeHead('Connection', 'close');
    var request = new Request(rawData);
    var middleware = new Middleware(request, response);

    var init = require('./middleware/init');
    var httpLimitation = require('./middleware/httpLimitation');
    var Router = require('./middleware/router');
    var router = Router.Router;

    middleware.use(init);
    middleware.use(httpLimitation);
    middleware.use(Router.middleware);

    router.get('/', function (req, res) {
      res.found('/hello-world');
    });

    router.get('/style', function (req, res) {
      fs.readFile('./public/style.css', (err, data) => {
        if (err) {
          res.send(500);
        }
        res.writeHead('Content-Type', mimeTypes.lookup('css'));
        res.ok(data);
      })
    });

    router.get('/background', function (req, res) {
      fs.readFile('./public/background.jpg', (err, data) => {
        if (err) {
          res.send(500);
        }
        res.socket.write('HTTP/1.1 200 OK\r\n');
        res.socket.write('Content-Type: image/jpeg\r\n');
        res.socket.write('Content-Length: ' + data.byteLength + '\r\n');
        res.socket.write('\r\n');
        res.socket.write(data);
        res.socket.end('\r\n');
        // console.log(data);
        // res.writeHead('Content-Type', mimeTypes.lookup('jpeg'));
        // res.writeHead('Content-Length', data.byteLength);
        // res.ok(data.toString());
      })
    });

    router.get('/hello-world', function (req, res) {
      fs.readFile('./public/hello-world.html', (err, data) => {
        if (err) {
          res.send(500);
        }
        res.writeHead('Content-Type', mimeTypes.lookup('html'));
        res.ok(data.toString().replace('__HELLO__', 'World'));
      });
    });

    router.post('/hello-world', function (req, res) {
      if (req.getHeader('Content-Type') !== 'application/x-www-form-urlencoded') {
        res.error(HttpStatus.BAD_REQUEST);
      }

      fs.readFile('./public/hello-world.html', (err, data) => {
        if (err) {
          res.send(500);
        }
        res.writeHead('Content-Type', mimeTypes.lookup('html'));
        res.ok(data.toString().replace('__HELLO__', req.params.name));
      });
    });

    router.get('/info', function (req, res) {
      res.writeHead('Content-Type', mimeTypes.lookup('text/plain'), {
        'charset' : 'UTF-8'
      });

      var type = req.params['type'];
      switch (type) {
        case 'time':
          res.ok(new Date().getTime());
          break;
        case 'random':
          res.ok(Math.floor( Math.random() * 100000000 ));
          break;
        default:
          res.ok('No data');
      }
      return;
    });

    router.error(function (req, res) {
      res.notFound('Sorry, resource you are requested are not available... yet!');
    });

    middleware.go(function () {});
  }

  function onConnClose() {
    console.log('connection from %s closed', remoteAddress);
  }

  function onConnError(err) {
    console.log('Connection %s error: %s', remoteAddress, err.message);
  }
}