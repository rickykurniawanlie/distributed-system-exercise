var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

/**
 * Common components
 */
var memoryCache = require('memory-cache');  // default instance
var mongoose = require('mongoose');
try {
  mongoose.connect('mongodb://localhost/test');
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

var index = require('./routes/index');
var users = require('./routes/users');

var infraController = require('./controllers/InfraController');
var ewalletController = require('./controllers/EwalletController');

var quorumMiddleware = require('./middlewares/QuorumMiddleware');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

app.post('/ewallet/ping', quorumMiddleware.any, infraController.ping);
app.post('/ewallet/set-healthy', quorumMiddleware.any, infraController.setHealthy);
app.post('/ewallet/set-unhealthy', quorumMiddleware.any, infraController.setUnhealthy);

app.post('/ewallet/register', quorumMiddleware.majority, ewalletController.register);
app.post('/ewallet/transfer', quorumMiddleware.majority, ewalletController.transfer);
app.post('/ewallet/getSaldo', quorumMiddleware.majority, ewalletController.getSaldo);
app.post('/ewallet/getTotalSaldo', quorumMiddleware.full, ewalletController.getTotalSaldo);

app.get('/test', async function (req, res){
  var result = await clusterService.getMembers();
  res.send(result);
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
