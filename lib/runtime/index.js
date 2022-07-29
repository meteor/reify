"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var utils = require("./utils.js");
var Entry = require("./entry.js");
var hasOwn = Object.prototype.hasOwnProperty;

var promiseExports = Object.create(null);

// The exports.enable method can be used to enable the Reify runtime for
// specific module objects, or for Module.prototype (where implemented),
// to make the runtime available throughout the entire module system.
exports.enable = function (mod) {
  if (mod.link !== moduleLink) {
    console.log('wrapping', mod);
    mod.link = moduleLink;
    mod["export"] = moduleExport;
    mod.exportDefault = moduleExportDefault;
    mod.exportAs = moduleExportAs;
    mod.runSetters = runSetters;
    mod.wrapAsync = wrapAsync;

    // Legacy shorthand for mod.exportAs("*").
    mod.makeNsSetter = moduleMakeNsSetter;

    var origRequire = mod.require;
    mod.require = function (id) {
      var path = this.resolve(id);
      var exports = origRequire(path);

      if (path in promiseExports) {
        // TODO: the exports object this resolves to could become stale
        // if the module overrides module.exports after the module was initially
        // evaluated
        return promiseExports[path];
      }
      
      return exports;
    }

    return true;
  }

  return false;
};

// Calling module.link(id, setters) resolves the given ID using
// module.resolve(id), which should return a canonical absolute module
// identifier string (like require.resolve); then creates an Entry object
// for the child module and evaluates its code (if this is the first time
// it has been imported) by calling module.require(id). Finally, the
// provided setter functions will be called with values exported by the
// module, possibly multiple times when/if those exported values change.
// The module.link name is intended to evoke the "liveness" of the
// exported bindings, since we are subscribing to all future exports of
// the child module, not just taking a snapshot of its current exports.
function moduleLink(id, setters, key) {
  utils.setESModule(this.exports);
  Entry.getOrCreate(this.id, this);

  var absChildId = this.resolve(id);
  var childEntry = Entry.getOrCreate(absChildId);

  if (utils.isObject(setters)) {
    childEntry.addSetters(this, setters, key);
  }

  var exports = this.require(absChildId);

  if (childEntry.module === null) {
    childEntry.module = {
      id: absChildId,
      exports: exports
    };
  }

  childEntry.runSetters();
}

// Register getter functions for local variables in the scope of an export
// statement. Pass true as the second argument to indicate that the getter
// functions always return the same values.
function moduleExport(getters, constant) {
  utils.setESModule(this.exports);
  var entry = Entry.getOrCreate(this.id, this);
  entry.addGetters(getters, constant);
  if (this.loaded) {
    // If the module has already been evaluated, then we need to trigger
    // another round of entry.runSetters calls, which begins by calling
    // entry.runModuleGetters(module).
    entry.runSetters();
  }
}

// Register a getter function that always returns the given value.
function moduleExportDefault(value) {
  return this["export"]({
    "default": function () {
      return value;
    }
  }, true);
}

// Returns a function suitable for passing as a setter callback to
// module.link. If name is an identifier, calling the function will set
// the export of that name to the given value. If the name is "*", all
// properties of the value object will be exported by name, except for
// "default" (use "*+" instead of "*" to include it). Why the "default"
// property is skipped: https://github.com/tc39/ecma262/issues/948
function moduleExportAs(name) {
  var entry = this;
  var includeDefault = name === "*+";
  var setter = function (value) {
    if (name === "*" || name === "*+") {
      Object.keys(value).forEach(function (key) {
        if (includeDefault || key !== "default") {
          utils.copyKey(key, entry.exports, value);
        }
      });
    } else {
      entry.exports[name] = value;
    }
  };

  if (name !== '*+' && name !== "*") {
    setter.exportAs = name;
  }

  return setter;
}

// Platform-specific code should find a way to call this method whenever
// the module system is about to return module.exports from require. This
// might happen more than once per module, in case of dependency cycles,
// so we want Module.prototype.runSetters to run each time.
function runSetters(valueToPassThrough) {
  Entry.getOrCreate(this.id, this).runSetters();

  // Assignments to exported local variables get wrapped with calls to
  // module.runSetters, so module.runSetters returns the
  // valueToPassThrough parameter to allow the value of the original
  // expression to pass through. For example,
  //
  //   export var a = 1;
  //   console.log(a += 3);
  //
  // becomes
  //
  //   module.export("a", () => a);
  //   var a = 1;
  //   console.log(module.runSetters(a += 3));
  //
  // This ensures module.runSetters runs immediately after the assignment,
  // and does not interfere with the larger computation.
  return valueToPassThrough;
}

// Legacy helper that returns a function that takes a namespace object and
// copies the properties of the namespace to module.exports, excluding any
// "default" property (unless includeDefault is true), which is useful for
// implementing `export * from "module"`.
//
// Instead of using this helper like so:
//
//   module.link(id, { "*": module.makeNsSetter() });
//
// non-legacy code should simply use a string-valued setter:
//
//   module.link(id, { "*": "*" });
//
// or, to include the "default" property:
//
//   module.link(id, { "*": "*+" });
//
// This helper may be removed in a future version of Reify.
function moduleMakeNsSetter(includeDefault) {
  return this.exportAs(includeDefault ? "*+" : "*");
}

function wrapAsync(prepare, moduleThis, moduleContent) {
  let module = this;
  let resolve;

  function exportPromise() {
    if (resolve) {
      return;
    }

    promiseExports[module.id] = new Promise(function (_resolve) {
      resolve = _resolve;
    });
  }

  function isPromise(potentialPromise) {
    return typeof potentialPromise === 'object' &&
      potentialPromise !== null &&
        // Check if exists to avoid Node 14+ showing warnings with circular deps
      'then' in potentialPromise &&
        // TODO: check .then isn't a getter
      typeof potentialPromise.then === 'function';
  }

  function prepareModule() {
    let prepareResult = prepare();
    let hasPromises = false;

    for (let i = 0; i < prepareResult.length; i++) {
      if (isPromise(prepareResult[i])) {
        hasPromises = true;

        break;
      }
    }

    if (hasPromises) {
      exportPromise();
      Promise.all(prepareResult).then(() => {
        evaluateModule();
      });
    } else {
      evaluateModule();
    }
  }

  function evaluateModule() {
    let result = moduleContent.call(moduleThis, module);
    if (isPromise(result)) {
      exportPromise();

      result.then(() => {
        resolve(module.exports);
      });
    } else if (resolve) {
      resolve(module.exports);
    }
  }

  prepareModule();
}
