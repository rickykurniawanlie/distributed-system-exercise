let constant = require('../const/infraConstant');
let healthy = true;
let amqp = require('amqplib/callback_api');
let logger = require('../services/Logger');
let printf = require('printf');

const PING_MILLIS = 5000;
const CACHE_MILLIS = 10000;

class InfraQueueController {
  constructor(quorumService) {
    this.quorumService = quorumService;
  }

  pingSubscribe (req, res) {
    this.quorumService.updatePing(req.npm);
  }

  pingPublish (res) {
    var appId = process.env.APP_ID;
    res({
      'action': 'ping',
      'npm': process.env.APP_ID,
      'ts': this.getTimestamp(new Date())
    });
  }

  makeBuffer(content) {
    return new Buffer.from(JSON.stringify(content));
  }

  getTimestamp (date) {
    return printf('%02d-%02d-%02d %02d:%02d:%02d',
      date.getFullYear(), date.getMonth(), date.getDate(),
      date.getHours(), date.getMinutes(), date.getSeconds()
    );
  }
}
module.exports = InfraQueueController;