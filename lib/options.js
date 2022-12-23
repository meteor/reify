"use strict";

const hasOwn = Object.prototype.hasOwnProperty;
const defaultParser = require("./parsers/default.js");

const TLA_ENABLED =
  typeof process === "object" && process !== null &&
  typeof process.env === "object" && process.env !== null &&
  process.env.REIFY_TLA === 'true';

const defaultOptions = {
  ast: false,
  // If not false, "use strict" will be added to any modules with at least
  // one import or export declaration.
  enforceStrictMode: true,
  generateLetDeclarations: false,
  avoidModernSyntax: false,
  sourceType: "unambiguous",
  moduleAlias: "module",
  dynamicImport: false,
  topLevelAwait: TLA_ENABLED,
  // Controls whether finalizeHoisting performs one-time-only transforms like
  // wrapping the module body in a function.
  finalCompilationPass: true,
  forceWrapForTopLevelAwait: false,
  forceHasTopLevelAwait: false,
  parse(code) {
    return defaultParser.parse(code);
  }
};

function get(options, name) {
  const result = hasOwn.call(options, name) ? options[name] : void 0;
  return result === void 0 ? defaultOptions[name] : result;
}

exports.get = get;

function setDefaults(options) {
  Object.assign(defaultOptions, options);
}

exports.setDefaults = setDefaults;
