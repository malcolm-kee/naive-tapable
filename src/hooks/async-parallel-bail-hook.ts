export class AsyncParallelBailHook {
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

    const end = (error: null | Error, result?: any) => {
      if (index < this.taps.length) {
        index = this.taps.length;
        if (error) {
          finalCb(error);
        } else {
          finalCb(null, result);
        }
      }
    };

    tapLoop: for (const tap of this.taps) {
      switch (tap.type) {
        case 'sync':
          try {
            const result = tap.fn(...params);
            if (typeof result !== 'undefined') {
              end(null, result);
              break tapLoop;
            }
            index++;
            if (index >= this.taps.length) {
              finalCb();
            }
          } catch (err) {
            end(err as Error);
            break tapLoop;
          }

          break;

        case 'promise':
          {
            tap.fn(...params).then((result: any) => {
              if (typeof result !== 'undefined') {
                return end(null, result);
              }
              index++;
              if (index >= this.taps.length) {
                finalCb();
              }
            }, end);
          }
          break;

        case 'async':
          {
            tap.fn(...params, (error: Error | null, result: any) => {
              if (error) {
                return end(error);
              }
              if (typeof result !== 'undefined') {
                return end(null, result);
              }
              index++;
              if (index >= this.taps.length) {
                finalCb();
              }
            });
          }
          break;

        default:
          break;
      }
    }
  }

  promise(...params: any[]) {
    return new Promise((fulfill, reject) => {
      this.callAsync(...params, (error: Error | null, result: any) => {
        if (error) {
          return reject(error);
        }
        fulfill(result);
      });
    });
  }
}
