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

export class SyncLoopHook {
  readonly #taps: Array<Tap> = [];
  readonly #interceptors: Array<Partial<InterceptOptions>> = [];

  constructor(private readonly params: string[], public readonly name?: string) {}

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

  loop(providedParams: any[]) {
    for (const interceptor of this.#interceptors) {
      if (interceptor.loop) {
        interceptor.loop(...providedParams);
      }
    }

    let index = 0;

    while (index < this.#taps.length) {
      const tap = this.#taps[index];

      for (const interceptor of this.#interceptors) {
        if (interceptor.tap) {
          interceptor.tap(tap);
        }
      }

      const result = tap.fn(...providedParams);

      if (typeof result !== 'undefined') {
        this.loop(providedParams);
        break;
      } else {
        index++;
      }
    }
  }

  call(...providedParams: any[]): void {
    for (const interceptor of this.#interceptors) {
      if (interceptor.call) {
        interceptor.call(...providedParams);
      }
    }

    if (this.#taps.length) {
      this.loop(providedParams);
    }
  }

  callAsync(...providedParams: any[]): void {
    const finalCb = providedParams.pop();

    try {
      this.call(...providedParams);
      finalCb();
    } catch (err) {
      finalCb(err);
    }
  }

  promise(...providedParams: any[]): Promise<void> {
    return new Promise((fulfill) => {
      this.call(...providedParams);
      fulfill();
    });
  }

  intercept(options: Partial<InterceptOptions>) {
    this.#interceptors.push(options);
  }
}
