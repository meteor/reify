import './async-child-without-tla';

await 0;

throw new Error('parent-error');
