export class AsyncParallelHook {
  private readonly taps: Array<{
    pluginName: string;
    fn: Function;
    type: 'sync' | 'async' | 'promise';
  }> = [];

  constructor(private readonly params: string[], public readonly name?: string) {}

  tap(pluginName: string, fn: Function) {
    this.taps.push({
      pluginName,
      type: 'sync',
      fn,
    });
  }

  tapPromise(pluginName: string, fn: Function) {
    this.taps.push({
      pluginName,
      type: 'promise',
      fn,
    });
  }

  tapAsync(pluginName: string, fn: Function) {
    this.taps.push({
      pluginName,
      type: 'async',
      fn,
    });
  }

  callAsync(...params: any[]): void {
    const finalCb = params.pop();

    let completedCount = 0;

    loopTap: for (const tap of this.taps) {
      switch (tap.type) {
        case 'sync': {
          try {
            tap.fn(...params);
            completedCount++;

            if (completedCount === this.taps.length) {
              finalCb();
            }
          } catch (err) {
            finalCb(err);
            break loopTap;
          }
          break;
        }

        case 'promise': {
          tap.fn(...params).then(() => {
            completedCount++;

            if (completedCount === this.taps.length) {
              finalCb();
            }
          }, finalCb);
          break;
        }

        case 'async': {
          tap.fn(...params, (err: Error | null) => {
            if (err) {
              return finalCb(err);
            }
            completedCount++;

            if (completedCount === this.taps.length) {
              finalCb();
            }
          });
        }
      }
    }
  }

  promise(...params: any[]): Promise<void> {
    return new Promise((fulfill, reject) => {
      this.callAsync(...params, (err: Error | null) => (err ? reject(err) : fulfill()));
    });
  }
}
