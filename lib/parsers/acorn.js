"use strict";

const Parser = require("acorn").Parser;

const acornExtensions = require("./acorn-extensions");

exports.options = {
  allowHashBang: true,
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  ecmaVersion: 13,
  sourceType: "module"
};

function parse(code) {
  const parser = new Parser(exports.options, code);
  acornExtensions.enableAll(parser);
  return parser.parse();
}

exports.parse = parse;
