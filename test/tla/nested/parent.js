export function importSync() {
  import * as all from './child-sync.js';

  return all;
}

export function importAsync() {
  import * as all from './child-async-1.js';

  return all;
}

import './child-async-2';
export function importAsyncEvaluated() {
  import * as all from './child-async-2.js';

  return all;
}
