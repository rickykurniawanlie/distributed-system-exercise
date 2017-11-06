var express = require('express');
var basicAuth = require('express-basic-auth')
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var dotenv = require('dotenv').config()

/**
 * Common components
 */
var memoryCache = require('memory-cache');  // default instance
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
try {
  mongoose.connect(process.env.MONGO_STRING);
} catch (err) {
  console.log(err);
}

/**
 * Accessors
 */
var ClusterCachedAccessor = require('./accessors/ClusterCachedAccessor');
var clusterCachedAccessor = new ClusterCachedAccessor(memoryCache);

/**
 * Services
 */
var ClusterService = require('./services/ClusterService');
var clusterService = new ClusterService(clusterCachedAccessor);
var EwalletService = require('./services/EwalletService');
var ewalletService = new EwalletService(clusterService);
var UserService = require('./services/UserService');
var userService = new UserService();

var index = require('./routes/index');
var users = require('./routes/users');
var webui = require('./routes/webui');

var infraController = require('./controllers/InfraController');
var ewalletController = require('./controllers/EwalletController')(ewalletService, clusterService);
var apiController = require('./controllers/ApiController')(clusterService, userService);

var quorumMiddleware = require('./middlewares/QuorumMiddleware')(clusterService);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.set('port', process.env.APP_PORT || 3000);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/webui', webui);

app.post('/ewallet/ping', quorumMiddleware.any, infraController.ping);
app.post('/ewallet/set-healthy', quorumMiddleware.any, infraController.setHealthy);
app.post('/ewallet/set-unhealthy', quorumMiddleware.any, infraController.setUnhealthy);

app.post('/ewallet/register', quorumMiddleware.majority, ewalletController.register);
app.post('/ewallet/transfer', quorumMiddleware.majority, ewalletController.transfer);
app.post('/ewallet/getSaldo', quorumMiddleware.majority, ewalletController.getSaldo);
app.post('/ewallet/getTotalSaldo', quorumMiddleware.full, ewalletController.getTotalSaldo);

app.post('/api/ping', apiController.ping);
app.post('/api/register', apiController.register);
app.post('/api/transfer', apiController.transfer);
app.post('/api/saldo', apiController.saldo);
app.post('/api/totalSaldo', apiController.totalSaldo);
app.get('/api/find/:user_id', apiController.getIpFromId);

// Sorry for the hack
app.get('/webui/misc', async function(req, res, next) {
  res.render('misc', {
    env: process.env,
    users: await userService.getUsers(),
    clusterMembers: await clusterService.getMembers()
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
