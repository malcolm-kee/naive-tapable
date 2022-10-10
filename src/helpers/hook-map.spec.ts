import { HookMap as ActualHookMap, SyncHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { HookMap } from './hook-map';

describe('HookMap', () => {
  it('has same name', () => {
    expect(HookMap.name).toBe(ActualHookMap.name);
  });

  [
    {
      name: 'tapable',
      map: ActualHookMap as any as typeof HookMap,
    },
    {
      name: 'our',
      map: HookMap,
    },
  ].forEach((scenario) => {
    it(`${scenario.name} works`, () => {
      const map = new scenario.map(() => new SyncHook<[string, number]>(['name', 'age']));

      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const cb3 = vi.fn();
      const cb4 = vi.fn();

      map.for('firstKey').tap('cb1', cb1);
      map.for('firstKey').tap('cb2', cb2);
      map.for('secondKey').tap('cb3', cb3);
      map.for('secondKey').tap('cb4', cb4);

      map.get('firstKey')?.call('malcolm', 5);

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
      expect(cb3).not.toHaveBeenCalled();
      expect(cb4).not.toHaveBeenCalled();
    });
  });
});
