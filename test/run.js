import { topLevelAwaitEnabled } from './test-options.js';

let tlaDescription = topLevelAwaitEnabled ?
  ' - with top level await' : '';

describe("Parsing with " + JSON.stringify(
  process.env.REIFY_PARSER || "acorn"
) + tlaDescription, async () => {
  await require("./tests.js");
});
