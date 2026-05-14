import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { CoreBox, MutCoreBox, RawCoreBox, RawMutCoreBox } from '../src/lib/core/core.svelte.js';
import { Box, ConstFastBox, FastBox, isBox } from '../src/lib/index.js';
import { withRoot } from './_helpers.svelte.js';

describe('CoreBox', () => {
    it('stores the initial value and exposes it through .value', () => {
        const c = new CoreBox(7);
        expect(c.value).toBe(7);
    });

    it('reads are reactive', () => {
        const c = new MutCoreBox(0);
        let observed = -1;
        const cleanup = withRoot(() => {
            $effect(() => {
                observed = c.value;
            });
        });
        flushSync();
        expect(observed).toBe(0);

        c.value = 5;
        flushSync();
        expect(observed).toBe(5);

        cleanup();
    });
});

describe('MutCoreBox', () => {
    it('exposes a public setter', () => {
        const m = new MutCoreBox(1);
        m.value = 2;
        expect(m.value).toBe(2);
    });

    it('deep-tracks inner-object mutations through the $state proxy', () => {
        const m = new MutCoreBox({ n: 1 });
        let observed = -1;
        const cleanup = withRoot(() => {
            $effect(() => {
                observed = m.value.n;
            });
        });
        flushSync();
        expect(observed).toBe(1);

        m.value.n = 9;
        flushSync();
        expect(observed).toBe(9);

        cleanup();
    });
});

describe('RawCoreBox', () => {
    it('stores the initial value and exposes it through .value', () => {
        const r = new RawCoreBox({ a: 1 });
        expect(r.value).toEqual({ a: 1 });
    });

    it('does not expose a public setter', () => {
        const r = new RawCoreBox(0);
        expect(() => {
            (r as unknown as { value: number }).value = 1;
        }).toThrow();
    });
});

describe('RawMutCoreBox', () => {
    it('exposes a public setter', () => {
        const r = new RawMutCoreBox('a');
        r.value = 'b';
        expect(r.value).toBe('b');
    });

    it('top-level reassignment is reactive', () => {
        const r = new RawMutCoreBox(0);
        let observed = -1;
        const cleanup = withRoot(() => {
            $effect(() => {
                observed = r.value;
            });
        });
        flushSync();
        expect(observed).toBe(0);

        r.value = 7;
        flushSync();
        expect(observed).toBe(7);

        cleanup();
    });

    it('does NOT deep-track inner-object mutations (raw storage)', () => {
        const r = new RawMutCoreBox({ n: 1 });
        let observed = -1;
        const cleanup = withRoot(() => {
            $effect(() => {
                observed = (r.value as { n: number }).n;
            });
        });
        flushSync();
        expect(observed).toBe(1);

        // Mutating an inner field does not fire reactivity through raw storage.
        r.value.n = 5;
        flushSync();
        expect(observed).toBe(1);

        // Reassigning the cell does fire reactivity.
        r.value = { n: 99 };
        flushSync();
        expect(observed).toBe(99);

        cleanup();
    });
});

describe('isBox', () => {
    it('recognises descendants of CoreBox', () => {
        expect(isBox(new CoreBox(0))).toBe(true);
        expect(isBox(new MutCoreBox(0))).toBe(true);
        expect(isBox(new Box(0))).toBe(true);
        expect(isBox(new FastBox(0))).toBe(true);
    });

    it('recognises descendants of RawCoreBox', () => {
        expect(isBox(new RawCoreBox(0))).toBe(true);
        expect(isBox(new RawMutCoreBox(0))).toBe(true);
        expect(isBox(new ConstFastBox(0))).toBe(true);
    });

    it('returns false for non-box values', () => {
        expect(isBox(null)).toBe(false);
        expect(isBox(undefined)).toBe(false);
        expect(isBox(42)).toBe(false);
        expect(isBox('hi')).toBe(false);
        expect(isBox({})).toBe(false);
        expect(isBox([])).toBe(false);
        expect(isBox(() => 0)).toBe(false);
        expect(isBox(new Map())).toBe(false);
    });
});
