import * as tapable from 'tapable';
import { describe, expect, it } from 'vitest';
import * as naiveTapableExports from './index';

describe('exports', () => {
  Object.keys(tapable).forEach((key) => {
    if (!['__esModule', 'default'].includes(key)) {
      it(`export ${key}`, () => {
        expect(key in naiveTapableExports).toBe(true);
        expect((naiveTapableExports as any)[key]).toBeDefined();
      });
    }
  });
});
