const flip = (data) =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [value, key]));

export { flip };
