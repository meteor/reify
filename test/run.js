let tlaDescription = process.env.REIFY_TLA === 'true' ?
  ' - with top level await' : '';

describe("Parsing with " + JSON.stringify(
  process.env.REIFY_PARSER || "acorn"
) + tlaDescription, async () => {
  await require("./tests.js");
});
