export type Callback = (...args: any) => any;

export class SyncWaterfallHook {
  private readonly taps: Array<{
    pluginName: string;
    fn: Callback;
  }> = [];

  constructor(private readonly params: Array<string>, public readonly name?: string) {}

  tap(pluginName: string, fn: Callback) {
    this.taps.push({
      pluginName,
      fn,
    });
  }

  call(...providedParams: any[]) {
    let prevResult = providedParams.shift();

    for (const tap of this.taps) {
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
}
