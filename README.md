# naive-tapable

Inspired by [`mini-tapable`](https://github.com/lizuncong/mini-tapable), this is a simplifed reimplementation of webpack's [`tapable`](https://github.com/webpack/tapable) package.

The goals of this repo are:

- serves as a reference to review how each hook works.
- serves as an entry point to understand `tapable`.
- to deepen my learning of `tapable`.

## Progress

- [x] SyncHook
- [x] SyncBailHook
- [ ] SyncWaterfallHook
- [ ] SyncLoopHook
- [ ] AsyncParallelHook
- [ ] AsyncParallelBailHook
- [ ] AsyncSeriesHook
- [ ] AsyncSeriesBailHook
- [ ] AsyncSeriesWaterfallHook

## Principles

- Minimal abstraction, so it is easy to understand what each `tapable` class meant for.
- Disregard any performance implication (that's why it's naive).
- Mostly compliant to the `tapable` public API. For less-used API that could complicate the implementation, I would not include it (but may include them in future into a separate folder). Similarly, due to the dynamic nature of `tapable`, relatively complicated TypeScript are required, so most of the time I will just use `any` to simplify the implementation.
