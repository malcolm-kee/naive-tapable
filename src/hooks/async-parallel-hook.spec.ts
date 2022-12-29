import { AsyncParallelHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { AsyncParallelHook, InterceptOptions } from './async-parallel-hook';
import { createAsyncCallback } from './utils/test-helper';

const scenarios = [
  {
    name: 'tapable',
    hook: ActualHook as any as typeof AsyncParallelHook,
  },
  {
    name: 'our',
    hook: AsyncParallelHook,
  },
];

describe('AsyncParallelHook', () => {
  it('has the right name', () => {
    expect(AsyncParallelHook.name).toBe(ActualHook.name);
  });

  scenarios.forEach((scenario) => {
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

      it('promise without issue with all sync', async () => {
        const tapable = new scenario.hook(['name'], 'myHook');

        const cb1 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb1', cb1);
        tapable.tap('cb1', cb1);

        await tapable.promise('malcolm');

        expect(cb1).toHaveBeenCalledTimes(3);
      });

      it('promise without issue with all promises', async () => {
        const tapable = new scenario.hook(['name'], 'myHook');

        const promiseCb = vi.fn(() => new Promise<void>((fulfill) => setTimeout(fulfill, 50)));

        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tapPromise('promiseCb', promiseCb);

        await tapable.promise('malcolm');

        expect(promiseCb).toHaveBeenCalledTimes(3);
      });
    });

    describe(`works for ${scenario.name} with callback issue`, () => {
      const prepareCallbackIssue = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const asyncCb = vi.fn((_: string, __: number, cb: () => void) =>
          setTimeout(() => cb(), 50)
        );
        const cb1 = vi.fn(() => {
          throw new Error('error in callback');
        });
        const promiseCb = vi.fn(() => new Promise<void>((fulfill) => setTimeout(fulfill, 50)));

        tapable.tapAsync('asyncCb', asyncCb);
        tapable.tap('cb1', cb1);
        tapable.tapPromise('promiseCb', promiseCb);

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

        expect(asyncCb).toHaveBeenCalledOnce();
        expect(cb1).toHaveBeenCalledOnce();
        expect(promiseCb).not.toHaveBeenCalled();
      });

      it('callAsync with callback issue', async () => {
        const { tapable, cb1, promiseCb, asyncCb } = prepareCallbackIssue();
        const { promise, cb } = createAsyncCallback();

        tapable.callAsync('malcolm', 3, cb);
        await promise;

        expect(cb).toHaveBeenCalledOnce();
        expect(cb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(cb1).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(promiseCb).not.toHaveBeenCalled();
      });
    });

    describe(`works for ${scenario.name} with promise issue`, () => {
      const preparePromiseIssue = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const asyncCb = vi.fn((_: string, __: number, cb: () => void) =>
          setTimeout(() => cb(), 50)
        );
        const promiseCb = vi.fn(
          () =>
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error('promise error')), 50)
            )
        );
        const cb1 = vi.fn();

        tapable.tapAsync('asyncCb', asyncCb);
        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tap('cb1', cb1);

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

scenarios.forEach((scenario) => {
  describe(`AsyncParallelHook interception works for ${scenario.name}`, () => {
    const prepareNoIssue = ({
      call = vi.fn(),
      tap = vi.fn(),
      register = vi.fn((x) => x),
      loop = vi.fn(),
    }: Partial<InterceptOptions> = {}) => {
      const tapable = new scenario.hook(['name', 'age'], 'myHook');

      const interceptor = {
        call,
        tap,
        register,
        loop,
      };

      tapable.intercept(interceptor);

      const cb1 = vi.fn();
      const promiseCb = vi.fn(() => new Promise<void>((fulfill) => setTimeout(fulfill, 50)));
      const asyncCb = vi.fn((_: string, __: number, cb: () => void) => setTimeout(() => cb(), 50));

      tapable.tap('cb1', cb1);
      tapable.tapPromise('promiseCb', promiseCb);
      tapable.tapAsync('asyncCb', asyncCb);

      return {
        tapable,
        interceptor,
        cb1,
        promiseCb,
        asyncCb,
      };
    };

    it('works for intercept call with promise', async () => {
      const { tapable, interceptor, cb1, promiseCb, asyncCb } = prepareNoIssue();

      await tapable.promise('malcolm', 3);

      expect(interceptor.call).toHaveBeenCalledOnce();
      expect(interceptor.call).toHaveBeenCalledWith('malcolm', 3);
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb1).toHaveBeenCalledWith('malcolm', 3);
      expect(promiseCb).toHaveBeenCalledOnce();
      expect(promiseCb).toHaveBeenCalledWith('malcolm', 3);
      expect(asyncCb).toHaveBeenCalledOnce();
      expect(interceptor.loop).not.toHaveBeenCalled();
    });

    it('works for intercept call with callAsync', async () => {
      const { tapable, interceptor, cb1, promiseCb, asyncCb } = prepareNoIssue();

      const { cb: finalCb, promise } = createAsyncCallback();

      tapable.callAsync('malcolm', 3, finalCb);

      await promise;

      expect(interceptor.call).toHaveBeenCalledOnce();
      expect(interceptor.call).toHaveBeenCalledWith('malcolm', 3);
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb1).toHaveBeenCalledWith('malcolm', 3);
      expect(promiseCb).toHaveBeenCalledOnce();
      expect(promiseCb).toHaveBeenCalledWith('malcolm', 3);
      expect(asyncCb).toHaveBeenCalledOnce();
      expect(interceptor.loop).not.toHaveBeenCalled();
    });

    it('works for intercept tap', async () => {
      const { tapable, interceptor, cb1, promiseCb, asyncCb } = prepareNoIssue();

      await tapable.promise('malcolm', 3);

      expect(interceptor.tap).toHaveBeenCalledTimes(3);
      expect(interceptor.tap).toHaveBeenNthCalledWith(1, {
        type: 'sync',
        fn: cb1,
        name: 'cb1',
      });
      expect(interceptor.tap).toHaveBeenNthCalledWith(2, {
        type: 'promise',
        fn: promiseCb,
        name: 'promiseCb',
      });
      expect(interceptor.tap).toHaveBeenNthCalledWith(3, {
        type: 'async',
        fn: asyncCb,
        name: 'asyncCb',
      });

      expect(interceptor.loop).not.toHaveBeenCalled();
    });

    it('works for intercept register', () => {
      const { interceptor } = prepareNoIssue();

      expect(interceptor.register).toHaveBeenCalledTimes(3);
    });

    it('allows interceptor.register to overwrite implementation', async () => {
      const { tapable, interceptor, cb1, promiseCb } = prepareNoIssue({
        register(tap) {
          return {
            ...tap,
            ...(tap.name === 'promiseCb'
              ? {
                  fn: (...params: any[]) => tap.fn(params),
                }
              : {}),
          };
        },
      });

      await tapable.promise('malcolm', 3);

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb1).toHaveBeenCalledWith('malcolm', 3);
      expect(promiseCb).toHaveBeenCalledOnce();
      expect(promiseCb).toHaveBeenCalledWith(['malcolm', 3]);

      expect(interceptor.loop).not.toHaveBeenCalled();
    });
  });
});
