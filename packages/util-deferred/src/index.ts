export interface Deferred<T> {
  resolve(value: T): void;
  reject(err: unknown): void;
  promise: Promise<T>;
}

export function createDeferred<T>(): Deferred<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret: any = {};
  ret.promise = new Promise((resolve, reject) => {
    ret.resolve = resolve;
    ret.reject = reject;
  });
  Object.freeze(ret);
  return ret;
}
