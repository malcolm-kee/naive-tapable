import { SyncBailHook as ActualSyncBailHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { SyncBailHook, InterceptOptions } from './sync-bail-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('SyncBailHook', () => {
  const scenarios = [
    { name: 'tapable', hook: ActualSyncBailHook as any as typeof SyncBailHook },
    { name: 'our', hook: SyncBailHook },
  ];

  it('works', () => {
    expect(SyncBailHook.name).toBe(ActualSyncBailHook.name);
  });

  scenarios.forEach((scenario) => {
    describe(`works for ${scenario.name} without bailed`, () => {
      const prepareNonBail = () => {
        const tapable = new scenario.hook(['name', 'age']);

        const cb1 = vi.fn();
        const cb2 = vi.fn();
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        return {
          tapable,
          cb1,
          cb2,
          cb3,
        };
      };

      it(`call without bailed`, () => {
        const { tapable, cb1, cb2, cb3 } = prepareNonBail();

        const result = tapable.call('malcolm', 5);

        expect(result).toBeUndefined();

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).toHaveBeenCalledOnce();
      });

      it(`callAsync without bailed`, async () => {
        const { tapable, cb1, cb2, cb3 } = prepareNonBail();

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenLastCalledWith();
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).toHaveBeenCalledOnce();
      });

      it(`promise without bailed`, async () => {
        const { tapable, cb1, cb2, cb3 } = prepareNonBail();

        const result = await tapable.promise('malcolm', 5);

        expect(result).toBeUndefined();

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).toHaveBeenCalledOnce();
      });
    });

    describe(`works for ${scenario.name} with bailed`, () => {
      const prepareBail = () => {
        const tapable = new scenario.hook(['name', 'age'], 'bailedHook');

        const cb1 = vi.fn();
        const cb2 = vi.fn((name: string, age: number) => ({
          name,
          age,
        }));
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        return {
          cb1,
          cb2,
          cb3,
          tapable,
        };
      };

      it('call with bailed', () => {
        const { cb1, cb2, cb3, tapable } = prepareBail();

        const result = tapable.call('malcolm', 5);

        expect(result).toStrictEqual({
          name: 'malcolm',
          age: 5,
        });

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });

      it('callAsync with bailed', async () => {
        const { cb1, cb2, cb3, tapable } = prepareBail();
        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenLastCalledWith(null, {
          name: 'malcolm',
          age: 5,
        });
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });

      it(`promise with bailed`, async () => {
        const { cb1, cb2, cb3, tapable } = prepareBail();

        const result = await tapable.promise('malcolm', 5);

        expect(result).toStrictEqual({
          name: 'malcolm',
          age: 5,
        });
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });
    });

    describe(`works for ${scenario.name} when error`, () => {
      const prepareError = () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const cb2 = vi.fn(() => {
          throw new Error('error in cb');
        });
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        return {
          cb1,
          cb2,
          cb3,
          tapable,
        };
      };

      it(`call with error`, () => {
        const { cb1, cb2, cb3, tapable } = prepareError();

        expect(() => tapable.call('malcolm', 5)).toThrowError('error in cb');

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });

      it('callAsync with error', async () => {
        const { cb1, cb2, cb3, tapable } = prepareError();
        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });

      it(`promise with error`, async () => {
        const { cb1, cb2, cb3, tapable } = prepareError();

        await expect(tapable.promise('malcolm', 5)).rejects.toThrow('error in cb');

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });
    });
  });
});

describe('SyncBailHook interception', () => {
  const scenarios = [
    { name: 'tapable', hook: ActualSyncBailHook as any as typeof SyncBailHook },
    { name: 'our', hook: SyncBailHook },
  ];

  scenarios.forEach((scenario) => {
    describe(`interception works for ${scenario.name}`, () => {
      const prepare = (
        {
          call = vi.fn(),
          tap = vi.fn(),
          register = vi.fn((x) => x),
          loop = vi.fn(),
        }: Partial<InterceptOptions> = {},
        firstCb = vi.fn(),
        secondCb = vi.fn()
      ) => {
        const tapable = new scenario.hook(['param1', 'param2'], 'myTapable');

        const interceptor = {
          call,
          tap,
          register,
          loop,
        };

        tapable.intercept(interceptor);

        tapable.tap('first', firstCb);
        tapable.tap('second', secondCb);

        return {
          tapable,
          firstCb,
          secondCb,
          interceptor,
        };
      };

      it('works for intercept call', () => {
        const { tapable, interceptor } = prepare();

        tapable.call('first', 2);

        expect(interceptor.call).toHaveBeenCalledOnce();
        expect(interceptor.call).toHaveBeenCalledWith('first', 2);
        expect(interceptor.loop).not.toHaveBeenCalled();
      });

      it('works for intercept call with callAsync', async () => {
        const { tapable, interceptor } = prepare();

        const { cb: finalCb, promise } = createAsyncCallback();
        tapable.callAsync('first', 2, finalCb);

        await promise;

        expect(interceptor.call).toHaveBeenCalledOnce();
        expect(interceptor.call).toHaveBeenCalledWith('first', 2);
        expect(interceptor.loop).not.toHaveBeenCalled();
      });

      it('works for intercept call with promise', async () => {
        const { tapable, interceptor } = prepare();

        await tapable.promise('first', 2);

        expect(interceptor.call).toHaveBeenCalledOnce();
        expect(interceptor.call).toHaveBeenCalledWith('first', 2);
        expect(interceptor.loop).not.toHaveBeenCalled();
      });

      it('works for intercept tap', () => {
        const { tapable, interceptor, firstCb, secondCb } = prepare(
          {},
          vi.fn(() => `bail result`)
        );

        tapable.call('first', 2);

        expect(interceptor.tap).toHaveBeenCalledOnce();
        expect(interceptor.tap).toHaveBeenNthCalledWith(1, {
          type: 'sync',
          fn: firstCb,
          name: 'first',
        });
        expect(interceptor.loop).not.toHaveBeenCalled();
        expect(firstCb).toHaveBeenCalledOnce();
        expect(secondCb).not.toHaveBeenCalled();
      });

      it('works for intercept register', () => {
        const { interceptor } = prepare();

        expect(interceptor.register).toHaveBeenCalledTimes(2);
        expect(interceptor.call).not.toHaveBeenCalled();
        expect(interceptor.tap).not.toHaveBeenCalled();
        expect(interceptor.loop).not.toHaveBeenCalled();
        expect(interceptor.loop).not.toHaveBeenCalled();
      });

      it('allows interceptor.register to overwrite implementation', () => {
        const { tapable, firstCb, secondCb, interceptor } = prepare({
          register: vi.fn((tapInfo) => {
            return {
              ...tapInfo,
              fn:
                tapInfo.name === 'first'
                  ? (...args: any[]) => tapInfo.fn(args) || 'bailed'
                  : tapInfo.fn,
            };
          }),
        });

        tapable.call('Malcolm', 32);

        expect(firstCb).toHaveBeenCalledOnce();
        expect(firstCb).toHaveBeenCalledWith(['Malcolm', 32]);

        expect(secondCb).not.toHaveBeenCalled();

        expect(interceptor.loop).not.toHaveBeenCalled();
      });
    });
  });

  // it('test base case', () => {
  //   const tapable = new ActualSyncBailHook<[string, number], unknown>(['name', 'age']);

  //   const interceptor = {
  //     call: vi.fn(),
  //     tap: vi.fn(),
  //     register: vi.fn((x) => x),
  //     loop: vi.fn(),
  //   };

  //   tapable.intercept(interceptor);

  //   const firstCb = vi.fn();
  //   const secondCb = vi.fn();

  //   tapable.tap('first', firstCb);
  //   tapable.tap('second', secondCb);

  //   tapable.call('name', 24);

  //   console.log('call', interceptor.call.mock.calls);
  //   console.log('tap', interceptor.tap.mock.calls);
  //   console.log('register', interceptor.register.mock.calls);
  //   console.log('loop', interceptor.loop.mock.calls);
  // });
});
