const assert = require("assert");
import { topLevelAwaitEnabled } from './test-options';

const nodeMajorVersion = parseInt(process.versions.node, 10);

// Masquerade as the REPL module.
module.filename = null;
module.id = "<repl>";
module.loaded = false;
module.parent = void 0;

delete require.cache[require.resolve("../node/repl-hook.js")];


// TLA is not compatible with global exports
(topLevelAwaitEnabled ? describe.skip : describe)("Node REPL", () => {
  import "../node/repl-hook.js";
  import { createContext } from "vm";
  import { enable } from "../lib/runtime";
  import repl from "repl";

  let pendingTestCount = 2;

  function finish(repl, done) {
    if (typeof repl.close === "function") {
      repl.close();
    }

    pendingTestCount = Math.max(pendingTestCount - 1, 0);
    if (pendingTestCount === 0 &&
        nodeMajorVersion <= 4) {
      process.stdin.end();
    }

    done();
  }

  it("should work with global context", (done) => {
    const r = repl.start({ useGlobal: true });
    enable(r.context.module);

    assert.strictEqual(typeof assertStrictEqual, "undefined");

    r.eval(
      'import { strictEqual as assertStrictEqual } from "assert"',
      null, // Context
      "repl", // Filename
      (err, result) => {
        // Use the globally defined assertStrictEqual to test itself!
        assertStrictEqual(typeof assertStrictEqual, "function");
        finish(r, done);
      }
    );
  });

  (nodeMajorVersion === 10 ? xit : it)
  ("should work with non-global context", (done) => {
    const r = repl.start({ useGlobal: false });
    const context = createContext({ module, require });

    r.eval(
      'import { strictEqual } from "assert"',
      context,
      "repl", // Filename
      (err, result) => {
        // Use context.strictEqual to test itself!
        context.strictEqual(typeof context.strictEqual, "function");
        if (typeof r.close === "function") {
          r.close();
        }
        finish(r, done);
      }
    );
  });
});
