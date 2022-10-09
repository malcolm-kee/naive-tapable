import { AsyncParallelHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { AsyncParallelHook } from './async-parallel-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('AsyncParallelHook', () => {
  it('has the right name', () => {
    expect(AsyncParallelHook.name).toBe(ActualHook.name);
  });

  [
    {
      name: 'tapable',
      hook: ActualHook as any as typeof AsyncParallelHook,
    },
    {
      name: 'our',
      hook: AsyncParallelHook,
    },
  ].forEach((scenario) => {
    describe(`works for ${scenario.name} without issue`, () => {
      const prepareNoIssue = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const promiseCb = vi.fn(() => new Promise<void>((fulfill) => setTimeout(fulfill, 50)));
        const asyncCb = vi.fn((_: string, __: number, cb: () => void) =>
          setTimeout(() => cb(), 50)
        );

        tapable.tap('cb1', cb1);
        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tapAsync('asyncCb', asyncCb);

        return {
          tapable,
          cb1,
          promiseCb,
          asyncCb,
        };
      };

      it('promise without issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareNoIssue();

        await tapable.promise('malcolm', 3);

        expect(cb1).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });

      it('callAsync without issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareNoIssue();
        const { promise, cb } = createAsyncCallback();

        tapable.callAsync('malcolm', 3, cb);
        await promise;

        expect(cb).toHaveBeenCalledOnce();
        expect(cb).toHaveBeenCalledWith();
        expect(cb1).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });
    });

    describe(`works for ${scenario.name} with callback issue`, () => {
      const prepareCallbackIssue = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const promiseCb = vi.fn(() => new Promise<void>((fulfill) => setTimeout(fulfill, 50)));
        const cb1 = vi.fn(() => {
          throw new Error('error in callback');
        });
        const asyncCb = vi.fn((_: string, __: number, cb: () => void) =>
          setTimeout(() => cb(), 50)
        );

        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tap('cb1', cb1);
        tapable.tapAsync('asyncCb', asyncCb);

        return {
          tapable,
          cb1,
          promiseCb,
          asyncCb,
        };
      };

      it('promise with callback issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareCallbackIssue();

        await expect(tapable.promise('malcolm', 3)).rejects.toThrowError('error in callback');

        expect(promiseCb).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledOnce();
        expect(asyncCb).not.toHaveBeenCalled();
      });

      it('callAsync with callback issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareCallbackIssue();
        const { promise, cb } = createAsyncCallback();

        tapable.callAsync('malcolm', 3, cb);
        await promise;

        expect(cb).toHaveBeenCalledOnce();
        expect(cb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(cb1).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).not.toHaveBeenCalledOnce();
      });
    });

    describe(`works for ${scenario.name} with promise issue`, () => {
      const preparePromiseIssue = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const promiseCb = vi.fn(
          () =>
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error('promise error')), 50)
            )
        );
        const asyncCb = vi.fn((_: string, __: number, cb: () => void) =>
          setTimeout(() => cb(), 50)
        );

        tapable.tap('cb1', cb1);
        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tapAsync('asyncCb', asyncCb);

        return {
          tapable,
          cb1,
          promiseCb,
          asyncCb,
        };
      };

      it('promise with promise issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = preparePromiseIssue();

        await expect(tapable.promise('malcolm', 3)).rejects.toThrowError('promise error');

        expect(promiseCb).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });

      it('callAsync with promise issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = preparePromiseIssue();
        const { promise, cb: finalCb } = createAsyncCallback();

        tapable.callAsync('malcolm', 3, finalCb);
        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(cb1).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });
    });

    describe(`works for ${scenario.name} with async issue`, () => {
      const prepareAsyncIssue = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const promiseCb = vi.fn(() => new Promise<void>((fulfill) => setTimeout(fulfill, 50)));
        const asyncCb = vi.fn((_: string, __: number, cb: (error: Error) => void) =>
          setTimeout(() => cb(new Error('async error')), 50)
        );

        tapable.tap('cb1', cb1);
        tapable.tapAsync('asyncCb', asyncCb);
        tapable.tapPromise('promiseCb', promiseCb);

        return {
          tapable,
          cb1,
          promiseCb,
          asyncCb,
        };
      };

      it('promise with async issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareAsyncIssue();

        await expect(tapable.promise('malcolm', 3)).rejects.toThrowError('async error');

        expect(promiseCb).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });

      it('callAsync with async issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareAsyncIssue();
        const { promise, cb: finalCb } = createAsyncCallback();

        tapable.callAsync('malcolm', 3, finalCb);
        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(cb1).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });
    });
  });
});
