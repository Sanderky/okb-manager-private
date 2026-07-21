export const delay = (ms = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));
