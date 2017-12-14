let amqp = require('amqplib/callback_api');
let printf = require('printf');
let logger = require('./services/Logger');

class Qiu {
  constructor (url) {
    this.url = url;
    this.conn = null;
  }

  start (cb) {
    const self = this;

    amqp.connect(self.url, function(err, conn) {
      if (err) {
        return logger.error('[RABBITMQ] Failed to connect to ' + self.url, err);
      }
      self.conn = conn;
      cb();
    });
  }

  makeBuffer(content) {
    return new Buffer.from(JSON.stringify(content));
  }

  getTimestamp(date) {
    return printf('%02d-%02d-%02d %02d:%02d:%02d',
      date.getFullYear(), date.getMonth(), date.getDate(),
      date.getHours(), date.getMinutes(), date.getSeconds()
    );
  }

  pubsub(exchangeType, exchangeName, routeIn, handler, opts) {
    let self = this;

    opts = opts || {};
    opts.name = opts.name || (exchangeName + '->' + routeIn);
    opts.consume = opts.consume || {noAck: true};
    opts.exchange = opts.exchange || { durable: false };
    opts.queue = opts.queue || { exclusive: true };

    self.conn.createChannel(function(err, ch) {
      if (err) {
        return logger.error('[' + exchangeName + '][' + routeIn + '] Create channel failed', err);
      }

      ch.assertExchange(exchangeName, exchangeType, opts.exchange);

      ch.assertQueue('', opts.queue, function(err, q) {
        if (err) {
          return logger.error('[' + exchangeName + '][' + routeIn + '] Assert queue error', err);
        }
        logger.verbose('[' + exchangeName + '][' + routeIn + '] Queue ' + q.queue + ' created');
        ch.bindQueue(q.queue, exchangeName, routeIn);
        logger.verbose('[' + exchangeName + '][' + routeIn + '] ' + q.queue + ' successfully binded to ' + exchangeName);

        ch.consume(q.queue, async function(msg) {
          try {
            logger.verbose('[' + exchangeName + '][' + routeIn + '] ' + q.queue + ' receive a message ' + typeof msg.content.toString());
            let req = JSON.parse(msg.content.toString());
            logger.verbose(req);
            let res = function (routeOut, data) {
              ch.publish(exchangeName, routeOut, self.makeBuffer(data));
            }
            handler(req, res);
          } catch (e) {
            logger.error(e);
          }
        }, opts.consume);
      });
    });
  }

  pubsubDirect(exchangeName, routeIn, handler, opts) {
    opts = {};
    opts.exchange = opts.exchange || { durable: true };
    this.pubsub('direct', exchangeName, routeIn, handler, opts);
  }

  pubsubFanout(exchangeName, routeIn, handler, opts) {
    opts = {};
    opts.exchange = opts.exchange || { durable: false };
    this.pubsub('fanout', exchangeName, routeIn, handler, opts);
  }

  pubIntervalFanout(exchangeName, routeIn, interval, handler, opts) {
    let self = this;

    opts = opts || {};
    opts.name = opts.name || (exchangeName + '->' + routeIn);
    opts.consume = opts.consume || {noAck: true};
    opts.exchange = opts.exchange || { durable: false };
    opts.queue = opts.queue || { exclusive: true };

    self.conn.createChannel(function(err, ch) {
      if (err) {
        return logger.error('[' + exchangeName + '][' + routeIn + '] Create channel failed', err);
      }

      ch.assertExchange(exchangeName, 'fanout', opts.exchange);

      ch.assertQueue('', opts.queue, function(err, q) {
        if (err) {
          return logger.error('[' + exchangeName + '][' + routeIn + '] Assert queue error', err);
        }
        logger.verbose('[' + exchangeName + '][' + routeIn + '] Queue ' + q.queue + ' created');
        ch.bindQueue(q.queue, exchangeName, routeIn);
        logger.verbose('[' + exchangeName + '][' + routeIn + '] ' + q.queue + ' successfully binded to ' + exchangeName);

        let res = function (data) {
          ch.publish(exchangeName, '', self.makeBuffer(data));
        }
        setInterval(function () {
          handler(res)
        }, interval);
      });
    });
  }
}

module.exports = Qiu;
