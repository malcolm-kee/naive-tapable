import { SyncWaterfallHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { SyncWaterfallHook } from './sync-waterfall-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('SyncWaterfallHook', () => {
  it('has same name', () => {
    expect(SyncWaterfallHook.name).toBe(ActualHook.name);
  });

  const scenarios = [
    { name: 'tapable', hook: ActualHook as any as typeof SyncWaterfallHook },
    { name: 'our', hook: SyncWaterfallHook },
  ];

  scenarios.forEach((scenario) => {
    type Params = [
      number,
      Array<{
        name: string;
        value: number;
      }>
    ];

    describe(`works for ${scenario.name} with all functions return value`, () => {
      const prepareAllReturn = () => {
        const tapable = new scenario.hook(['value', 'result'], 'myHook');

        const minus10 = vi.fn((...params: Params) => {
          const value = params[0] - 10;

          params[1].push({
            name: 'minus10',
            value,
          });

          return value;
        });
        const times3 = vi.fn((...params: Params) => {
          const value = params[0] * 3;

          params[1].push({
            name: 'times3',
            value,
          });

          return value;
        });
        const square = vi.fn((...params: Params) => {
          const value = Math.pow(params[0], 2);

          params[1].push({
            name: 'square',
            value,
          });

          return value;
        });

        tapable.tap('minus10', minus10);
        tapable.tap('times3', times3);
        tapable.tap('square', square);

        return {
          tapable,
          minus10,
          times3,
          square,
        };
      };

      it('call with all functions return value', () => {
        const { tapable, minus10, times3, square } = prepareAllReturn();

        const resultObj: Params[1] = [];

        const result = tapable.call(12, resultObj);

        expect(result).toBe(Math.pow((12 - 10) * 3, 2));
        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
            {
              "name": "square",
              "value": 36,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).toHaveBeenCalledOnce();
      });

      it('callAsync with all functions return value', async () => {
        const { tapable, minus10, times3, square } = prepareAllReturn();
        const { cb: finalCb, promise } = createAsyncCallback();

        const resultObj: Params[1] = [];

        tapable.callAsync(12, resultObj, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenLastCalledWith(null, Math.pow((12 - 10) * 3, 2));
        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
            {
              "name": "square",
              "value": 36,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).toHaveBeenCalledOnce();
      });

      it(`promise with all functions return value`, async () => {
        const { tapable, minus10, times3, square } = prepareAllReturn();

        const resultObj: Params[1] = [];

        const result = await tapable.promise(12, resultObj);

        expect(result).toBe(Math.pow((12 - 10) * 3, 2));
        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
            {
              "name": "square",
              "value": 36,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).toHaveBeenCalledOnce();
      });
    });

    describe(`works for ${scenario.name} to forward previous value when undefined is returned`, () => {
      const prepareForwardPrevValue = () => {
        const tapable = new scenario.hook(['value', 'result'], 'myHook');

        const minus10 = vi.fn((...params: Params) => {
          const value = params[0] - 10;

          params[1].push({
            name: 'minus10',
            value,
          });

          return value;
        });
        const times3 = vi.fn((...params: Params) => {
          const value = params[0] * 3;

          params[1].push({
            name: 'times3',
            value,
          });
        });
        const square = vi.fn((...params: Params) => {
          const value = Math.pow(params[0], 2);

          params[1].push({
            name: 'square',
            value,
          });

          return value;
        });

        tapable.tap('minus10', minus10);
        tapable.tap('times3', times3 as any);
        tapable.tap('square', square);

        return {
          tapable,
          minus10,
          times3,
          square,
        };
      };

      it(`call with forward previous value`, () => {
        const { tapable, minus10, times3, square } = prepareForwardPrevValue();

        const resultObj: Params[1] = [];

        const result = tapable.call(12, resultObj);

        expect(result).toBe(Math.pow(12 - 10, 2));
        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
            {
              "name": "square",
              "value": 4,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).toHaveBeenCalledOnce();
      });

      it('callAsync with forward previous value', async () => {
        const { tapable, minus10, times3, square } = prepareForwardPrevValue();

        const resultObj: Params[1] = [];
        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync(12, resultObj, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, Math.pow(12 - 10, 2));

        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
            {
              "name": "square",
              "value": 4,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).toHaveBeenCalledOnce();
      });

      it('promise with forward previous value', async () => {
        const { tapable, minus10, times3, square } = prepareForwardPrevValue();

        const resultObj: Params[1] = [];

        const result = await tapable.promise(12, resultObj);

        expect(result).toBe(Math.pow(12 - 10, 2));
        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
            {
              "name": "square",
              "value": 4,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).toHaveBeenCalledOnce();
      });
    });

    describe(`works for ${scenario.name} with error`, () => {
      const prepareWithError = () => {
        const tapable = new scenario.hook(['value', 'result'], 'myHook');

        const minus10 = vi.fn((...params: Params) => {
          const value = params[0] - 10;

          params[1].push({
            name: 'minus10',
            value,
          });

          return value;
        });
        const times3 = vi.fn((...params: Params) => {
          const value = params[0] * 3;

          params[1].push({
            name: 'times3',
            value,
          });

          throw new Error(`timing error`);
        });
        const square = vi.fn((...params: Params) => {
          const value = Math.pow(params[0], 2);

          params[1].push({
            name: 'square',
            value,
          });

          return value;
        });

        tapable.tap('minus10', minus10);
        tapable.tap('times3', times3);
        tapable.tap('square', square);

        return {
          tapable,
          minus10,
          times3,
          square,
        };
      };

      it('call with error', () => {
        const { tapable, minus10, times3, square } = prepareWithError();

        const resultObj: Params[1] = [];

        expect(() => tapable.call(12, resultObj)).toThrowError('timing error');

        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).not.toHaveBeenCalled();
      });

      it('callAsync with error', async () => {
        const { tapable, minus10, times3, square } = prepareWithError();

        const resultObj: Params[1] = [];
        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync(12, resultObj, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);

        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).not.toHaveBeenCalled();
      });

      it('promise with error', async () => {
        const { tapable, minus10, times3, square } = prepareWithError();

        const resultObj: Params[1] = [];

        await expect(tapable.promise(12, resultObj)).rejects.toThrowError('timing error');

        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times3",
              "value": 6,
            },
          ]
        `);

        expect(minus10).toHaveBeenCalledOnce();
        expect(times3).toHaveBeenCalledOnce();
        expect(square).not.toHaveBeenCalled();
      });
    });
  });
});
