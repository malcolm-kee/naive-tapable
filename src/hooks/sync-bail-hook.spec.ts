import { SyncBailHook as ActualSyncBailHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { SyncBailHook } from './sync-bail-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('SyncBailHook', () => {
  const scenarios = [
    { name: 'tapable', hook: ActualSyncBailHook as any as typeof SyncBailHook },
    { name: 'our', hook: SyncBailHook },
  ];

  it('works', () => {
    expect(SyncBailHook.name).toBe(ActualSyncBailHook.name);
  });

  describe('call', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name} without bailed`, () => {
        const tapable = new scenario.hook(['name', 'age']);

        const cb1 = vi.fn();
        const cb2 = vi.fn();
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        const result = tapable.call('malcolm', 5);

        expect(result).toBeUndefined();

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).toHaveBeenCalledOnce();
      });

      it(`works for ${scenario.name} with bailed`, () => {
        const tapable = new scenario.hook(['name', 'age']);

        const cb1 = vi.fn();
        const cb2 = vi.fn((name: string, age: number) => ({
          name,
          age,
        }));
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        const result = tapable.call('malcolm', 5);

        expect(result).toStrictEqual({
          name: 'malcolm',
          age: 5,
        });

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });
    });
  });

  describe('callAsync', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name} without bailed`, async () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const cb2 = vi.fn();
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenLastCalledWith();
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).toHaveBeenCalledOnce();
      });

      it(`works for ${scenario.name} when bailed`, async () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const cb2 = vi.fn((name: string, age: number) => ({
          name,
          age,
        }));
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

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

      it(`works for ${scenario.name} when error`, async () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const cb2 = vi.fn(() => {
          throw new Error('error in cb');
        });
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync('malcolm', 5, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });
    });
  });

  describe('promise', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name} without bailed`, async () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const cb2 = vi.fn();
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        const result = await tapable.promise('malcolm', 5);

        expect(result).toBeUndefined();

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).toHaveBeenCalledOnce();
      });

      it(`works for ${scenario.name} when bailed`, async () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const cb2 = vi.fn((name: string, age: number) => ({
          name,
          age,
        }));
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        const result = await tapable.promise('malcolm', 5);

        expect(result).toStrictEqual({
          name: 'malcolm',
          age: 5,
        });
        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });

      it(`works for ${scenario.name} when error`, async () => {
        const tapable = new scenario.hook(['name', 'age'], 'myHook');

        const cb1 = vi.fn();
        const cb2 = vi.fn(() => {
          throw new Error('error in cb');
        });
        const cb3 = vi.fn();

        tapable.tap('cb1', cb1);
        tapable.tap('cb2', cb2);
        tapable.tap('cb3', cb3);

        await expect(tapable.promise('malcolm', 5)).rejects.toThrow('error in cb');

        expect(cb1).toHaveBeenCalledOnce();
        expect(cb2).toHaveBeenCalledOnce();
        expect(cb3).not.toHaveBeenCalled();
      });
    });
  });
});
