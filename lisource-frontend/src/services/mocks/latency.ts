/** Artificial latency so loading/skeleton states are demonstrable without a backend. */
export function delay<T>(value: T, ms = 550): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function fail(error: unknown, ms = 400): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(error), ms));
}
