import winston from 'winston';

/**
 * A small wrapper around winston for consistent configuration.
 */

export default class Logger {
  static defaultOpts = {
    colorize: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',

    // The higher the number, the higher the severity
    levels: {
      ERROR: 40000,
      WARN: 30000,
      INFO: 20000,
      DEBUG: 10000,
      TRACE: 5000
    },

    colors: {
      ERROR: 'red',
      WARN: 'yellow',
      INFO: 'green',
      DEBUG: 'blue',
      TRACE: 'cyan'
    },

    stderrLevels: ['ERROR']
  };

  constructor(opts = {}) {
    this.receiveOpts(opts);
    if (!this.service) throw new Error('`service` is mandatory');

    this.setupWinston();

    // Create log methods
    Object.keys(this.levels).forEach(level => {
      this[level.toLowerCase()] = message => this.winston[level](message);
    });
  }

  receiveOpts(opts) {
    const mergedOpts = {...Logger.defaultOpts, ...opts};
    Object.entries(mergedOpts).forEach(([key, val]) => {
      this[key] = val;
    });

    this.level = opts.level;
    if (!this.level) {
      if (this.isProduction) {
        this.level = this.getLevelsDescending().slice(-1)[0];
      } else {
        this.level = this.getLevelsDescending().slice(2)[0];
      }
    }
  }

  setupWinston() {
    // winston expects levels to conform to RFC 5424, which
    // specifies that lower levels correspond to higher severity.
    // To achieve the reverse order, a mapping is necessary.
    this.winstonLevels = this.getLevelsDescending().reduce((acc, cur, i) => {
      acc[cur] = i;
      return acc;
    }, {});

    this.winston = new winston.Logger({
      transports: [
        new winston.transports.Console({
          stderrLevels: this.stderrLevels,
          handleExceptions: false,
          colorize: this.colorize,
          formatter: this.isProduction
            ? (...args) => this.formatJSONMessage(...args)
            : undefined,
          level: this.level
        })
      ],
      levels: this.winstonLevels,
      colors: this.colors
    });

    // winston doesn't allow to set the error level for runtime
    // exceptions, therefore this should be handled outside of winston.
    // https://github.com/winstonjs/winston/blob/bd06c4091e9e248e6fed6278e0699e5cfdc7de24/lib/winston/exception-handler.js#L94-L97
    process.on('uncaughtException', this.onUnhandledException);

    // Unhandled promise rejections should be treated as errors.
    process.on('unhandledRejection', this.onUnhandledException);
  }

  onUnhandledException = e => {
    this.winston[this.getLevelsDescending()[0]](e.stack);
    process.exit(1);
  };

  getLevelsDescending() {
    return Object.entries(this.levels)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }

  formatJSONMessage(opts) {
    const now = new Date();

    return JSON.stringify({
      service: this.service,
      '@timestamp': now.toISOString(),
      level: opts.level,
      level_value: this.levels[opts.level],
      message: opts.message,
      meta: opts.meta,
      stack_trace:
        opts.meta && opts.meta.stack ? opts.meta.stack.join('\n') : undefined
    });
  }

  destroy() {
    process.removeListener('uncaughtException', this.onUnhandledException);
    process.removeListener('unhandledRejection', this.onUnhandledException);
    this.winston = null;
  }
}
