export type Callback = (...args: any) => void;

export class SyncBailHook {
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

  call(...providedParams: any[]): void {
    for (const tap of this.taps) {
      const result = tap.fn(...providedParams);
      if (typeof result !== 'undefined') {
        return result;
      }
    }
  }

  callAsync(...params: any[]): void {
    const finalCb = params.pop();

    try {
      for (const tap of this.taps) {
        const result = tap.fn(...params);
        if (typeof result !== 'undefined') {
          finalCb(null, result);
          return;
        }
      }
    } catch (err) {
      finalCb(err);
      return;
    }

    finalCb();
  }

  promise(...params: any[]): Promise<any> {
    return new Promise<any>((fulfill) => {
      for (const tap of this.taps) {
        const result = tap.fn(...params);
        if (typeof result !== 'undefined') {
          return fulfill(result);
        }
      }
      fulfill(undefined);
    });
  }
}
