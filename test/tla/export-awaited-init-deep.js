await 0

const asyncInitializer = async () => 12;

export const value = Math.max(false ? 666 : await asyncInitializer(), 2);
