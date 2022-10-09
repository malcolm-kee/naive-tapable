import { SyncHook as ActualSyncHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { SyncHook } from './sync-hook';
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
