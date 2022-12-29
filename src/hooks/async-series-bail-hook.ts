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

export class AsyncSeriesBailHook {
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
    const runNext = () => {
      const tap = this.#taps[index];

      if (!tap) {
        return finalCb();
      }

      for (const interceptor of this.#interceptors) {
        if (interceptor.tap) {
          interceptor.tap(tap);
        }
      }

      switch (tap.type) {
        case 'sync':
          {
            try {
              const result = tap.fn(...params);

              if (typeof result !== 'undefined') {
                return finalCb(null, result);
              }

              index++;
              runNext();
            } catch (err) {
              finalCb(err);
            }
          }
          break;

        case 'promise':
          tap.fn(...params).then((result: any) => {
            if (typeof result !== 'undefined') {
              return finalCb(null, result);
            }

            index++;
            runNext();
          }, finalCb);
          break;

        case 'async': {
          tap.fn(...params, (err: Error | null, result: any) => {
            if (err) {
              return finalCb(err);
            }
            if (typeof result !== 'undefined') {
              return finalCb(null, result);
            }

            index++;
            runNext();
          });
        }
      }
    };

    runNext();
  }

  promise(...params: any) {
    return new Promise<any>((fulfill, reject) => {
      this.callAsync(...params, (err: Error | null, result: any) =>
        err ? reject(err) : fulfill(result)
      );
    });
  }

  intercept(options: Partial<InterceptOptions>) {
    this.#interceptors.push(options);
  }
}
