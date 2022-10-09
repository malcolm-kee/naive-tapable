import { AsyncParallelBailHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { AsyncParallelBailHook } from './async-parallel-bail-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('AsyncParallelBailHook', () => {
  it('has the same name', () => {
    expect(AsyncParallelBailHook.name).toBe(ActualHook.name);
  });

  [
    {
      name: 'tapable',
      hook: ActualHook as any as typeof AsyncParallelBailHook,
    },
    {
      name: 'our',
      hook: AsyncParallelBailHook,
    },
  ].forEach((scenario) => {
    describe(`${scenario.name} works without bail`, () => {
      const prepareWithoutBail = () => {
        const tapable = new scenario.hook(['name', 'age']);

        const cb1 = vi.fn();
        const promiseCb = vi.fn(
          () => new Promise<number | undefined>((fulfill) => setTimeout(fulfill, 50))
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

      it('callAsync without bail', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareWithoutBail();

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith();
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledWith('malcolm', 5);
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledWith('malcolm', 5);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledWith('malcolm', 5, expect.any(Function));
      });

      it('promise without bail', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareWithoutBail();

        const result = await tapable.promise('malcolm', 5);

        expect(result).toBeUndefined();
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledWith('malcolm', 5);
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledWith('malcolm', 5);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledWith('malcolm', 5, expect.any(Function));
      });
    });

    describe(`${scenario.name} works with bail using cb`, () => {
      const prepareWithBailUsingCb = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const promiseCb = vi.fn(
          () => new Promise<number | undefined>((fulfill) => setTimeout(fulfill, 50))
        );
        const cb1 = vi.fn(() => 100);
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

      it('callAsync with cb bail', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareWithBailUsingCb();

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 100);
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledWith('malcolm', 5);
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledWith('malcolm', 5);
        expect(asyncCb).not.toHaveBeenCalled();
      });

      it('promise with cb bail', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareWithBailUsingCb();

        const result = await tapable.promise('malcolm', 5);

        expect(result).toBe(100);
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledWith('malcolm', 5);
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledWith('malcolm', 5);
        expect(asyncCb).not.toHaveBeenCalled();
      });
    });

    describe(`${scenario.name} works with bail using promise`, () => {
      const prepareWithBailUsingPromise = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const promiseCb = vi.fn(
          () => new Promise<number | undefined>((fulfill) => setTimeout(() => fulfill(100), 50))
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

      it('callAsync with promise bail', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareWithBailUsingPromise();

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 100);
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledWith('malcolm', 5);
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledWith('malcolm', 5);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledWith('malcolm', 5, expect.any(Function));
      });

      it('promise with promise bail', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareWithBailUsingPromise();

        const result = await tapable.promise('malcolm', 5);

        expect(result).toBe(100);
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledWith('malcolm', 5);
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledWith('malcolm', 5);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledWith('malcolm', 5, expect.any(Function));
      });
    });

    describe(`${scenario.name} works with bail using async`, () => {
      const prepareWithBailUsingAsync = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const asyncCb = vi.fn(
          (_: string, __: number, cb: (error: Error | null, value: number) => void) =>
            setTimeout(() => cb(null, 100), 50)
        );
        const promiseCb = vi.fn(
          () => new Promise<number | undefined>((fulfill) => setTimeout(fulfill, 50))
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

      it('callAsync with async bail', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareWithBailUsingAsync();

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 100);
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledWith('malcolm', 5);
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledWith('malcolm', 5);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledWith('malcolm', 5, expect.any(Function));
      });

      it('promise with async bail', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareWithBailUsingAsync();

        const result = await tapable.promise('malcolm', 5);

        expect(result).toBe(100);
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledWith('malcolm', 5);
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledWith('malcolm', 5);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledWith('malcolm', 5, expect.any(Function));
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
