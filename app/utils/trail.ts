export function trail(...args: any[]) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.log(...args);
}

export function trailWarn(...args: any[]) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.warn(...args);
}

export function trailError(...args: any[]) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.error(...args);
}


