export type Tap = {
  name: string;
  fn: Function;
  type: 'sync' | 'async' | 'promise';
};

export interface InterceptOptions {
  call: (...args: any[]) => void;
  tap: (tap: Tap) => void;
  register: (tap: Tap) => Tap;
  loop: (...args: any[]) => void;
}

export class AsyncSeriesLoopHook {
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

  #loop(providedParams: any[], finalCb: (error?: Error) => void): void {
    for (const interceptor of this.#interceptors) {
      if (interceptor.loop) {
        interceptor.loop(...providedParams);
      }
    }

    let index = 0;

    const runNextTap = () => {
      index++;
      runTap();
    };

    const runTap = () => {
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
          try {
            const result = tap.fn(...providedParams);
            if (typeof result === 'undefined') {
              runNextTap();
            } else {
              this.#loop(providedParams, finalCb);
            }
          } catch (err) {
            finalCb(err as Error);
          }
          break;

        case 'promise':
          tap.fn(...providedParams).then((result: any) => {
            if (typeof result === 'undefined') {
              runNextTap();
            } else {
              this.#loop(providedParams, finalCb);
            }
          }, finalCb);
          break;

        case 'async':
          tap.fn(...providedParams, (err: Error | null, result: any) => {
            if (err) {
              return finalCb(err);
            }
            if (typeof result === 'undefined') {
              runNextTap();
            } else {
              this.#loop(providedParams, finalCb);
            }
          });
      }
    };

    runTap();
  }

  callAsync(...params: any[]) {
    const finalCb = params.pop();

    for (const interceptor of this.#interceptors) {
      if (interceptor.call) {
        interceptor.call(...params);
      }
    }

    this.#loop(params, finalCb);
  }

  promise(...params: any) {
    return new Promise<void>((fulfill, reject) => {
      this.callAsync(...params, (err: Error | null) => (err ? reject(err) : fulfill()));
    });
  }

  intercept(options: Partial<InterceptOptions>) {
    this.#interceptors.push(options);
  }
}
