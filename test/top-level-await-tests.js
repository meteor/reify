import { topLevelAwaitEnabled } from './test-options';
const assert = require('assert');
const reify = require('../lib/runtime/index');
import { importSync, importAsync, importAsyncEvaluated } from './tla/nested/parent.js';


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
      const exports2 = await require('./tla/already-evaluated/parent.js');

      assert(exports.a === exports2.default.a);
    })
  });

  describe('nested imports', () => {
    it('should support async imports', () => {
      const result = importSync();
      assert.strictEqual(result.a, 3);
    });
    it('should throw for async module', () => {
      let err;
      try {
        importAsync();
      } catch (e) {
        err = e;
      }
      assert.strictEqual(err.message, 'Nested imports can not import an async module');
    });
    it('should throw for evaluated async module', () => {
      let err;
      try {
        let result = importAsyncEvaluated();
        console.log(result);
      } catch (e) {
        err = e;
      }
      assert.strictEqual(err.message, 'Nested imports can not import an async module');
    });
  });

  it('should allow configuring modules to require as sync', async () => {
    const exportsPromise = require('./tla/require-as-sync');
    const exports1 = await exportsPromise;
    debugger;
    reify._requireAsSync(require.resolve('./tla/require-as-sync'));
    const exports2 = require('./tla/require-as-sync');

    assert(exportsPromise instanceof Promise);
    assert(exports1 === exports2);
  });
});
