let amqp = require('amqplib/callback_api');
let printf = require('printf');
let logger = require('./services/Logger');

class Qiu {
  construct (url) {
    this.url = url;
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

  subscribe(exchangeType, exchangeName, routeIn, handler, opts) {
    let self = this;

    opts = opts || {};
    opts.name = opts.name || (exchangeName + '->' + routeIn);
    opts.consume = opts.consume || {noAck: true};
    opts.exchange = opts.exchange || { durable: false };
    opts.queue = opts.queue || { exclusive: true };

    amqp.connect(self.url, function(err, conn) {
      if (err) {
        return logger.error('[' + exchangeName + '][' + routeIn + '] Failed to connect to ' + self.url, err);
      }

      conn.createChannel(function(err, ch) {
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
    });
  }

  subscribeDirect(exchangeName, routeIn, handler, opts) {
    opts = {};
    opts.exchange = opts.exchange || { durable: true };
    this.subscribe('direct', exchangeName, routeIn, handler, opts);
  }

  subscribeFanout(exchangeName, routeIn, handler, opts) {
    this.subscribe('fanout', exchangeName, routeIn, handler, opts);
  }
}

module.exports = Qiu;