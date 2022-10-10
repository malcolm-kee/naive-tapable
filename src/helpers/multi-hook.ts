export class MultiHook {
  constructor(private readonly hooks: any[], name?: string) {}

  tap(...params: any[]) {
    for (const hook of this.hooks) {
      hook.tap(...params);
    }
  }

  tapPromise(...params: any[]) {
    for (const hook of this.hooks) {
      hook.tapPromise(...params);
    }
  }

  tapAsync(...params: any[]) {
    for (const hook of this.hooks) {
      hook.tapAsync(...params);
    }
  }
}
