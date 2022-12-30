export type Callback = (...args: any) => any;

export type Tap = {
  name: string;
  fn: Callback;
  type: string;
};

export interface InterceptOptions {
  call: (...args: any[]) => void;
  tap: (...args: any[]) => void;
  register: (tap: Tap) => Tap;
  loop: (...args: any[]) => void;
}

export class SyncWaterfallHook {
  readonly #taps: Array<Tap> = [];
  readonly #interceptors: Array<Partial<InterceptOptions>> = [];

  constructor(private readonly params: Array<string>, public readonly name?: string) {}

  tap(pluginName: string, fn: Callback) {
    let tap: Tap = {
      name: pluginName,
      fn,
      type: 'sync',
    };

    for (const interceptor of this.#interceptors) {
      if (interceptor.register) {
        tap = interceptor.register(tap);
      }
    }

    this.#taps.push(tap);
  }

  call(...providedParams: any[]) {
    for (const interceptor of this.#interceptors) {
      if (interceptor.call) {
        interceptor.call(...providedParams);
      }
    }

    let prevResult = providedParams.shift();

    for (const tap of this.#taps) {
      for (const interceptor of this.#interceptors) {
        if (interceptor.tap) {
          interceptor.tap(tap);
        }
      }

      const result = tap.fn(prevResult, ...providedParams);
      if (typeof result !== 'undefined') {
        prevResult = result;
      }
    }

    return prevResult;
  }

  callAsync(...providedParams: any[]) {
    let finalCb = providedParams.pop();

    try {
      const result = this.call(...providedParams);
      finalCb(null, result);
    } catch (err) {
      finalCb(err);
    }
  }

  promise(...providedParams: any[]) {
    return new Promise<any>((fulfill) => {
      fulfill(this.call(...providedParams));
    });
  }

  intercept(options: Partial<InterceptOptions>) {
    this.#interceptors.push(options);
  }
}
