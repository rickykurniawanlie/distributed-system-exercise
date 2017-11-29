const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const printf = require('printf');

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'warn.log', level: 'warn' })
  ]
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
  logger.add(new transports.Console({
    json: true,
    stringify: (obj) => { return printf('[%s][%s] %s', obj.timestamp, obj.level, obj.message); }
  }));
}

module.exports = logger;
