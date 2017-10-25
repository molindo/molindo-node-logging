import Logger from '../Logger';

describe('Logger', () => {
  const originalStdout = process.stdout.write;
  const originalStderr = process.stderr.write;
  beforeEach(() => {
    process.stdout.write = jest.fn();
    process.stderr.write = jest.fn();
  });

  it('logs plain messages in development', () => {
    const logger = new Logger({
      service: 'pizza-shop',
      colorize: false,
      level: 'TRACE',
      isProduction: false
    });
    logger.trace('making a salami pizza');
    logger.debug('adding salami');
    logger.info('putting it in the oven');
    logger.warn("don't forget to get it out in time");
    logger.error('pizza is burned!');

    expect(process.stdout.write.mock.calls).toEqual([
      ['TRACE: making a salami pizza\n'],
      ['DEBUG: adding salami\n'],
      ['INFO: putting it in the oven\n'],
      ["WARN: don't forget to get it out in time\n"]
    ]);
    expect(process.stderr.write.mock.calls).toEqual([
      ['ERROR: pizza is burned!\n']
    ]);

    logger.destroy();
  });

  it('only logs infos, warnings and errors in development', () => {
    const logger = new Logger({service: 'pizza-shop', isProduction: false});
    logger.trace('making a salami pizza');
    logger.debug('adding salami');
    logger.info('putting it in the oven');
    logger.warn("don't forget to get it out in time");
    logger.error('pizza is burned!');

    expect(process.stdout.write.mock.calls.length).toBe(2);
    expect(process.stderr.write.mock.calls.length).toBe(1);

    logger.destroy();
  });

  it('logs all levels in production', () => {
    const logger = new Logger({service: 'pizza-shop', isProduction: true});
    logger.trace('making a salami pizza');
    logger.debug('adding salami');
    logger.info('putting it in the oven');
    logger.warn("don't forget to get it out in time");
    logger.error('pizza is burned!');

    expect(process.stdout.write.mock.calls.length).toBe(4);
    expect(process.stderr.write.mock.calls.length).toBe(1);

    logger.destroy();
  });

  it('logs json messages in production', () => {
    const logger = new Logger({service: 'pizza-shop', isProduction: true});
    logger.info('pizza is ready!');

    const output = JSON.parse(process.stdout.write.mock.calls[0][0]);
    expect(typeof output['@timestamp']).toBe('string');
    expect(output['@timestamp']).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(output.level).toBe('INFO');
    expect(output.level_value).toBe(20000);
    expect(output.message).toBe('pizza is ready!');
    expect(output.service).toBe('pizza-shop');

    logger.destroy();
  });

  it('overloads the log functions to provide a logger name', () => {
    const logger = new Logger({service: 'pizza-shop', isProduction: true});

    logger.trace({
      message: 'Making a salami pizza …',
      name: 'cook'
    });
    logger.info({
      message: 'Pizza can be served now!',
      name: 'cook'
    });

    const stdoutCalls = process.stdout.write.mock.calls.map(call =>
      JSON.parse(call[0])
    );

    expect(stdoutCalls[0]['logger_name']).toBe('cook');
    expect(stdoutCalls[1]['logger_name']).toBe('cook');

    logger.destroy();
  });

  it('throws when no service name is provided', () => {
    expect(() => new Logger()).toThrow(/`service` is mandatory/);
  });

  afterEach(() => {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  });
});
