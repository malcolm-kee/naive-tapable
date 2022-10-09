import { AsyncSeriesBailHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { AsyncSeriesBailHook } from './async-series-bail-hook';
import { createAsyncCallback } from './utils/test-helper';

describe('AsyncSeriesBailHook', () => {
  it('has same name', () => {
    expect(AsyncSeriesBailHook.name).toBe(ActualHook.name);
  });

  [
    {
      name: 'tapable',
      hook: ActualHook as any as typeof AsyncSeriesBailHook,
    },
    {
      name: 'our',
      hook: AsyncSeriesBailHook,
    },
  ].forEach((scenario) => {
    describe(`${scenario.name} run without bail`, () => {
      const prepareWithoutBail = () => {
        const tapable = new scenario.hook(['name', 'data'], 'myHook');

        const cb = vi.fn((_: unknown, data: Array<string>) => {
          data.push('cb');
        });
        const promiseCb = vi.fn(
          (_: unknown, data: Array<string>) =>
            new Promise<void>((fulfill) =>
              setTimeout(() => {
                data.push('promise');
                fulfill();
              }, 100)
            )
        );
        const asyncCb = vi.fn((_: unknown, data: Array<string>, cb: () => void) =>
          setTimeout(() => {
            data.push('async');
            cb();
          }, 50)
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

      it('callAsync without bail', async () => {
        const { tapable, cb, asyncCb, promiseCb } = prepareWithoutBail();
        const { cb: finalCb, promise } = createAsyncCallback();
        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith();
        expect(data).toMatchInlineSnapshot(`
          [
            "cb",
            "promise",
            "async",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });

      it('promise without bail', async () => {
        const { tapable, cb, asyncCb, promiseCb } = prepareWithoutBail();
        const data: string[] = [];

        const result = await tapable.promise('malcolm', data);

        expect(result).toBeUndefined();
        expect(data).toMatchInlineSnapshot(`
          [
            "cb",
            "promise",
            "async",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).toHaveBeenCalledOnce();
      });
    });

    describe(`${scenario.name} run with bail from cb`, () => {
      const prepareWithBailFromCb = () => {
        const tapable = new scenario.hook(['name', 'data']);

        const promiseCb = vi.fn(
          (_: unknown, data: Array<string>) =>
            new Promise<void>((fulfill) =>
              setTimeout(() => {
                data.push('promise');
                fulfill();
              }, 100)
            )
        );
        const cb = vi.fn((_: unknown, data: Array<string>) => {
          data.push('cb');
          return 'return from cb';
        });
        const asyncCb = vi.fn((_: unknown, data: Array<string>, cb: () => void) =>
          setTimeout(() => {
            data.push('async');
            cb();
          }, 50)
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

      it('callAsync with bail from cb', async () => {
        const { tapable, cb, asyncCb, promiseCb } = prepareWithBailFromCb();
        const { cb: finalCb, promise } = createAsyncCallback();
        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 'return from cb');
        expect(data).toMatchInlineSnapshot(`
          [
            "promise",
            "cb",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).not.toHaveBeenCalled();
      });

      it('promise with bail from cb', async () => {
        const { tapable, cb, asyncCb, promiseCb } = prepareWithBailFromCb();
        const data: string[] = [];

        const result = await tapable.promise('malcolm', data);

        expect(result).toBe('return from cb');
        expect(data).toMatchInlineSnapshot(`
          [
            "promise",
            "cb",
          ]
        `);
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(asyncCb).not.toHaveBeenCalled();
      });
    });

    describe(`${scenario.name} run with bail from promise`, () => {
      const prepareWithBailFromCb = () => {
        const tapable = new scenario.hook(['name', 'data']);

        const asyncCb = vi.fn((_: unknown, data: Array<string>, cb: () => void) =>
          setTimeout(() => {
            data.push('async');
            cb();
          }, 50)
        );
        const promiseCb = vi.fn(
          (_: unknown, data: Array<string>) =>
            new Promise<string>((fulfill) =>
              setTimeout(() => {
                data.push('promise');
                fulfill('fulfill from promise');
              }, 100)
            )
        );
        const cb = vi.fn((_: unknown, data: Array<string>) => {
          data.push('cb');
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

      it('callAsync with bail from promise', async () => {
        const { tapable, cb, asyncCb, promiseCb } = prepareWithBailFromCb();
        const { cb: finalCb, promise } = createAsyncCallback();
        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 'fulfill from promise');
        expect(data).toMatchInlineSnapshot(`
          [
            "async",
            "promise",
          ]
        `);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(cb).not.toHaveBeenCalled();
      });

      it('promise with bail from promise', async () => {
        const { tapable, cb, asyncCb, promiseCb } = prepareWithBailFromCb();
        const data: string[] = [];

        const result = await tapable.promise('malcolm', data);

        expect(result).toBe('fulfill from promise');
        expect(data).toMatchInlineSnapshot(`
          [
            "async",
            "promise",
          ]
        `);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(promiseCb).toHaveBeenCalledOnce();
        expect(cb).not.toHaveBeenCalled();
      });
    });

    describe(`${scenario.name} run with bail from async`, () => {
      const prepareWithBailFromCb = () => {
        const tapable = new scenario.hook(['name', 'data']);

        const cb = vi.fn((_: unknown, data: Array<string>) => {
          data.push('cb');
        });
        const asyncCb = vi.fn(
          (_: unknown, data: Array<string>, cb: (error: null, value: string) => void) =>
            setTimeout(() => {
              data.push('async');
              cb(null, 'value from async');
            }, 50)
        );
        const promiseCb = vi.fn(
          (_: unknown, data: Array<string>) =>
            new Promise<void>((fulfill) =>
              setTimeout(() => {
                data.push('promise');
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

      it('callAsync with bail from async', async () => {
        const { tapable, cb, asyncCb, promiseCb } = prepareWithBailFromCb();
        const { cb: finalCb, promise } = createAsyncCallback();
        const data: string[] = [];

        tapable.callAsync('malcolm', data, finalCb);

        await promise;

        expect(finalCb).toHaveBeenCalledOnce();
        expect(finalCb).toHaveBeenCalledWith(null, 'value from async');
        expect(data).toMatchInlineSnapshot(`
          [
            "cb",
            "async",
          ]
        `);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).not.toHaveBeenCalled();
      });

      it('promise with bail from async', async () => {
        const { tapable, cb, asyncCb, promiseCb } = prepareWithBailFromCb();
        const data: string[] = [];

        const result = await tapable.promise('malcolm', data);

        expect(result).toBe('value from async');
        expect(data).toMatchInlineSnapshot(`
          [
            "cb",
            "async",
          ]
        `);
        expect(asyncCb).toHaveBeenCalledOnce();
        expect(cb).toHaveBeenCalledOnce();
        expect(promiseCb).not.toHaveBeenCalled();
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
