# molindo-node-logger

A node.js logger that integrates well with the Molindo infrastructure.

## Features
 - Pretty prints messages in development mode.
 - Prints JSON messages in production mode.
 - Errors are printed to `stderr`, while all other levels are printed to `stdout`.
 - In development only warnings and errors are printed, while in production all levels are printed.
 - If the process encounters an error, it will log it to the console before shutting down. `unhandledRejection` errors thrown from promises are logged as well.
 - Offers an express integration that logs HTTP requests, including the `operationName` in the case of GraphQL requests. Confidential headers like `cookie` or `authorization` are masked.
 - Uses the levels and level values from [logback](https://logback.qos.ch/): `ERROR` (40000), `WARN` (30000), `INFO` (20000), `DEBUG` (10000), `TRACE` (5000).

## Usage

```js
import Logger from 'molindo-node-logger';

const logger = new Logger({service: 'pizza-shop'});
logger.trace('Making a salami pizza …');
logger.debug('Adding salami …');
logger.info('Putting it in the oven …');
logger.warn('Don\'t forget to get it out in time …');
logger.error('Oh no, the pizza is burned!');
```

In production, printed JSON will look like this (except that it's not pretty printed):

```json
{
  "service": "pizza-shop",
  "@timestamp": "2017-10-19T08:26:13.168Z",
  "level": "INFO",
  "level_value": 20000,
  "message": "Pizza is ready!"
}
```

### Express integration

If you're running an express server, you can register the logger middleware to log HTTP requests.

```js
import express from 'express';
import Logger, {createLoggerMiddleware} from 'molindo-node-logger';

const server = express();

const logger = new Logger({service: 'pizza-shop'});
server.use(createLoggerMiddleware({logger}));
```
