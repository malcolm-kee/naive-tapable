import { vi } from 'vitest';

export const createAsyncCallback = () => {
  let resolve: () => void;
  const promise = new Promise<void>((fulfill) => {
    resolve = fulfill;
  });
  const cb = vi.fn(() => resolve());

  return {
    promise,
    cb,
  };
};
