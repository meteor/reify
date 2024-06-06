export const test = await new Promise((resolve) => {
  setTimeout(() => {
    resolve('value');
  }, 1)
})