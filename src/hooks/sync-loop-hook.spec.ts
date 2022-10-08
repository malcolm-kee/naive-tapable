import { SyncLoopHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { SyncLoopHook } from './sync-loop-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('SyncLoopHook', () => {
  it('matches the name', () => {
    expect(SyncLoopHook.name).toBe(ActualHook.name);
  });

  const scenarios = [
    { name: 'tapable', hook: ActualHook as any as typeof SyncLoopHook },
    { name: 'our', hook: SyncLoopHook },
  ];

  scenarios.forEach((scenario) => {
    describe('call', () => {
      it(`${scenario.name} works if there is looping`, () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          if (data.total < 30) {
            data.total += 10;
            return data;
          }
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        tapable.call(data);

        expect(invertSign).toHaveBeenCalledTimes(4);
        expect(plusTenUntilThirty).toHaveBeenCalledTimes(4);
        expect(data.total).toMatchInlineSnapshot('39');
      });

      it(`${scenario.name} works if there is no looping`, () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          data.total += 10;
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        tapable.call(data);

        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });

      it(`${scenario.name} works if there is error`, () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          data.total += 10;
          throw new Error('computation error');
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        expect(() => tapable.call(data)).toThrowError('computation error');

        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });
    });

    describe('callAsync', () => {
      it(`${scenario.name} works if there is looping`, async () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          if (data.total < 30) {
            data.total += 10;
            return data;
          }
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync(data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith();
        expect(invertSign).toHaveBeenCalledTimes(4);
        expect(plusTenUntilThirty).toHaveBeenCalledTimes(4);
        expect(data.total).toMatchInlineSnapshot('39');
      });

      it(`${scenario.name} works if there is no looping`, async () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          data.total += 10;
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync(data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith();
        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });

      it(`${scenario.name} works if there is error`, async () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          data.total += 10;
          throw new Error('computation error');
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync(data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });
    });

    describe('promise', () => {
      it(`${scenario.name} works if there is looping`, async () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          if (data.total < 30) {
            data.total += 10;
            return data;
          }
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        await tapable.promise(data);

        expect(invertSign).toHaveBeenCalledTimes(4);
        expect(plusTenUntilThirty).toHaveBeenCalledTimes(4);
        expect(data.total).toMatchInlineSnapshot('39');
      });

      it(`${scenario.name} works if there is no looping`, async () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          data.total += 10;
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        await tapable.promise(data);

        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });

      it(`${scenario.name} works if there is error`, async () => {
        interface Data {
          total: number;
        }

        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          data.total += 10;
          throw new Error('computation error');
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        const data: Data = {
          total: 5,
        };

        await expect(tapable.promise(data)).rejects.toThrowError('computation error');

        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });
    });
  });
});
