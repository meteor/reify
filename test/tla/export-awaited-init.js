const asyncInitializer = async () => 8;

export const value1 = await asyncInitializer();

let ternaryChecker = false;

export const value2 = ternaryChecker ? 66 : await asyncInitializer();
