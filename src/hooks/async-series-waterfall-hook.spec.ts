import { AsyncSeriesWaterfallHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { AsyncSeriesWaterfallHook } from './async-series-waterfall-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('AsyncSeriesWaterfallHook', () => {
  it('has same name', () => {
    expect(AsyncSeriesWaterfallHook.name).toBe(ActualHook.name);
  });

  [
    {
      name: 'tapable',
      hook: ActualHook as any as typeof AsyncSeriesWaterfallHook,
    },
    {
      name: 'our',
      hook: AsyncSeriesWaterfallHook,
    },
  ].forEach((scenario) => {
    describe(`${scenario.name} run with always return value`, async () => {
      const prepareNoIssue = () => {
        const tapable = new scenario.hook(['name', 'data']);
        const cb = vi.fn((name: string, data: string[]) => {
          data.push('cbCall');

          return `${name} + cb`;
        });
        const promiseCb = vi.fn(
          (name: string, data: string[]) =>
            new Promise<string>((fulfill) =>
              setTimeout(() => {
                data.push('promiseCall');
                fulfill(`${name} + promise`);
              }, 100)
            )
        );
        const asyncCb = vi.fn(
          (name: string, data: string[], cb: (error: Error | null, result?: string) => void) => {
            setTimeout(() => {
              data.push('asyncCall');
              cb(null, `${name} + async`);
            }, 50);
          }
        );

        tapable.tap('cb', cb);
        tapable.tapPromise('promiseCb', promiseCb);
        tapable.tapAsync('asyncCb', asyncCb);

        return {
          tapable,
          cb,
          promiseCb,
          asyncCb,
        };
      };

      it(`callAsync without issue`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareNoIssue();

        const { cb: finalCb, promise } = createAsyncCallback();

        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 'malcolm + cb + promise + async');
        expect(data).toMatchInlineSnapshot(`
          [
            "cbCall",
            "promiseCall",
            "asyncCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });

      it(`promise without issue`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareNoIssue();

        const data: string[] = [];

        const result = await tapable.promise('malcolm', data);

        expect(result).toBe('malcolm + cb + promise + async');
        expect(data).toMatchInlineSnapshot(`
          [
            "cbCall",
            "promiseCall",
            "asyncCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });
    });

    describe(`${scenario.name} run with skip cb value`, async () => {
      const prepareNoIssue = () => {
        const tapable = new scenario.hook(['name', 'data']);
        const cb = vi.fn((_: string, data: string[]): any => {
          data.push('cbCall');
        });
        const promiseCb = vi.fn(
          (name: string, data: string[]) =>
            new Promise<string>((fulfill) =>
              setTimeout(() => {
                data.push('promiseCall');
                fulfill(`${name} + promise`);
              }, 100)
            )
        );
        const asyncCb = vi.fn(
          (name: string, data: string[], cb: (error: Error | null, result?: string) => void) => {
            setTimeout(() => {
              data.push('asyncCall');
              cb(null, `${name} + async`);
            }, 50);
          }
        );

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

      it(`callAsync with skip cb value`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareNoIssue();

        const { cb: finalCb, promise } = createAsyncCallback();

        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 'malcolm + promise + async');
        expect(data).toMatchInlineSnapshot(`
          [
            "promiseCall",
            "cbCall",
            "asyncCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });

      it(`promise with skip cb value`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareNoIssue();

        const data: string[] = [];

        const result = await tapable.promise('malcolm', data);

        expect(result).toBe('malcolm + promise + async');
        expect(data).toMatchInlineSnapshot(`
          [
            "promiseCall",
            "cbCall",
            "asyncCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });
    });

    describe(`${scenario.name} run with skip promise value`, async () => {
      const prepareSkipPromise = () => {
        const tapable = new scenario.hook(['name', 'data']);
        const cb = vi.fn((name: string, data: string[]) => {
          data.push('cbCall');

          return `${name} + cb`;
        });
        const promiseCb = vi.fn(
          (name: string, data: string[]) =>
            new Promise<void>((fulfill) =>
              setTimeout(() => {
                data.push('promiseCall');
                fulfill();
              }, 100)
            ) as Promise<any>
        );
        const asyncCb = vi.fn(
          (name: string, data: string[], cb: (error: Error | null, result?: string) => void) => {
            setTimeout(() => {
              data.push('asyncCall');
              cb(null, `${name} + async`);
            }, 50);
          }
        );

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

      it(`callAsync with skip promise value`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareSkipPromise();

        const { cb: finalCb, promise } = createAsyncCallback();

        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 'malcolm + async + cb');
        expect(data).toMatchInlineSnapshot(`
          [
            "asyncCall",
            "promiseCall",
            "cbCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });

      it(`promise with skip promise value`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareSkipPromise();

        const data: string[] = [];

        const result = await tapable.promise('malcolm', data);

        expect(result).toBe('malcolm + async + cb');
        expect(data).toMatchInlineSnapshot(`
          [
            "asyncCall",
            "promiseCall",
            "cbCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });
    });

    describe(`${scenario.name} run with skip async value`, async () => {
      const prepareSkipAsync = () => {
        const tapable = new scenario.hook(['name', 'data']);
        const cb = vi.fn((name: string, data: string[]) => {
          data.push('cbCall');

          return `${name} + cb`;
        });
        const promiseCb = vi.fn(
          (name: string, data: string[]) =>
            new Promise<string>((fulfill) =>
              setTimeout(() => {
                data.push('promiseCall');
                fulfill(`${name} + promise`);
              }, 100)
            )
        );
        const asyncCb = vi.fn((name: string, data: string[], cb: (err: null) => void) => {
          setTimeout(() => {
            data.push('asyncCall');
            cb(null);
          }, 50);
        });

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

      it(`callAsync with skip async value`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareSkipAsync();

        const { cb: finalCb, promise } = createAsyncCallback();

        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 'malcolm + cb + promise');
        expect(data).toMatchInlineSnapshot(`
          [
            "cbCall",
            "asyncCall",
            "promiseCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });

      it(`promise with skip async value`, async () => {
        const { tapable, cb, promiseCb, asyncCb } = prepareSkipAsync();

        const data: string[] = [];

        const result = await tapable.promise('malcolm', data);

        expect(result).toBe('malcolm + cb + promise');
        expect(data).toMatchInlineSnapshot(`
          [
            "cbCall",
            "asyncCall",
            "promiseCall",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });
    });

    describe(`${scenario.name} run with cb issue`, () => {
      const prepareCallbackIssue = () => {
        const tapable = new scenario.hook(['name', 'data']);
        const promiseCb = vi.fn(
          (name: string, data: string[]) =>
            new Promise<string>((fulfill) =>
              setTimeout(() => {
                data.push('promiseCall');
                fulfill(`${name} + promise`);
              }, 100)
            )
        );
        const cb = vi.fn((_: unknown, data: string[]) => {
          data.push('cbCall');
          throw new Error('cb error');
        });
        const asyncCb = vi.fn(
          (name: string, data: string[], cb: (error: null, result: string) => void) => {
            setTimeout(() => {
              data.push('asyncCall');
              cb(null, `${name} + async`);
            }, 50);
          }
        );

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
        const asyncCb = vi.fn(
          (name: string, data: string[], cb: (err: null, result: string) => void) => {
            setTimeout(() => {
              data.push('asyncCall');
              cb(null, `${name} + async`);
            }, 50);
          }
        );
        const promiseCb = vi.fn(
          (_: unknown, data: string[]) =>
            new Promise<string>((_, reject) =>
              setTimeout(() => {
                data.push('promiseCall');
                reject(new Error('promise error'));
              }, 100)
            )
        );
        const cb = vi.fn((name: string, data: string[]) => {
          data.push('cbCall');
          return `${name} + cb`;
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

        const cb = vi.fn((name: string, data: string[]) => {
          data.push('cbCall');
          return `${name} + cb`;
        });
        const asyncCb = vi.fn((_: unknown, data: string[], cb: (error: Error) => void) => {
          setTimeout(() => {
            data.push('asyncCall');
            cb(new Error('async error'));
          }, 50);
        });
        const promiseCb = vi.fn(
          (name: string, data: string[]) =>
            new Promise<string>((fulfill) =>
              setTimeout(() => {
                data.push('promiseCall');
                fulfill(`${name} + promise`);
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
