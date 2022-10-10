export class AsyncSeriesWaterfallHook {
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

    let index = 0;
    let prevResult = params.shift();

    const next = () => {
      const tap = this.taps[index];

      if (!tap) {
        return finalCb(null, prevResult);
      }

      switch (tap.type) {
        case 'sync':
          {
            try {
              const result = tap.fn(prevResult, ...params);
              if (typeof result !== 'undefined') {
                prevResult = result;
              }
              index++;
              next();
            } catch (err) {
              finalCb(err);
            }
          }
          break;

        case 'promise':
          tap.fn(prevResult, ...params).then((result: any) => {
            if (typeof result !== 'undefined') {
              prevResult = result;
            }
            index++;
            next();
          }, finalCb);
          break;

        case 'async':
          tap.fn(prevResult, ...params, (err: Error | null, result: any) => {
            if (err) {
              return finalCb(err);
            }
            if (typeof result !== 'undefined') {
              prevResult = result;
            }
            index++;
            next();
          });
      }
    };

    next();
  }

  promise(...params: any) {
    return new Promise<any>((fulfill, reject) => {
      this.callAsync(...params, (err: Error | null, result: any) =>
        err ? reject(err) : fulfill(result)
      );
    });
  }
}
