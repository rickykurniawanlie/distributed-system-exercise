let constant = require('../const/infraConstant');
let healthy = true;
let amqp = require('amqplib/callback_api');
let logger = require('../services/Logger');
let printf = require('printf');

const PING_MILLIS = 5000;
const CACHE_MILLIS = 10000;

class InfraQueueController {
  constructor(quorumCache, clusterService) {
    this.quorumCache = quorumCache;
    this.clusterService = clusterService;
  }

  start(urlString, exSpecs, qSpecs) {
    if (urlString.indexOf('amqp') < 0) {
      logger.error('Queue URL should contain amqp protocol');
    }
    if (!exSpecs || !exSpecs.name || !exSpecs.type || !exSpecs.opts) {
      logger.error('Parameter "exchange" is invalid');
    }
    if (!qSpecs || qSpecs.name == null || !qSpecs.type || !qSpecs.opts) {
      logger.error('Paramter "queue" is invalid');
    }

    this.startSubscriber(urlString, exSpecs, qSpecs);
    this.startPublisher(urlString, exSpecs, qSpecs);
  }

  getQuorumSize() {
    return this.quorumCache.size();
  }

  startSubscriber(urlString, exSpecs, qSpecs) {
    let self = this;
    amqp.connect(urlString, function(err, conn) {
      if (err) logger.error('[SUB] Connect failed', err);

      conn.createChannel(function(err, ch) {
        if (err) logger.error('[SUB] Create channel failed', err);

        ch.assertExchange(exSpecs.name, exSpecs.type, exSpecs.opts);

        ch.assertQueue(qSpecs.name, qSpecs.opts, function(err, q) {
          logger.verbose('[SUB] Queue ' + q.queue + ' created');
          ch.bindQueue(q.queue, exSpecs.name, '');
          logger.verbose('[SUB] Queue successfully bound to ' + exSpecs.name);

          ch.consume(q.queue, async function(msg) {
            try {
              let obj = JSON.parse(msg.content.toString());
              if (await self.clusterService.isMember(obj.npm)) {
                logger.info(printf('[SUB] Received %s from %s sent at %s',
                  obj.action, obj.npm, obj.ts)
                );
                self.quorumCache.put(obj.npm, true, CACHE_MILLIS,
                  function (key, value) {
                    logger.debug('[SUB] ' + key + ' removed from quorum');
                  }
                );
                logger.debug('[SUB] QuorumCache: ' + self.quorumCache.keys().toString());
              } else {
                logger.debug('[SUB]' + obj.npm + ' is not member of cluster. Ignoring...');
              }
            } catch (e) {
              logger.error(e);
            }
          }, {noAck: true});
        });
      });
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

  startPublisher(urlString, exSpecs, qSpecs) {
    let self = this;
    amqp.connect(urlString, function(err, conn) {
      if (err) logger.error('[PUB] Connect failed', err);
      conn.createChannel(function(err, ch) {
        if (err) logger.error('[PUB] Create channel failed', err);

        ch.assertExchange(exSpecs.name, exSpecs.type, exSpecs.opts);
        logger.verbose('[PUB] Exchange ' + exSpecs.name + ' created');
        logger.verbose('[PUB] Set ping every ' + PING_MILLIS + ' millis');
        setInterval(function() {
          var appId = process.env.APP_ID;
          ch.publish(exSpecs.name, '', self.makeBuffer({
            'action': 'ping',
            'npm': process.env.APP_ID,
            'ts': self.getTimestamp(new Date())
          }));
          logger.debug('[PING] Publish');
        }, PING_MILLIS);
      });
    });
  }
}
module.exports = InfraQueueController;