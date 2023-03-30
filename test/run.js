import { topLevelAwaitEnabled } from './test-options.js';

let tlaDescription = topLevelAwaitEnabled ?
  ' - with top level await' : '';

describe("Parsing with " + JSON.stringify(
  process.env.REIFY_PARSER || "acorn"
) + tlaDescription, async () => {
  await require("./tests.js");

  // Make sure there isn't a bug in the reify runtime that causes
  // modules to not be run
  const assert = require('assert');
  assert(global.topLevelAwaitTestsLoaded, 'tests not loaded');
});
