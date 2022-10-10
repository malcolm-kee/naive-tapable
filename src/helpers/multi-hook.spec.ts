import { MultiHook as ActualMultiHook, SyncHook, AsyncSeriesHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { MultiHook } from './multi-hook';

describe('MultiHook', () => {
  it('has same name', () => {
    expect(MultiHook.name).toBe(ActualMultiHook.name);
  });

  [
    {
      name: 'tapable',
      hook: ActualMultiHook as any as typeof MultiHook,
    },
    {
      name: 'our',
      hook: MultiHook,
    },
  ].forEach((scenario) => {
    it(`${scenario.name} works for sync hook`, () => {
      const firstHook = new SyncHook(['name']);
      const secondHook = new SyncHook(['lastName']);

      const multiHook = new scenario.hook([firstHook, secondHook]);

      const cb1 = vi.fn();
      const cb2 = vi.fn();

      multiHook.tap('cb1', cb1);
      multiHook.tap('cb2', cb2);

      firstHook.call('React');
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb1).toHaveBeenCalledWith('React');
      expect(cb2).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledWith('React');

      cb1.mockClear();
      cb2.mockClear();

      secondHook.call('Angular');
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb1).toHaveBeenCalledWith('Angular');
      expect(cb2).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledWith('Angular');
    });

    it(`${scenario.name} works for async hook`, async () => {
      const firstHook = new AsyncSeriesHook<[string, string[]]>(['name', 'data']);
      const secondHook = new AsyncSeriesHook<[string, string[]]>(['lastName', 'data']);

      const multiHook = new scenario.hook([firstHook, secondHook]);

      const cb1 = vi.fn(
        (_: unknown, data: string[]) =>
          new Promise<void>((fulfill) => {
            setTimeout(() => {
              data.push('cb1');
              fulfill();
            }, 100);
          })
      );
      const cb2 = vi.fn((_: unknown, data: string[], cb: () => void) => {
        setTimeout(() => {
          data.push('cb2');
          cb();
        }, 50);
      });

      multiHook.tapPromise('cb1', cb1);
      multiHook.tapAsync('cb2', cb2);

      const firstData: string[] = [];
      await firstHook.promise('React', firstData);
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
      expect(firstData).toStrictEqual(['cb1', 'cb2']);

      cb1.mockClear();
      cb2.mockClear();

      const secondData: string[] = [];
      await secondHook.promise('Angular', secondData);
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
      expect(secondData).toStrictEqual(['cb1', 'cb2']);
    });
  });
});
