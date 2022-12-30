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

export class AsyncParallelHook {
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

    let completedCount = 0;

    loopTap: for (const tap of this.#taps) {
      for (const interceptor of this.#interceptors) {
        if (interceptor.tap) {
          interceptor.tap(tap);
        }
      }
      switch (tap.type) {
        case 'sync': {
          try {
            tap.fn(...params);
            completedCount++;

            if (completedCount === this.#taps.length) {
              finalCb();
            }
          } catch (err) {
            finalCb(err);
            break loopTap;
          }
          break;
        }

        case 'promise': {
          tap.fn(...params).then(() => {
            completedCount++;

            if (completedCount === this.#taps.length) {
              finalCb();
            }
          }, finalCb);
          break;
        }

        case 'async': {
          tap.fn(...params, (err: Error | null) => {
            if (err) {
              return finalCb(err);
            }
            completedCount++;

            if (completedCount === this.#taps.length) {
              finalCb();
            }
          });
        }
      }
    }
  }

  promise(...params: any[]): Promise<void> {
    return new Promise((fulfill, reject) => {
      this.callAsync(...params, (err: Error | null) => (err ? reject(err) : fulfill()));
    });
  }

  intercept(options: Partial<InterceptOptions>) {
    this.#interceptors.push(options);
  }
}
