export type Callback = (...args: any) => any;

export class SyncLoopHook {
  private readonly taps: Array<{
    pluginName: string;
    fn: Callback;
  }> = [];

  constructor(private readonly params: string[], public readonly name?: string) {}

  tap(pluginName: string, fn: Callback) {
    this.taps.push({
      pluginName,
      fn,
    });
  }

  call(...providedParams: any[]): void {
    let index = 0;

    while (index < this.taps.length) {
      const tap = this.taps[index];
      const result = tap.fn(...providedParams);

      if (typeof result !== 'undefined') {
        index = 0;
      } else {
        index++;
      }
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
}
