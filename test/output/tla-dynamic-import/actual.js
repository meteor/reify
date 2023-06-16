import('./test.js');

await (() => {
  return import('meteor/local:async-lazy')
});

await (() => import('./test2.js'))();

await import('./test3.js');

(() => import('./test4.js'))();
