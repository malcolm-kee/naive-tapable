export type Callback = (...args: any) => void;

export class SyncHook {
  private readonly taps: Array<{ pluginName: string; fn: Callback }> = [];

  constructor(private readonly _params: Array<string>, public readonly name?: string) {}

  tap(pluginName: string, fn: Callback) {
    this.taps.push({
      pluginName,
      fn,
    });
  }

  call(...providedParams: any[]) {
    for (const tap of this.taps) {
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
}
