export class AsyncSeriesLoopHook {
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

    const next = () => {
      const tap = this.taps[index];
      if (!tap) {
        return finalCb();
      }

      switch (tap.type) {
        case 'sync':
          try {
            const result = tap.fn(...params);
            if (typeof result === 'undefined') {
              index++;
            } else {
              index = 0;
            }
            next();
          } catch (err) {
            finalCb(err);
          }
          break;

        case 'promise':
          tap.fn(...params).then((result: any) => {
            if (typeof result === 'undefined') {
              index++;
            } else {
              index = 0;
            }
            next();
          }, finalCb);
          break;

        case 'async':
          tap.fn(...params, (err: Error | null, result: any) => {
            if (err) {
              return finalCb(err);
            }
            if (typeof result === 'undefined') {
              index++;
            } else {
              index = 0;
            }
            next();
          });
      }
    };

    next();
  }

  promise(...params: any) {
    return new Promise<void>((fulfill, reject) => {
      this.callAsync(...params, (err: Error | null) => (err ? reject(err) : fulfill()));
    });
  }
}
