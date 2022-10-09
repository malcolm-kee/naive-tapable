export class AsyncSeriesBailHook {
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
    const runNext = () => {
      const tap = this.taps[index];

      if (!tap) {
        return finalCb();
      }

      switch (tap.type) {
        case 'sync':
          {
            try {
              const result = tap.fn(...params);

              if (typeof result !== 'undefined') {
                return finalCb(null, result);
              }

              index++;
              runNext();
            } catch (err) {
              finalCb(err);
            }
          }
          break;

        case 'promise':
          tap.fn(...params).then((result: any) => {
            if (typeof result !== 'undefined') {
              return finalCb(null, result);
            }

            index++;
            runNext();
          }, finalCb);
          break;

        case 'async': {
          tap.fn(...params, (err: Error | null, result: any) => {
            if (err) {
              return finalCb(err);
            }
            if (typeof result !== 'undefined') {
              return finalCb(null, result);
            }

            index++;
            runNext();
          });
        }
      }
    };

    runNext();
  }

  promise(...params: any) {
    return new Promise<any>((fulfill, reject) => {
      this.callAsync(...params, (err: Error | null, result: any) =>
        err ? reject(err) : fulfill(result)
      );
    });
  }
}
