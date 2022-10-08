import { SyncHook as ActualSyncHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { SyncHook } from './sync-hook';

describe('SyncHook', () => {
  const scenarios = [
    { name: 'tapable', hook: ActualSyncHook as any as typeof SyncHook },
    { name: 'our', hook: SyncHook },
  ];

  it('works', () => {
    expect(SyncHook.name).toBe(ActualSyncHook.name);
  });

  describe('call', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name}`, () => {
        const myTapable = new scenario.hook(['param1', 'param2'], 'myTapable');
        const myCb = vi.fn();
        myTapable.tap('myCb', myCb);
        myTapable.call('What', true);

        expect(myCb).toHaveBeenCalledOnce();
        expect(myCb).toHaveBeenLastCalledWith('What', true);
      });
    });
  });

  describe('callAsync', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name}`, async () => {
        const actualTapable = new scenario.hook(['param1', 'param2'], 'myTapable');

        let resolve: () => void;
        const promise = new Promise<void>((fulfill) => {
          resolve = fulfill;
        });

        const actualCb = vi.fn((...args) => args);
        const actualFinalCb = vi.fn(() => resolve());
        actualTapable.tap('actualCb', actualCb);
        actualTapable.callAsync('What', true, actualFinalCb);

        await promise;

        expect(actualFinalCb).toHaveBeenCalledOnce();
        expect(actualFinalCb).toHaveBeenLastCalledWith();
        expect(actualCb).toHaveBeenCalledOnce();
        expect(actualCb).toHaveBeenLastCalledWith('What', true);

        actualCb.mockClear();

        const problematicCb = vi.fn(() => {
          throw new Error('Some problem');
        });

        let resolve2: () => void;
        const promise2 = new Promise<void>((fulfill) => {
          resolve2 = fulfill;
        });
        const actualErrorCb2 = vi.fn(() => resolve2());

        actualTapable.tap('problem', problematicCb);
        actualTapable.callAsync('Second', false, actualErrorCb2);

        await promise2;

        expect(actualErrorCb2).toHaveBeenCalledOnce();
        expect(actualErrorCb2.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(actualCb).toHaveBeenCalledOnce();
        expect(actualCb).toHaveBeenLastCalledWith('Second', false);
        expect(problematicCb).toHaveBeenCalledOnce();
        expect(problematicCb).toHaveBeenLastCalledWith('Second', false);
      });
    });
  });

  describe('promise', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name}`, async () => {
        const tapable = new scenario.hook(['name', 'isOk']);

        const cb = vi.fn((name: string, isOk: boolean) => ({
          name,
          isOk,
        }));

        tapable.tap('callback', cb);
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
