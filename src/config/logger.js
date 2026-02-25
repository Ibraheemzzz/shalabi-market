const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, printf } = format;

// ─── Development Console Format ───────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
    if (stack) log += `\n${stack}`;
    return log;
  })
);

// ─── Production JSON Format ────────────────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const isDev = process.env.NODE_ENV !== 'production';
const logsDir = path.join(process.cwd(), 'logs');

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev ? devFormat : prodFormat,
  transports: [
    // Always log to console
    new transports.Console(),

    // In production: rotate daily log files
    ...(isDev
      ? []
      : [
          // All logs
          new transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 14,
            tailable: true
          }),
          // Error logs only
          new transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 30,
            tailable: true
          })
        ])
  ],
  // Don't crash on unhandled logger errors
  exitOnError: false
});

// ─── Stream for Morgan HTTP logging ───────────────────────────────────────────
logger.stream = {
  write: (message) => logger.http(message.trim())
};

module.exports = logger;
