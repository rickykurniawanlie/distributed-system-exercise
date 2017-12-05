#!/usr/bin/env node
var amqp = require('amqplib/callback_api');
var cli = require('cli'), options = cli.parse({
  command: ['c', 'Command: register|get_saldo|transfer|get_total_saldo', 'string'],
  target: ['t', 'Target\'s routing key. Ex REQ_XXXXX', 'string'],
  user_id: ['u', 'User\'s id', 'string'],
  sender_id: ['s', 'Sender\'s id', 'string'],
  name: ['n', 'User\' name', 'string'],
  amount: ['a', 'Amount of money sent', 'int'],
});

var o = options;
var errors = [];
var exchangeName; // will be used later
if (!o.command)
  errors.push('command is required');
if (!o.sender_id)
  errors.push('sender_id is required');

else {
  if (!o.user_id) errors.push('user_id is required');
  switch (o.command) {
    case 'register':
      if (!o.name) errors.push('name is required');
      exchangeName = 'EX_REGISTER';
      break;
    case 'transfer':
      if (!o.amount) errors.push('amount is required');
      exchangeName = 'EX_TRANSFER';
      break;
    case 'get_saldo':
      exchangeName = 'EX_GET_SALDO';
      break;
    case 'get_total_saldo':
      exchangeName = 'EX_GET_TOTAL_SALDO';
      break;
  }
}
if (!o.target) {
  errors.push('target is required');
}

if (errors.length > 0) {
  errors.push('See --help');
  console.log(errors);
  process.exit(1);
}

console.log('[CONN] Connecting');
amqp.connect('amqp://localhost:5672', function(err, conn) {
  if (err) {
    console.log('[CONN] Fail');
    return console.log(err);
  } else {
    console.log('[CONN] Connected');
  }

  console.log('[CHAN] Create channel');
  conn.createChannel(function(err, ch) {
    if (err) {
      console.log('[CHAN] Fail');
      return console.log(err);
    }
    console.log('[CHAN] Created');

    var ex = exchangeName;

    console.log('[EXCH] Checking ' + ex);
    ch.assertExchange(ex, 'direct', {durable: true});

    /* Construct queue to handle response */
    console.log('[BIND] Generate queue with randomly generated name');
    ch.assertQueue('', {exclusive: true}, function(err, q) {
      console.log('[BIND] ' + q.queue + ' binded to ' + ex + ':RESP_' + o.sender_id);
      ch.bindQueue(q.queue, ex, 'RESP_' + o.sender_id);
      ch.consume(q.queue, function(msg) {
        console.log('[SUBS] response: ' + msg.content.toString());
        process.exit(0);
      }, {noAck: true});

      /* Prepare request */
      var msg = {
        action: o.command,
        sender_id: o.sender_id,
        user_id: o.user_id,
        nama: o.name,
        nilai: o.amount,
        type: 'request',
        ts: new Date()
      };
      console.log('[PUBS] request: ' + JSON.stringify(msg));

      setTimeout(function() {
        console.log('Timeout 10 secs reached');
        process.exit(-1);
      }, 10000);

      console.log('[PUBS] Publish msg to ' + ex + ':' + o.target);
      ch.publish(ex, o.target, new Buffer(JSON.stringify(msg)));
    });

  });
});

