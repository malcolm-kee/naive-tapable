import { SyncWaterfallHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { InterceptOptions, SyncWaterfallHook } from './sync-waterfall-hook';
import { createAsyncCallback } from './utils/test-helper';

const scenarios = [
  { name: 'tapable', hook: ActualHook as any as typeof SyncWaterfallHook },
  { name: 'our', hook: SyncWaterfallHook },
];

describe('SyncWaterfallHook', () => {
  it('has same name', () => {
    expect(SyncWaterfallHook.name).toBe(ActualHook.name);
  });

  scenarios.forEach((scenario) => {
    type Result = Array<{
      name: string;
      value: number;
    }>;
    type Params = [number, Result];

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

        const resultObj: Result = [];

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

        const resultObj: Result = [];

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

        const resultObj: Result = [];

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

describe('SyncWaterfallHook intercept', () => {
  type Result = Array<{
    name: string;
    value: number;
  }>;
  type Params = [number, Result];

  scenarios.forEach((scenario) => {
    describe(`interception works for ${scenario.name}`, () => {
      const prepareAllReturn = ({
        call = vi.fn(),
        tap = vi.fn(),
        register = vi.fn((x) => x),
        loop = vi.fn(),
      }: Partial<InterceptOptions> = {}) => {
        const tapable = new scenario.hook(['value', 'result'], 'myHook');

        const interceptor = {
          call,
          tap,
          register,
          loop,
        };

        tapable.intercept(interceptor);

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
          interceptor,
          minus10,
          times3,
          square,
        };
      };

      it('works for intercept call', () => {
        const { tapable, interceptor } = prepareAllReturn();

        const resultObj: Result = [];

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

        expect(interceptor.call).toHaveBeenCalledOnce();
        expect(interceptor.call).toHaveBeenCalledWith(12, resultObj);
        expect(interceptor.loop).not.toHaveBeenCalled();
      });

      it('works for intercept all with callAsync', async () => {
        const { tapable, interceptor } = prepareAllReturn();

        const resultObj: Result = [];

        const { cb: finalCb, promise } = createAsyncCallback();

        tapable.callAsync(12, resultObj, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledWith(null, Math.pow((12 - 10) * 3, 2));

        expect(interceptor.call).toHaveBeenCalledOnce();
        expect(interceptor.call).toHaveBeenCalledWith(12, resultObj);
        expect(interceptor.loop).not.toHaveBeenCalled();
      });

      it('works for intercept all with promise', async () => {
        const { tapable, interceptor } = prepareAllReturn();

        const resultObj: Result = [];

        const result = await tapable.promise(12, resultObj);

        expect(result).toBe(Math.pow((12 - 10) * 3, 2));

        expect(interceptor.call).toHaveBeenCalledOnce();
        expect(interceptor.call).toHaveBeenCalledWith(12, resultObj);
        expect(interceptor.loop).not.toHaveBeenCalled();
      });

      it('works for intercept tap', () => {
        const { tapable, interceptor, minus10, times3, square } = prepareAllReturn();

        const resultObj: Result = [];

        tapable.call(12, resultObj);

        expect(interceptor.tap).toHaveBeenCalledTimes(3);
        expect(interceptor.tap).toHaveBeenNthCalledWith(1, {
          type: 'sync',
          name: 'minus10',
          fn: minus10,
        });
        expect(interceptor.tap).toHaveBeenNthCalledWith(2, {
          type: 'sync',
          name: 'times3',
          fn: times3,
        });
        expect(interceptor.tap).toHaveBeenNthCalledWith(3, {
          type: 'sync',
          name: 'square',
          fn: square,
        });
      });

      it('works for intercept register', () => {
        const { interceptor } = prepareAllReturn();

        expect(interceptor.register).toHaveBeenCalledTimes(3);
        expect(interceptor.call).not.toHaveBeenCalled();
        expect(interceptor.tap).not.toHaveBeenCalled();
        expect(interceptor.loop).not.toHaveBeenCalled();
      });

      it('allows interceptor.register to overwrite implementation', () => {
        const { tapable } = prepareAllReturn({
          register(tap) {
            return {
              ...tap,
              fn:
                tap.name === 'times3'
                  ? (...params: Params) => {
                      const value = params[0] * 10;

                      params[1].push({
                        name: 'times10',
                        value,
                      });

                      return value;
                    }
                  : tap.fn,
            };
          },
        });

        const resultObj: Result = [];

        const result = tapable.call(12, resultObj);

        expect(result).toBe(Math.pow((12 - 10) * 10, 2));
        expect(resultObj).toMatchInlineSnapshot(`
          [
            {
              "name": "minus10",
              "value": 2,
            },
            {
              "name": "times10",
              "value": 20,
            },
            {
              "name": "square",
              "value": 400,
            },
          ]
        `);
      });
    });
  });
});
