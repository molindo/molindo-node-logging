import {Router} from 'express';
import expressWinston from 'express-winston';
import bodyParser from 'body-parser';

/**
 * Allows to integrate the logger with an express server.
 */

const MASKED_HEADERS = ['Cookie', 'cookie', 'Authorization', 'authorization'];
const MASKED_HEADER_VALUE = '*****';

export default ({logger}) => {
  const router = new Router();
  return router.use(
    bodyParser.json(),
    expressWinston.logger({
      winstonInstance: logger.winston,

      level(req, res) {
        if (res.statusCode >= 500) {
          return logger.getLevelsDescending()[0] || 'ERROR';
        }
        if (res.statusCode >= 400) {
          return logger.getLevelsDescending()[1] || 'WARN';
        }
        return logger.getLevelsDescending()[3] || 'DEBUG';
      },

      dynamicMeta(req) {
        const meta = {name: 'express'};

        if (req.method === 'POST' && req.body && req.body.operationName) {
          meta.graphql = {operationName: req.body.operationName};
        }

        return meta;
      },

      requestFilter(req, propName) {
        if (propName === 'headers') {
          // Mask confidential headers
          return Object.entries(req.headers)
            .map(([header, value]) => [
              header,
              MASKED_HEADERS.includes(header) ? MASKED_HEADER_VALUE : value
            ])
            .reduce((acc, [header, value]) => {
              acc[header] = value;
              return acc;
            }, {});
        }

        return req[propName];
      }
    })
  );
};
