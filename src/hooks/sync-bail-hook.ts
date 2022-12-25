export type Callback = (...args: any) => void;

export interface InterceptOptions {
  call: (...args: any[]) => void;
  tap: (...args: any[]) => void;
  register: (tap: any) => any;
  loop: (...args: any[]) => void;
}

export class SyncBailHook {
  readonly #taps: Array<{
    name: string;
    fn: Callback;
  }> = [];
  readonly #interceptors: Array<Partial<InterceptOptions>> = [];

  constructor(private readonly params: Array<string>, public readonly name?: string) {}

  tap(pluginName: string, fn: Callback) {
    let tap = {
      fn,
      name: pluginName,
      type: 'sync',
    };

    for (const interceptor of this.#interceptors) {
      if (interceptor.register) {
        tap = interceptor.register(tap);
      }
    }

    this.#taps.push(tap);
  }

  call(...providedParams: any[]): void {
    for (const interceptor of this.#interceptors) {
      if (interceptor.call) {
        interceptor.call(...providedParams);
      }
    }

    for (const tap of this.#taps) {
      for (const interceptor of this.#interceptors) {
        if (interceptor.tap) {
          interceptor.tap(tap);
        }
      }

      const result = tap.fn(...providedParams);
      if (typeof result !== 'undefined') {
        return result;
      }
    }
  }

  callAsync(...params: any[]): void {
    const finalCb = params.pop();

    try {
      const result = this.call(...params);

      if (typeof result !== 'undefined') {
        finalCb(null, result);
      } else {
        finalCb();
      }
    } catch (err) {
      finalCb(err);
    }
  }

  promise(...params: any[]): Promise<any> {
    return new Promise<any>((fulfill) => {
      const result = this.call(...params);
      fulfill(result);
    });
  }

  intercept(options: Partial<InterceptOptions>) {
    this.#interceptors.push(options);
  }
}
