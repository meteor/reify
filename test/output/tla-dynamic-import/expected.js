!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reify_async_result__) {"use strict"; try {if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();module.dynamicImport('./test.js');

await (() => {
  return module.dynamicImport('meteor/local:async-lazy')
});

await (() => module.dynamicImport('./test2.js'))();

await module.dynamicImport('./test3.js');

(() => module.dynamicImport('./test4.js'))();
//*/
} catch (_reifyError) { return __reify_async_result__(_reifyError); } __reify_async_result__(); }, { self: this, async: true });