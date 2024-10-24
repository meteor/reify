import assert from "assert";
import { relative } from "path";
import { transformFromAst } from "@babel/core";
import { files } from "./all-files.js";
import { parse } from "../lib/parsers/babel.js";
import reifyPlugin from "../plugins/babel.js";
import envPreset from "@babel/preset-env";
import runtimeTransform from "@babel/plugin-transform-runtime";
import Visitor from "../lib/visitor.js";
import { topLevelAwaitEnabled } from './test-options.js';

const filesToTest = Object.create(null);
const methodNameRegExp =
  /\bmodule\d*(?:\.link\b|\.dynamicImport\b|\.export(?:Default)?\b|\["export"\])/;

Object.keys(files).forEach((absPath) => {
  const code = files[absPath];
  const relPath = relative(__dirname, absPath);

  // These files fail to transform with es2015 preset due to problems
  // unrelated to the functionality of the Reify Babel plugin.
  if (relPath === "export/extensions.js" ||
      relPath === "export/some.js"  ||
      relPath === "export-tests.js" ||
      relPath === "import/extensions.js" ||
      relPath === "import-tests.js" ||
      relPath === "setter-tests.js" ||
      relPath.startsWith("output/export-multi-namespace/")) {
    return;
  }

  if (!topLevelAwaitEnabled && relPath.startsWith('tla/')) {
    return;
  }

  // Files without import or export tokens don't need to be tested.
  if (! /\b(?:im|ex)port\b/.test(code)) {
    return;
  }

  filesToTest[relPath] = code;
});

function fail(path) {
  throw new Error("unexpected node of type " + path.getNode().type);
}

class ImportExportChecker extends Visitor {
  visitImportDeclaration(path) { fail(path) }
  visitExportAllDeclaration(path) { fail(path) }
  visitExportDefaultDeclaration(path) { fail(path) }
  visitExportNamedDeclaration(path) { fail(path) }
}

describe("reify/plugins/babel", () => {
  it("should not double-wrap module.runSetters expressions", () => {
    const code = [
      'import x from "./y";',
      'export let z = x + 1;',
      'const { a, ...rest } = { a: x };',
      'eval("++z");',
    ].join("\n");

    function check(plugins) {
      const ast = parse(code);
      delete ast.tokens;
      const result = transformFromAst(ast, code, {
        plugins: plugins,
        presets: [
          [envPreset, {
            targets: {
              ie: 11
            }
          }]
        ]
      });
      assert.strictEqual(
        result.code.split("runSetters").length, 2,
        result.code
      );
    }

    check([
      reifyPlugin,
      runtimeTransform,
    ]);

    check([
      runtimeTransform,
      reifyPlugin,
    ]);
  });

  it('compiles dynamic imports', () => {
    const code = 'import (x)';
    const ast = parse(code);
    delete ast.tokens;
    const result = transformFromAst(ast, code, {
      plugins: [[reifyPlugin, {
        dynamicImport: true
      }]]
    });
    assert.strictEqual(
      result.code,
      '"use strict";\n\nmodule.dynamicImport(x);'
    );
  });


  (topLevelAwaitEnabled ? describe : describe.skip)("top level await via babel plugin", ()=>{
    it('doesn’t detect TLA for simple content', () => {
      // Depends on the special __reifyWaitForDeps__ detection in visitAwaitExpression
      const code = `
import { Meteor } from "meteor/meteor";
export const isServer = Meteor.isServer;
`;
      const ast = parse(code);
      delete ast.tokens;
      const result = transformFromAst(ast, code, {
        plugins: [[reifyPlugin, {
          dynamicImport: true
        }]]
      });
      assert.match(
        result.code,
        /async: false\n/
      );
    });

    it('detects TLA for simple content', () => {
      const code = `
import { Meteor } from "meteor/meteor";
export const isServer = await Meteor.isServer;
`;
      const ast = parse(code);
      delete ast.tokens;
      const result = transformFromAst(ast, code, {
        plugins: [[reifyPlugin, {
          dynamicImport: true
        }]]
      });
      assert.match(
        result.code,
        /async: true\n/
      );
    });    
  });

  function check(code, options) {
    const ast = parse(code);
    delete ast.tokens;
    const result = transformFromAst(ast, code, options);
    assert.ok(methodNameRegExp.test(result.code), result.code);
    new ImportExportChecker().visit(parse(result.code));
    return result;
  }

  Object.keys(filesToTest).forEach((relPath) => {
    const code = filesToTest[relPath];

    const presets = [
      [envPreset, {
        targets: {
          ie: 11
        }
      }]
    ];

    const pluginsReifyFirst = [
      [reifyPlugin, {
        generateLetDeclarations: true,
        dynamicImport: true
      }],
      runtimeTransform,
    ];

    const pluginsReifyLast = [
      [reifyPlugin, {
        generateLetDeclarations: true,
        dynamicImport: true
      }],
      runtimeTransform,
    ];

    it(`compiles ${relPath}`, () => {
      check(code, { plugins: pluginsReifyFirst });
      check(code, { plugins: pluginsReifyLast });
    });

    it(`compiles ${relPath} with es2015`, () => {
      check(code, { plugins: pluginsReifyFirst, presets });
      check(code, { plugins: pluginsReifyLast, presets });
    });
  });
});
