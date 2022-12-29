export type Tap = {
  name: string;
  fn: Function;
  type: 'sync' | 'async' | 'promise';
};

export interface InterceptOptions {
  call: (...args: any[]) => void;
  tap: (...args: any[]) => void;
  register: (tap: Tap) => Tap;
  loop: (...args: any[]) => void;
}

export class AsyncParallelBailHook {
  readonly #taps: Array<Tap> = [];
  readonly #interceptors: Array<Partial<InterceptOptions>> = [];

  constructor(private readonly params: string[], public readonly name?: string) {}

  tap(pluginName: string, fn: Function) {
    this.#addTap('sync', pluginName, fn);
  }

  tapPromise(pluginName: string, fn: Function) {
    this.#addTap('promise', pluginName, fn);
  }

  tapAsync(pluginName: string, fn: Function) {
    this.#addTap('async', pluginName, fn);
  }

  #addTap(type: 'sync' | 'promise' | 'async', name: string, fn: Function) {
    let tap: Tap = {
      name,
      type,
      fn,
    };

    for (const interceptor of this.#interceptors) {
      if (interceptor.register) {
        tap = interceptor.register(tap);
      }
    }

    this.#taps.push(tap);
  }

  callAsync(...params: any[]): void {
    const finalCb = params.pop();

    for (const interceptor of this.#interceptors) {
      if (interceptor.call) {
        interceptor.call(...params);
      }
    }

    let index = 0;

    const end = (error: null | Error, result?: any) => {
      if (index < this.#taps.length) {
        index = this.#taps.length;
        if (error) {
          finalCb(error);
        } else {
          finalCb(null, result);
        }
      }
    };

    tapLoop: for (const tap of this.#taps) {
      for (const interceptor of this.#interceptors) {
        if (interceptor.tap) {
          interceptor.tap(tap);
        }
      }
      switch (tap.type) {
        case 'sync':
          try {
            const result = tap.fn(...params);
            if (typeof result !== 'undefined') {
              end(null, result);
              break tapLoop;
            }
            index++;
            if (index >= this.#taps.length) {
              finalCb();
            }
          } catch (err) {
            end(err as Error);
            break tapLoop;
          }

          break;

        case 'promise':
          {
            tap.fn(...params).then((result: any) => {
              if (typeof result !== 'undefined') {
                return end(null, result);
              }
              index++;
              if (index >= this.#taps.length) {
                finalCb();
              }
            }, end);
          }
          break;

        case 'async': {
          tap.fn(...params, (error: Error | null, result: any) => {
            if (error) {
              return end(error);
            }
            if (typeof result !== 'undefined') {
              return end(null, result);
            }
            index++;
            if (index >= this.#taps.length) {
              finalCb();
            }
          });
        }
      }
    }
  }

  promise(...params: any[]) {
    return new Promise((fulfill, reject) => {
      this.callAsync(...params, (error: Error | null, result: any) => {
        if (error) {
          return reject(error);
        }
        fulfill(result);
      });
    });
  }

  intercept(options: Partial<InterceptOptions>) {
    this.#interceptors.push(options);
  }
}
