import * as index from '../index';

it('exports all necessary modules', () => {
  expect(Object.keys(index)).toEqual(['default', 'createLoggerMiddleware']);
});
