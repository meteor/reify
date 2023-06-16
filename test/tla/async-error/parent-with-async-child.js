import './async-import-child.js';

await 0;

throw new Error('parent-error');
