import { Deferred, createDeferred } from '@fmtk/util-deferred';

export interface Queue<T> extends AsyncIterable<T> {
  end(): void;
  error(err: unknown): void;
  push(value: T): void;
  shift(): Promise<IteratorResult<T>>;
}

export function createQueue<T>(drain?: () => void): Queue<T> {
  let done = false;
  let errorValue: unknown = undefined;
  let hasError = false;
  const values: T[] = [];
  const waiters: Deferred<IteratorResult<T>>[] = [];

  function end(): void {
    done = true;
    for (const waiter of waiters) {
      waiter.resolve({ value: undefined, done: true });
    }
  }

  function error(err: unknown): void {
    hasError = true;
    errorValue = err;

    for (const waiter of waiters) {
      waiter.reject(err);
    }
  }

  function push(value: T): void {
    if (hasError) {
      throw new Error(`stream is in error state`);
    }
    if (done) {
      throw new Error(`stream is done`);
    }
    const waiter = waiters.shift();
    if (waiter) {
      waiter.resolve({ value });
    } else {
      values.push(value);
    }
  }

  async function shift(): Promise<IteratorResult<T>> {
    if (done) {
      return { done: true, value: undefined };
    }
    if (hasError) {
      throw errorValue;
    }
    if (values.length) {
      // we just checked the length, know it won't be null
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return { value: values.shift()! };
    }
    const waiter = createDeferred<IteratorResult<T>>();
    waiters.push(waiter);

    if (waiters.length === 1 && drain) {
      // only call drain for the first waiter
      drain();
    }
    return await waiter.promise;
  }

  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return {
        next: shift,
      };
    },
    end,
    error,
    push,
    shift,
  };
}
