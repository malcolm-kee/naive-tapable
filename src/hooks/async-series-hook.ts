export class AsyncSeriesHook {
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

  callAsync(...params: any[]) {
    const finalCb = params.pop();
    let index = 0;

    const runNext = () => {
      const tap = this.taps[index];

      if (!tap) {
        return finalCb();
      }

      switch (tap.type) {
        case 'sync':
          try {
            tap.fn(...params);
            index++;
            runNext();
          } catch (err) {
            finalCb(err);
          }

          break;

        case 'promise':
          {
            tap.fn(...params).then(() => {
              index++;
              runNext();
            }, finalCb);
          }
          break;

        case 'async': {
          tap.fn(...params, (err: Error | null) => {
            if (err) {
              return finalCb(err);
            }
            index++;
            runNext();
          });
        }
      }
    };

    runNext();
  }

  promise(...params: any[]): Promise<void> {
    return new Promise<void>((fulfill, reject) => {
      this.callAsync(...params, (err: Error | null) => (err ? reject(err) : fulfill()));
    });
  }
}
