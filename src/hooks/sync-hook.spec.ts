import { SyncHook as ActualSyncHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { SyncHook, InterceptOptions } from './sync-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('SyncHook', () => {
  const scenarios = [
    { name: 'tapable', hook: ActualSyncHook as any as typeof SyncHook },
    { name: 'our', hook: SyncHook },
  ];

  it('works', () => {
    expect(SyncHook.name).toBe(ActualSyncHook.name);
  });

  scenarios.forEach((scenario) => {
    describe(`works for ${scenario.name}`, async () => {
      const preparePositive = () => {
        const tapable = new scenario.hook(['param1', 'param2'], 'myTapable');
        const cb = vi.fn();
        tapable.tap('cb', cb);

        return {
          tapable,
          cb,
        };
      };

      it(`works for call`, () => {
        const { tapable, cb } = preparePositive();

        tapable.call('What', true);

        expect(cb).toHaveBeenCalledOnce();
        expect(cb).toHaveBeenLastCalledWith('What', true);
      });

      it('works for callAsync', async () => {
        const { tapable, cb } = preparePositive();

        const { cb: finalCb, promise } = createAsyncCallback();
        tapable.callAsync('What', true, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenLastCalledWith();
        expect(cb).toHaveBeenCalledOnce();
        expect(cb).toHaveBeenLastCalledWith('What', true);

        cb.mockClear();

        const problematicCb = vi.fn(() => {
          throw new Error('Some problem');
        });

        const { cb: errorCb, promise: promise2 } = createAsyncCallback();

        tapable.tap('problem', problematicCb);
        tapable.callAsync('Second', false, errorCb);

        await promise2;

        expect(errorCb).toHaveBeenCalledOnce();
        expect(errorCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(cb).toHaveBeenCalledOnce();
        expect(cb).toHaveBeenLastCalledWith('Second', false);
        expect(problematicCb).toHaveBeenCalledOnce();
        expect(problematicCb).toHaveBeenLastCalledWith('Second', false);
      });

      it('works for promise', async () => {
        const { tapable, cb } = preparePositive();
        const result = await tapable.promise('malcolm', false);

        expect(cb).toHaveBeenCalledOnce();
        expect(cb).toHaveBeenLastCalledWith('malcolm', false);
        expect(result).toBeUndefined();

        cb.mockClear();

        const errorCb = vi.fn(() => {
          throw new Error('promise error');
        });

        tapable.tap('errorCb', errorCb);

        await expect(tapable.promise('holla', true)).rejects.toThrow('promise error');
        expect(cb).toHaveBeenCalledOnce();
        expect(cb).toHaveBeenLastCalledWith('holla', true);
        expect(errorCb).toHaveBeenCalledOnce();
        expect(errorCb).toHaveBeenLastCalledWith('holla', true);
      });
    });
  });
});

describe('SyncHook interception', () => {
  const scenarios = [
    { name: 'tapable', hook: ActualSyncHook as any as typeof SyncHook },
    { name: 'our', hook: SyncHook },
  ];

  scenarios.forEach((scenario) => {
    describe(`interception works for ${scenario.name}`, () => {
      const prepare = ({
        call = vi.fn(),
        tap = vi.fn(),
        register = vi.fn((x) => x),
        loop = vi.fn(),
      }: Partial<InterceptOptions> = {}) => {
        const tapable = new scenario.hook(['param1', 'param2'], 'myTapable');

        const interceptor = {
          call,
          tap,
          register,
          loop,
        };

        tapable.intercept(interceptor);

        const firstCb = vi.fn();
        const secondCb = vi.fn();

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
        const { tapable, interceptor, firstCb, secondCb } = prepare();

        tapable.call('first', 2);

        expect(interceptor.tap).toHaveBeenCalledTimes(2);
        expect(interceptor.tap).toHaveBeenNthCalledWith(1, {
          type: 'sync',
          fn: firstCb,
          name: 'first',
        });
        expect(interceptor.tap).toHaveBeenNthCalledWith(2, {
          type: 'sync',
          fn: secondCb,
          name: 'second',
        });
        expect(interceptor.loop).not.toHaveBeenCalled();
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
              fn: tapInfo.name === 'second' ? (...args: any[]) => tapInfo.fn(args) : tapInfo.fn,
            };
          }),
        });

        tapable.call('first', 'second');

        expect(firstCb).toHaveBeenCalledOnce();
        expect(firstCb).toHaveBeenCalledWith('first', 'second');

        expect(secondCb).toHaveBeenCalledOnce();
        expect(secondCb).toHaveBeenCalledWith(['first', 'second']);

        expect(interceptor.loop).not.toHaveBeenCalled();
      });
    });
  });
});
