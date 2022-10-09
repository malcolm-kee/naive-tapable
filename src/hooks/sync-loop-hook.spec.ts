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

  interface Data {
    total: number;
  }

  scenarios.forEach((scenario) => {
    describe(`${scenario.name} looping`, () => {
      const prepareLooping = () => {
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

        return {
          invertSign,
          plusTenUntilThirty,
          tapable,
        };
      };

      it(`call with looping`, () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareLooping();
        const data: Data = {
          total: 5,
        };

        tapable.call(data);

        expect(invertSign).toHaveBeenCalledTimes(4);
        expect(plusTenUntilThirty).toHaveBeenCalledTimes(4);
        expect(data.total).toMatchInlineSnapshot('39');
      });

      it('callAsync with looping', async () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareLooping();
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

      it('promise with looping', async () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareLooping();
        const data: Data = {
          total: 5,
        };

        await tapable.promise(data);

        expect(invertSign).toHaveBeenCalledTimes(4);
        expect(plusTenUntilThirty).toHaveBeenCalledTimes(4);
        expect(data.total).toMatchInlineSnapshot('39');
      });
    });

    describe(`${scenario.name} without looping`, () => {
      const prepareNoLooping = () => {
        const tapable = new scenario.hook(['data'], 'myHook');

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          data.total += 10;
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        return {
          tapable,
          invertSign,
          plusTenUntilThirty,
        };
      };

      it(`call without looping`, () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareNoLooping();

        const data: Data = {
          total: 5,
        };

        tapable.call(data);

        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });

      it('callAsync without looping', async () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareNoLooping();

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

      it('promise without looping', async () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareNoLooping();

        const data: Data = {
          total: 5,
        };

        await tapable.promise(data);

        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });
    });

    describe(`${scenario.name} with error`, () => {
      const prepareWithError = () => {
        const tapable = new scenario.hook(['data']);

        const invertSign = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const plusTenUntilThirty = vi.fn((data: Data) => {
          data.total += 10;
          throw new Error('computation error');
        });

        tapable.tap('invertSign', invertSign);
        tapable.tap('plusTenUntilThirty', plusTenUntilThirty);

        return {
          tapable,
          invertSign,
          plusTenUntilThirty,
        };
      };

      it(`call with error`, () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareWithError();

        const data: Data = {
          total: 5,
        };

        expect(() => tapable.call(data)).toThrowError('computation error');

        expect(invertSign).toHaveBeenCalledOnce();
        expect(plusTenUntilThirty).toHaveBeenCalledOnce();
        expect(data.total).toMatchInlineSnapshot('16');
      });

      it(`callAsync with error`, async () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareWithError();

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

      it(`promise with error`, async () => {
        const { tapable, invertSign, plusTenUntilThirty } = prepareWithError();

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
