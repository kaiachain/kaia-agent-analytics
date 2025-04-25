import { createLogger, format, transports } from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'white',
  debug: 'magenta',
};

// Tell winston about these colors
format.colorize().addColors(colors);

// Define the format of the log message
const formatLogger = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.metadata && Object.keys(info.metadata).length ? JSON.stringify(info.metadata) : ''}`
  )
);

// Create separate transports for console and files
const transportsLogger = [
  // Console output
  new transports.Console({
    format: format.combine(
      format.colorize({ all: true }),
      formatLogger
    ),
  }),

  // NOTE: Uncomment to save logs to files
  /* 
  // Store all logs in combined.log
  new transports.File({
    filename: path.join('logs', 'combined.log'),
    format: formatLogger,
  }),
  // Store error logs separately in error.log
  new transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: formatLogger,
  }),
  */
];

// Create the logger
const logger = createLogger({
  level,
  levels,
  format: formatLogger,
  transports: transportsLogger,
});

export default logger; 