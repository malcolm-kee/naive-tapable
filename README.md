# naive-tapable

Inspired by [`mini-tapable`](https://github.com/lizuncong/mini-tapable), this is a simplifed reimplementation of webpack's [`tapable`](https://github.com/webpack/tapable) package.

The goals of this repo are:

- serves as a reference to review how each hook works.
- serves as an entry point to understand `tapable`.
- to deepen my learning of `tapable`.

## Overview

`tapable` exports two main groups of code:

1. Hooks
2. Helpers to make working with the hooks more convenient

### Hooks

- [SyncHook](src/hooks/sync-hook.ts)
- [SyncBailHook](src/hooks/sync-bail-hook.ts)
- [SyncWaterfallHook](src/hooks/sync-waterfall-hook.ts)
- [SyncLoopHook](src/hooks/sync-loop-hook.ts)
- [AsyncParallelHook](src/hooks/async-parallel-hook.ts)
- [AsyncParallelBailHook](src/hooks/async-parallel-bail-hook.ts)
- [AsyncSeriesHook](src/hooks/async-series-hook.ts)
- [AsyncSeriesBailHook](src/hooks/async-series-bail-hook.ts)
- [AsyncSeriesWaterfallHook](src/hooks/async-series-waterfall-hook.ts)

### Helpers

- [HookMap](src/helpers/hook-map.ts)
- [MultiHook](src/helpers/multi-hook.ts)

## Implementation Guidelines

- Minimal abstraction, so it is easy to understand what each `tapable` class meant for.
- Disregard any performance implication (that's why it's naive).
- Mostly compliant to the `tapable` public API. For less-used API that could complicate the implementation, I would not include it (but may include them in future into a separate folder). Similarly, due to the dynamic nature of `tapable`, relatively complicated TypeScript are required, so most of the time I will just use `any` to simplify the implementation.
