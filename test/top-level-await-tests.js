import { topLevelAwaitEnabled } from './test-options';
const assert = require('assert');
const reify = require('../lib/runtime/index');
import { importSync, importAsync, importAsyncEvaluated } from './tla/nested/parent.js';

(topLevelAwaitEnabled ? describe.only : describe.skip) ('top level await', () => {
  
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
    it('should allow nested import for evaluated async module', () => {
      // Will throw if test fails
      importAsyncEvaluated();
    });
  });

  it('should allow configuring modules to require as sync', async () => {
    const exportsPromise = require('./tla/require-as-sync');
    const exports1 = await exportsPromise;

    reify._requireAsSync(require.resolve('./tla/require-as-sync'));
    const exports2 = require('./tla/require-as-sync');

    assert(exportsPromise instanceof Promise);
    assert(exports1 === exports2);
  });

  it('should set __reifyAsyncModule on promise returned by require', async () => {
    const exportsPromise = require('./tla/async-module.js');
    assert(exportsPromise.__reifyAsyncModule, true);
  });

  it('should run setters after module finished', async () => {
    const exports = await require('./tla/export-after-await.js');
    assert(exports.value === 5);
  });

  it('should run setters after module with async dep finished', async () => {
    const exports = await require('./tla/export-sync-parent.js');
    assert(exports.a === 1);
  });

  it('should detect tla on exported declarations', async () => {
    const exports = await require('./tla/exported-declaration.js');
    assert(exports.test === 'value');
  })

  it('should detect tla on non exported declarations', async () => {
    const exports = await require('./tla/non-exported-declaration.js');
    assert(exports.redirected === 'value');
  })

  it('should detect tla on exported declarations (deep)', async () => {
    const exports = await require('./tla/exported-declaration-deep.js');
    assert(exports.value === 12);
  });

  it('should not detect tla if they are inside any function type', async () => {
    const exports = require('./tla/await-inside-function.js');
    assert(!(exports instanceof Promise))
  })

  describe('errors', () => {
    it('should synchronously throw error for sync module', () => {
      try {
        require('./tla/sync-error/sync.js');

        // shouldn't be reached
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'sync-error');
      }
    });
    it('should reject promise returned by require', async () => {
      try {
        const promise = await require('./tla/async-error/require-child.js');

        // shouldn't be reached
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'async-error');
      }

      // Try a second time to ensure it works for already evaluated modules
      try {
        const promise = await require('./tla/async-error/require-child.js');

        // shouldn't be reached
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'async-error');
      }
    });

    it('should reject when imported async module errors', async () => {
      try {
        const promise = await require('./tla/async-error/parent-with-async-child.js');

        // shouldn't be reached
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'async-child-error');
      }
    });

    it('should reject when imported sync module errors', async () => {
      try {
        const promise = await require('./tla/async-error/parent-with-sync-child.js');

        // shouldn't be reached
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'sync-child-error');
      }
    });

    it('should reject when parent imports async errored child without TLA', async () => {
      try {
        const promise = await require('./tla/async-error/parent-with-async-child-without-tla.js');

        // shouldn't be reached
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'mostly-sync-child-error');
      }
    });
    it('should propagate error for already errored child', async () => {
      try {
        const promise = await require('./tla/async-error/already-errored.js');

        // shouldn't be reached
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'already-errored');
      }

      try {
        const promise = await require('./tla/async-error/import-already-errored.js');

        // shouldn't be reached
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'already-errored');
      }
    });
  });
});

global.topLevelAwaitTestsLoaded = true;
