import { SyncWaterfallHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { SyncWaterfallHook } from './sync-waterfall-hook';

describe('SyncWaterfallHook', () => {
  it('has same name', () => {
    expect(SyncWaterfallHook.name).toBe(ActualHook.name);
    // const hook = new ActualHook()
  });

  const scenarios = [
    { name: 'tapable', hook: ActualHook as any as typeof SyncWaterfallHook },
    { name: 'our', hook: SyncWaterfallHook },
  ];

  describe('call', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name} when each function return value`, () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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

      it(`forward previous value when fn return undefined for ${scenario.name}`, () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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

      it(`throws error when one of the fn throws for ${scenario.name}`, () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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
        tapable.tap('times3', times3 as any);
        tapable.tap('square', square);

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
    });
  });

  describe('callAsync', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name} when each function return value`, async () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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

        let resolve: () => void;
        const promise = new Promise<void>((fulfill) => {
          resolve = fulfill;
        });
        const finalCb = vi.fn(() => resolve());

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

      it(`forward previous value when fn return undefined for ${scenario.name}`, async () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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

        const resultObj: Params[1] = [];
        let resolve: () => void;
        const promise = new Promise<void>((fulfill) => {
          resolve = fulfill;
        });
        const finalCb = vi.fn(() => resolve());

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

      it(`throws error when one of the fn throws for ${scenario.name}`, async () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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
        tapable.tap('times3', times3 as any);
        tapable.tap('square', square);

        const resultObj: Params[1] = [];
        let resolve: () => void;
        const promise = new Promise<void>((fulfill) => {
          resolve = fulfill;
        });
        const finalCb = vi.fn(() => resolve());

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
    });
  });

  describe('promise', () => {
    scenarios.forEach((scenario) => {
      it(`works for ${scenario.name} when each function return value`, async () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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

      it(`forward previous value when fn return undefined for ${scenario.name}`, async () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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

      it(`throws error when one of the fn throws for ${scenario.name}`, async () => {
        type Params = [
          number,
          Array<{
            name: string;
            value: number;
          }>
        ];

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
        tapable.tap('times3', times3 as any);
        tapable.tap('square', square);

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
