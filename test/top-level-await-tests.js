import { topLevelAwaitEnabled } from './test-options';
const assert = require('assert');

(topLevelAwaitEnabled ? describe : describe.skip) ('top level await', () => {
  let logs = [];
  beforeEach(() => {
    logs = [];
    global.tlaTrace = (t) => logs.push(t);
  });

  describe('evaluation order', () => {
    it('test 1', async () => {
      await require('./tla/order-1/9.js');
      assert.deepStrictEqual(logs, [
        '0 before', '0 in between',
        '1 before', '2 before',
        '7 before', '5 before',
        '6 before', '8 before',
        '8 in between', '9 before',
        '9 in between'
      ]);
    });
  });
});
