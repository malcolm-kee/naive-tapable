import { AsyncSeriesHook as ActualHook } from 'tapable';
import { describe, expect, it, vi } from 'vitest';
import { AsyncSeriesHook, InterceptOptions } from './async-series-hook';
import { createAsyncCallback } from './utils/test-helper';

const scenarios = [
  {
    name: 'tapable',
    hook: ActualHook as any as typeof AsyncSeriesHook,
  },
  {
    name: 'our',
    hook: AsyncSeriesHook,
  },
];

describe('AsyncSeriesHook', () => {
  it('has the same name', () => {
    expect(AsyncSeriesHook.name).toBe(ActualHook.name);
  });

  scenarios.forEach((scenario) => {
    describe(`${scenario.name} run without issue`, () => {
      const prepareNoIssue = () => {
        const tapable = new scenario.hook(['name', 'data']);
        const cb = vi.fn((_: unknown, data: string[]) => {
          data.push('cbCall');
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
        const asyncCb = vi.fn((_: unknown, data: string[], cb: () => void) => {
          setTimeout(() => {
            data.push('asyncCall');
            cb();
          }, 50);
        });

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
        expect(finalCb).toHaveBeenCalledWith();
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

        await tapable.promise('malcolm', data);

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

scenarios.forEach((scenario) => {
  describe(`AsyncSeriesHook interception works for ${scenario.name}`, () => {
    const prepareNoIssue = ({
      call = vi.fn(),
      tap = vi.fn(),
      register = vi.fn((x) => x),
      loop = vi.fn(),
    }: Partial<InterceptOptions> = {}) => {
      const tapable = new scenario.hook(['name', 'data']);

      const interceptor = {
        call,
        tap,
        register,
        loop,
      };

      tapable.intercept(interceptor);

      const cb = vi.fn((_: unknown, data: string[]) => {
        data.push('cbCall');
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
      const asyncCb = vi.fn((_: unknown, data: string[], cb: () => void) => {
        setTimeout(() => {
          data.push('asyncCall');
          cb();
        }, 50);
      });

      tapable.tap('cb', cb);
      tapable.tapPromise('promiseCb', promiseCb);
      tapable.tapAsync('asyncCb', asyncCb);

      return {
        tapable,
        interceptor,
        cb,
        promiseCb,
        asyncCb,
      };
    };

    it('works for intercept call with promise', async () => {
      const { tapable, interceptor, cb, promiseCb, asyncCb } = prepareNoIssue();

      const data: string[] = [];

      await tapable.promise('malcolm', data);

      expect(interceptor.call).toHaveBeenCalledOnce();
      expect(interceptor.call).toHaveBeenCalledWith('malcolm', data);
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
      expect(interceptor.loop).not.toHaveBeenCalled();
    });

    it('works for intercept call with callAsync', async () => {
      const { tapable, interceptor } = prepareNoIssue();

      const data: string[] = [];

      const { cb: finalCb, promise } = createAsyncCallback();

      tapable.callAsync('malcolm', data, finalCb);

      await promise;

      expect(interceptor.call).toHaveBeenCalledOnce();
      expect(interceptor.call).toHaveBeenCalledWith('malcolm', data);
      expect(interceptor.loop).not.toHaveBeenCalled();
    });

    it('works for intercept tap', async () => {
      const { tapable, interceptor } = prepareNoIssue();

      const data: string[] = [];

      await tapable.promise('malcolm', data);

      expect(interceptor.tap).toHaveBeenCalledTimes(3);
      expect(interceptor.loop).not.toHaveBeenCalled();
    });

    it('works for intercept register', async () => {
      const { interceptor } = prepareNoIssue();
      expect(interceptor.register).toHaveBeenCalledTimes(3);
    });

    it('allows interceptor.register to overwrite implementation', async () => {
      const { tapable, interceptor, cb, promiseCb, asyncCb } = prepareNoIssue({
        register(tap) {
          return {
            ...tap,
            ...(tap.name === 'promiseCb'
              ? {
                  fn: () => Promise.reject(new Error('Overwritten error')),
                }
              : {}),
          };
        },
      });

      const data: string[] = [];

      await expect(tapable.promise('malcolm', data)).rejects.toThrow('Overwritten error');

      expect(cb).toHaveBeenCalledOnce();
      expect(promiseCb).not.toHaveBeenCalled();
      expect(asyncCb).not.toHaveBeenCalled();
      expect(interceptor.loop).not.toHaveBeenCalled();
    });
  });
});
