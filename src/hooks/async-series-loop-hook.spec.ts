import { AsyncSeriesLoopHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { AsyncSeriesLoopHook } from './async-series-loop-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('AsyncSeriesLoopHook', () => {
  it('has the same name', () => {
    expect(AsyncSeriesLoopHook.name).toBe(ActualHook.name);
  });

  [
    {
      name: 'tapable',
      hook: ActualHook as any as typeof AsyncSeriesLoopHook,
    },
    {
      name: 'our',
      hook: AsyncSeriesLoopHook,
    },
  ].forEach((scenario) => {
    interface Data {
      total: number;
    }

    describe(`${scenario.name} without looping`, () => {
      const prepareNoLooping = () => {
        const tapable = new scenario.hook(['data'], 'myHook');

        const addOneCb = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const timesThreePromise = vi.fn(
          (data: Data) =>
            new Promise<void>((fulfill) => {
              setTimeout(() => {
                data.total = data.total * 3;
                fulfill();
              }, 100);
            })
        );

        const asyncSquareCb = vi.fn((data: Data, cb: () => void) => {
          setTimeout(() => {
            data.total = Math.pow(data.total, 2);
            cb();
          }, 50);
        });

        tapable.tap('increment', addOneCb);
        tapable.tapPromise('times', timesThreePromise);
        tapable.tapAsync('square', asyncSquareCb);

        return {
          tapable,
          addOneCb,
          timesThreePromise,
          asyncSquareCb,
        };
      };

      it(`callAsync without looping`, async () => {
        const { tapable, addOneCb, timesThreePromise, asyncSquareCb } = prepareNoLooping();
        const { cb: finalCb, promise } = createAsyncCallback();

        const data: Data = {
          total: 100,
        };

        tapable.callAsync(data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith();
        expect(data.total).toBe(Math.pow((100 + 1) * 3, 2));
        expect(addOneCb).toHaveBeenCalledOnce();
        expect(timesThreePromise).toHaveBeenCalledOnce();
        expect(asyncSquareCb).toHaveBeenCalledOnce();
      });

      it(`promise without looping`, async () => {
        const { tapable, addOneCb, timesThreePromise, asyncSquareCb } = prepareNoLooping();

        const data: Data = {
          total: 100,
        };

        const result = await tapable.promise(data);

        expect(result).toBeUndefined();
        expect(data.total).toBe(Math.pow((100 + 1) * 3, 2));
        expect(addOneCb).toHaveBeenCalledOnce();
        expect(timesThreePromise).toHaveBeenCalledOnce();
        expect(asyncSquareCb).toHaveBeenCalledOnce();
      });
    });

    describe(`${scenario.name} with looping by cb`, () => {
      const prepareNoLooping = () => {
        const tapable = new scenario.hook(['data'], 'myHook');

        const addOneCb = vi.fn((data: Data) => {
          data.total = data.total + 1;

          if (data.total < 1000) {
            return data;
          }
        });

        const timesThreePromise = vi.fn(
          (data: Data) =>
            new Promise<void>((fulfill) => {
              setTimeout(() => {
                data.total = data.total * 3;
                fulfill();
              }, 100);
            })
        );

        const asyncSquareCb = vi.fn((data: Data, cb: () => void) => {
          setTimeout(() => {
            data.total = Math.pow(data.total, 2);
            cb();
          }, 50);
        });

        tapable.tapPromise('times', timesThreePromise);
        tapable.tapAsync('square', asyncSquareCb);
        tapable.tap('increment', addOneCb);

        return {
          tapable,
          addOneCb,
          timesThreePromise,
          asyncSquareCb,
        };
      };

      const expectedResult = (function getExpectedResult() {
        let total = 10;

        while (total < 1000) {
          total *= 3;
          total = Math.pow(total, 2);
          total += 1;
        }

        return total;
      })();

      it(`callAsync with looping by cb`, async () => {
        const { tapable, addOneCb, timesThreePromise, asyncSquareCb } = prepareNoLooping();
        const { cb: finalCb, promise } = createAsyncCallback();

        const data: Data = {
          total: 10,
        };

        tapable.callAsync(data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith();
        expect(data.total).toBe(expectedResult);
        expect(addOneCb).toHaveBeenCalledTimes(2);
        expect(timesThreePromise).toHaveBeenCalledTimes(2);
        expect(asyncSquareCb).toHaveBeenCalledTimes(2);
      });

      it(`promise with looping by cb`, async () => {
        const { tapable, addOneCb, timesThreePromise, asyncSquareCb } = prepareNoLooping();

        const data: Data = {
          total: 10,
        };

        const result = await tapable.promise(data);

        expect(result).toBeUndefined();
        expect(data.total).toBe(expectedResult);
        expect(addOneCb).toHaveBeenCalledTimes(2);
        expect(timesThreePromise).toHaveBeenCalledTimes(2);
        expect(asyncSquareCb).toHaveBeenCalledTimes(2);
      });
    });

    describe(`${scenario.name} with looping by promise`, () => {
      const prepareNoLooping = () => {
        const tapable = new scenario.hook(['data'], 'myHook');

        const addOneCb = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const timesThreePromise = vi.fn(
          (data: Data) =>
            new Promise<any>((fulfill) => {
              setTimeout(() => {
                data.total = data.total * 3;
                fulfill(data.total > 1000 ? undefined : data);
              }, 100);
            })
        );

        const asyncSquareCb = vi.fn((data: Data, cb: () => void) => {
          setTimeout(() => {
            data.total = Math.pow(data.total, 2);
            cb();
          }, 50);
        });

        tapable.tapAsync('square', asyncSquareCb);
        tapable.tap('increment', addOneCb);
        tapable.tapPromise('times', timesThreePromise);

        return {
          tapable,
          addOneCb,
          timesThreePromise,
          asyncSquareCb,
        };
      };

      const expectedResult = (function getExpectedResult() {
        let total = 10;

        while (total < 1000) {
          total = Math.pow(total, 2);
          total += 1;
          total *= 3;
        }

        return total;
      })();

      it(`callAsync with looping by promise`, async () => {
        const { tapable, addOneCb, timesThreePromise, asyncSquareCb } = prepareNoLooping();
        const { cb: finalCb, promise } = createAsyncCallback();

        const data: Data = {
          total: 10,
        };

        tapable.callAsync(data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith();
        expect(data.total).toBe(expectedResult);
        expect(addOneCb).toHaveBeenCalledTimes(2);
        expect(timesThreePromise).toHaveBeenCalledTimes(2);
        expect(asyncSquareCb).toHaveBeenCalledTimes(2);
      });

      it(`promise with looping by promise`, async () => {
        const { tapable, addOneCb, timesThreePromise, asyncSquareCb } = prepareNoLooping();

        const data: Data = {
          total: 10,
        };

        const result = await tapable.promise(data);

        expect(result).toBeUndefined();
        expect(data.total).toBe(expectedResult);
        expect(addOneCb).toHaveBeenCalledTimes(2);
        expect(timesThreePromise).toHaveBeenCalledTimes(2);
        expect(asyncSquareCb).toHaveBeenCalledTimes(2);
      });
    });

    describe(`${scenario.name} with looping by async`, () => {
      const prepareNoLooping = () => {
        const tapable = new scenario.hook(['data'], 'myHook');

        const addOneCb = vi.fn((data: Data) => {
          data.total = data.total + 1;
        });

        const timesThreePromise = vi.fn(
          (data: Data) =>
            new Promise<void>((fulfill) => {
              setTimeout(() => {
                data.total = data.total * 3;
                fulfill();
              }, 100);
            })
        );

        const asyncSquareCb = vi.fn(
          (data: Data, cb: (error?: Error | null, result?: any) => void) => {
            setTimeout(() => {
              data.total = Math.pow(data.total, 2);
              if (data.total < 1000) {
                cb(null, data);
              } else {
                cb();
              }
            }, 50);
          }
        );

        tapable.tapPromise('times', timesThreePromise);
        tapable.tap('increment', addOneCb);
        tapable.tapAsync('square', asyncSquareCb);

        return {
          tapable,
          addOneCb,
          timesThreePromise,
          asyncSquareCb,
        };
      };

      const expectedResult = (function getExpectedResult() {
        let total = 10;

        while (total < 1000) {
          total *= 3;
          total += 1;
          total = Math.pow(total, 2);
        }

        return total;
      })();

      it(`callAsync with looping by cb`, async () => {
        const { tapable, addOneCb, timesThreePromise, asyncSquareCb } = prepareNoLooping();
        const { cb: finalCb, promise } = createAsyncCallback();

        const data: Data = {
          total: 10,
        };

        tapable.callAsync(data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith();
        expect(data.total).toBe(expectedResult);
        expect(addOneCb).toHaveBeenCalledTimes(2);
        expect(timesThreePromise).toHaveBeenCalledTimes(2);
        expect(asyncSquareCb).toHaveBeenCalledTimes(2);
      });

      it(`promise with looping by cb`, async () => {
        const { tapable, addOneCb, timesThreePromise, asyncSquareCb } = prepareNoLooping();

        const data: Data = {
          total: 10,
        };

        const result = await tapable.promise(data);

        expect(result).toBeUndefined();
        expect(data.total).toBe(expectedResult);
        expect(addOneCb).toHaveBeenCalledTimes(2);
        expect(timesThreePromise).toHaveBeenCalledTimes(2);
        expect(asyncSquareCb).toHaveBeenCalledTimes(2);
      });
    });

    describe(`${scenario.name} run with cb issue`, () => {
      const prepareCallbackIssue = () => {
        const tapable = new scenario.hook(['name', 'data']);
        const promiseCb = vi.fn(
          (_: unknown, data: string[]) =>
            new Promise<void>((fulfill) =>
              setTimeout(() => {
                data.push('promiseCall');
                fulfill();
              }, 100)
            )
        );
        const cb = vi.fn((_: unknown, data: string[]) => {
          data.push('cbCall');
          throw new Error('cb error');
        });
        const asyncCb = vi.fn((_: unknown, data: string[], cb: () => void) => {
          setTimeout(() => {
            data.push('asyncCall');
            cb();
          }, 50);
        });

        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tap('cb', cb);
        tapable.tapAsync('asyncCb', asyncCb);

        return {
          tapable,
          cb,
          promiseCb,
          asyncCb,
        };
      };

      it(`callAsync with cb issue`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareCallbackIssue();

        const { cb: finalCb, promise } = createAsyncCallback();

        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(data).toMatchInlineSnapshot(`
          [
            "promiseCall",
            "cbCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).not.toHaveBeenCalled();
      });

      it(`promise with cb issue`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareCallbackIssue();

        const data: string[] = [];

        await expect(tapable.promise('malcolm', data)).rejects.toThrowError('cb error');

        expect(data).toMatchInlineSnapshot(`
          [
            "promiseCall",
            "cbCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).not.toHaveBeenCalled();
      });
    });

    describe(`${scenario.name} run with promise issue`, () => {
      const preparePromiseIssue = () => {
        const tapable = new scenario.hook(['name', 'data']);
        const asyncCb = vi.fn((_: unknown, data: string[], cb: () => void) => {
          setTimeout(() => {
            data.push('asyncCall');
            cb();
          }, 50);
        });
        const promiseCb = vi.fn(
          (_: unknown, data: string[]) =>
            new Promise<void>((_, reject) =>
              setTimeout(() => {
                data.push('promiseCall');
                reject(new Error('promise error'));
              }, 100)
            )
        );
        const cb = vi.fn((_: unknown, data: string[]) => {
          data.push('cbCall');
        });

        tapable.tapAsync('asyncCb', asyncCb);
        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tap('cb', cb);

        return {
          tapable,
          cb,
          promiseCb,
          asyncCb,
        };
      };

      it(`callAsync with promise issue`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = preparePromiseIssue();

        const { cb: finalCb, promise } = createAsyncCallback();

        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(data).toMatchInlineSnapshot(`
          [
            "asyncCall",
            "promiseCall",
          ]
        `);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(cb).not.toHaveBeenCalled();
      });

      it(`promise with promise issue`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = preparePromiseIssue();

        const data: string[] = [];

        await expect(tapable.promise('malcolm', data)).rejects.toThrowError('promise error');

        expect(data).toMatchInlineSnapshot(`
          [
            "asyncCall",
            "promiseCall",
          ]
        `);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(cb).not.toHaveBeenCalled();
      });
    });

    describe(`${scenario.name} run with async issue`, () => {
      const prepareAsyncIssue = () => {
        const tapable = new scenario.hook(['name', 'data']);

        const cb = vi.fn((_: unknown, data: string[]) => {
          data.push('cbCall');
        });
        const asyncCb = vi.fn((_: unknown, data: string[], cb: (error: Error) => void) => {
          setTimeout(() => {
            data.push('asyncCall');
            cb(new Error('async error'));
          }, 50);
        });
        const promiseCb = vi.fn(
          (_: unknown, data: string[]) =>
            new Promise<void>((fulfill) =>
              setTimeout(() => {
                data.push('promiseCall');
                fulfill();
              }, 100)
            )
        );

        tapable.tap('cb', cb);
        tapable.tapAsync('asyncCb', asyncCb);
        tapable.tapPromise('promiseCb', promiseCb);

        return {
          tapable,
          cb,
          promiseCb,
          asyncCb,
        };
      };

      it(`callAsync with async issue`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareAsyncIssue();

        const { cb: finalCb, promise } = createAsyncCallback();

        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb.mock.calls[0]).toStrictEqual([expect.any(Error)]);
        expect(data).toMatchInlineSnapshot(`
          [
            "cbCall",
            "asyncCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(promiseCb).not.toHaveBeenCalled();
      });

      it(`promise with async issue`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareAsyncIssue();

        const data: string[] = [];

        await expect(tapable.promise('malcolm', data)).rejects.toThrowError('async error');

        expect(data).toMatchInlineSnapshot(`
          [
            "cbCall",
            "asyncCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(promiseCb).not.toHaveBeenCalled();
      });
    });
  });
});
