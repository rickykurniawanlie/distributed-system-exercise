const CRLF = '\r\n';

var net = require('net');
var mimeTypes = require('mime-types');
var httpRequestParser = require('./lib/http-request-parser');
var Middleware = require('./lib/middleware');
var HttpStatus = require('http-status');
var Response = require('./model/response');
var Request = require('./model/request');
var fs = require('fs');
var http = require('http');

var server = net.createServer(function (socket) {
  socket.setEncoding('utf-8');
});
server.on('connection', handleConnection);

var env = {};
env.nodeId = Math.floor(Math.random() * 1000000);
env.host = process.argv[2] || 'localhost';
env.port = process.argv[3] || 9000;

server.listen(env.port, env.host, function() {
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
        res.socket.end('\r\n');      })
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
        res.ok(data.toString().replace('__HELLO__', req.input.name));
      });
    });

    router.get('/info', function (req, res) {
      res.writeHead('Content-Type', mimeTypes.lookup('text/plain'), {
        'charset' : 'UTF-8'
      });

      var type = req.input.type;
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

    router.get('/whoami', function (req, res) {
      res.write(JSON.stringify(env));
      res.end();
    });

    /**
     * PR 2
     */
    router.get('/api/hello', function(req, res) {
      res.error(HttpStatus.METHOD_NOT_ALLOWED, 'The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.');
    });

    router.post('/api/hello', function (req, res) {
      if (!req.input.request) {
        res.error(HttpStatus.BAD_REQUEST, '\'request\' is a required property');
      }

      var options = {
        host: '172.17.0.70',
        port: 17088,
        path: '/'
      };

      callback = function(response) {
        var str = '';

        response.on('error', function () {
          res.error(HttpStatus.SERVICE_UNAVAILABLE, 'External service is under maintenance. Please try again later');
        });

        response.on('data', function (chunk) {
          str += chunk;
        });

        response.on('end', function () {
          var data = JSON.parse(str);

          var dbRaw = fs.readFileSync('./storage/db.json', 'utf8');
          var db = JSON.parse(dbRaw) || {};
          if (!db[req.input.request]) {
            db[req.input.request] = 1;
          } else {
            db[req.input.request]++;
          }
          fs.writeFileSync('./storage/db.json', JSON.stringify(db), 'utf8');

          var response = {
            "response": 'Good ' + data.state + ', ' + req.input.request,
            "currentvisit": data.datetime,
            "count": db[req.input.request],
            "apiversion": 2
          };
          res.json(HttpStatus.OK, response);
        });
      }
      http.request(options, callback).end();
    });

    router.get('/api/plus_one/:num', function (req, res) {
      if (isNaN(req.route.num) || parseInt(req.route.num) < 0) {
        res.error(HttpStatus.NOT_FOUND, 'The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.');
      }

      var response = {
        'apiversion': 2,
        'plusoneret': parseInt(req.route.num) + 1
      };
      res.writeHead('Content-Type', mimeTypes.lookup('json'));
      res.write(JSON.stringify(response));
      res.end();
    });

    router.get('/api/spesifikasi.yaml', function (req, res) {
      fs.readFile('./public/spesifikasi.yaml', (err, data) => {
        if (err) {
          res.send(404);
          return;
        }
        res.writeHead('Content-Type', mimeTypes.lookup('yaml'));
        res.ok(data.toString());
      });
    });

    router.error(function (req, res) {
      res.writeHead('Content-Type', mimeTypes.lookup('json'));
      var response = {
        'detail': 'The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.',
        'status': 404,
        'title': 'Not Found'
      };
      res.notFound(JSON.stringify(response));
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