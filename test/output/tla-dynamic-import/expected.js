!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {__reifyWaitForDeps__();module.dynamicImport('./test.js');

await (() => {
  return module.dynamicImport('meteor/local:async-lazy')
});

await (() => module.dynamicImport('./test2.js'))();

await module.dynamicImport('./test3.js');

(() => module.dynamicImport('./test4.js'))();
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: true });
