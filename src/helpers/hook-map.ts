export class HookMap<Hook> {
  private map = new Map<any, Hook>();

  constructor(private readonly factory: () => Hook, public readonly name?: string) {}

  get(key: any) {
    return this.map.get(key);
  }

  for(key: any) {
    const currentHook = this.map.get(key);
    if (currentHook) {
      return currentHook;
    }
    const hook = this.factory();
    this.map.set(key, hook);
    return hook;
  }
}
