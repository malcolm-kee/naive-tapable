export type Callback = (...args: any) => void;

export interface InterceptOptions {
  call: (...args: any[]) => void;
  tap: (...args: any[]) => void;
  register: (tap: any) => any;
  loop: (...args: any[]) => void;
}

export class SyncHook {
  private readonly taps: Array<{ name: string; fn: Callback }> = [];
  private readonly interceptors: Array<Partial<InterceptOptions>> = [];

  constructor(private readonly _params: Array<string>, public readonly name?: string) {}

  tap(pluginName: string, fn: Callback) {
    let tap = {
      fn,
      name: pluginName,
      type: 'sync',
    };

    for (const interceptor of this.interceptors) {
      if (interceptor.register) {
        tap = interceptor.register(tap);
      }
    }

    this.taps.push(tap);
  }

  call(...providedParams: any[]) {
    for (const interceptor of this.interceptors) {
      if (interceptor.call) {
        interceptor.call(...providedParams);
      }
    }

    for (const tap of this.taps) {
      for (const interceptor of this.interceptors) {
        if (interceptor.tap) {
          interceptor.tap(tap);
        }
      }

      tap.fn(...providedParams);
    }
  }

  callAsync(...args: any[]) {
    const callBack = args.pop();

    try {
      this.call(...args);
      callBack();
    } catch (err) {
      callBack(err);
    }
  }

  promise(...args: any[]) {
    return new Promise<void>((fulfill) => {
      this.call(...args);
      fulfill();
    });
  }

  intercept(options: Partial<InterceptOptions>) {
    this.interceptors.push(options);
  }
}
