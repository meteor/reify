import { topLevelAwaitEnabled } from './test-options';
const assert = require('assert');

(topLevelAwaitEnabled ? describe : describe.skip) ('top level await', () => {
  
  describe('evaluation order', () => {
    let logs = [];
    beforeEach(() => {
      logs = [];
      global.tlaTrace = (t) => logs.push(t);
    });
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

  describe('already evaluated', () => {
    it('should handle module being required after initially evaluated', async () => {
      const exports1 = await require('./tla/already-evaluated/async-module.js');
      const exports2 = await require('./tla/already-evaluated/async-module.js');
  
      assert.strictEqual(exports1, exports2);
    });
    it('should handle module being imported after initially evaluated', async () => {
      const exports = await require('./tla/already-evaluated/async-module.js');
      const exports2 = await require('./tla/already-evaluated/parent.js')
    })
  });
});
