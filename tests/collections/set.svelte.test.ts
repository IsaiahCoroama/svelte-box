import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { boxedSet, constBoxedSet, constFastBoxedSet, fastBoxedSet } from '../../src/lib/index.js';
import { withRoot } from '../_helpers.svelte.js';

describe('BoxedSet', () => {
    it('add and has work through forwarding', () => {
        const s = boxedSet<string>(['a']);
        s.add('b');
        expect(s.has('a')).toBe(true);
        expect(s.has('b')).toBe(true);
        expect(s.size).toBe(2);
    });

    it('mutations are reactive', () => {
        const s = boxedSet<string>();
        let size = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                size = s.size;
            });
        });
        flushSync();
        expect(size).toBe(0);

        s.add('one');
        flushSync();
        expect(size).toBe(1);

        s.add('two');
        flushSync();
        expect(size).toBe(2);

        s.delete('one');
        flushSync();
        expect(size).toBe(1);

        cleanup();
    });

    it('iterates entries', () => {
        const s = boxedSet([1, 2, 3]);
        const out = [...s];
        expect(out.sort()).toEqual([1, 2, 3]);
    });
});

describe('boxedSet: JSON.stringify', () => {
    // JSON.stringify of a Set returns "{}" because entries are not own
    // enumerable properties. Box's `toJSON` returns the inner SvelteSet,
    // which inherits that behavior.
    it('JSON.stringify of a boxedSet returns "{}"', () => {
        const s = boxedSet(['x', 'y']);
        expect(JSON.stringify(s)).toBe('{}');
    });

    it('Spread is the supported way to serialize a boxedSet', () => {
        const s = boxedSet(['x', 'y']);
        expect(JSON.stringify([...s].sort())).toBe('["x","y"]');
    });
});

describe('fastBoxedSet', () => {
    it('exposes SvelteSet through .value', () => {
        const s = fastBoxedSet<string>(['a']);
        s.value.add('b');
        expect(s.value.has('a')).toBe(true);
        expect(s.value.has('b')).toBe(true);
        expect(s.value.size).toBe(2);
    });

    it('mutations through .value are reactive', () => {
        const s = fastBoxedSet<string>();
        let size = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                size = s.value.size;
            });
        });
        flushSync();
        expect(size).toBe(0);

        s.value.add('one');
        flushSync();
        expect(size).toBe(1);

        s.value.add('two');
        flushSync();
        expect(size).toBe(2);

        s.value.delete('one');
        flushSync();
        expect(size).toBe(1);

        cleanup();
    });

    it('iterates entries via .value', () => {
        const s = fastBoxedSet([1, 2, 3]);
        const out = [...s.value];
        expect(out.sort()).toEqual([1, 2, 3]);
    });
});

describe('constBoxedSet', () => {
    it('wraps a fresh SvelteSet with the given values', () => {
        const s = constBoxedSet<string>(['a', 'b']);
        expect(s.value).toBeInstanceOf(SvelteSet);
        expect(s.value.size).toBe(2);
        expect(s.has('a')).toBe(true);
    });

    it('forwarded `add` mutates the inner SvelteSet reactively', () => {
        const s = constBoxedSet<string>();
        let observedSize = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observedSize = s.value.size;
            });
        });
        flushSync();
        expect(observedSize).toBe(0);

        s.add('a');
        flushSync();
        expect(observedSize).toBe(1);
        expect(s.has('a')).toBe(true);

        cleanup();
    });

    it('throws on .value reassignment', () => {
        const s = constBoxedSet<string>();
        expect(() => {
            (s as unknown as { value: SvelteSet<string> }).value = new SvelteSet();
        }).toThrow(TypeError);
    });
});

describe('constFastBoxedSet', () => {
    it('wraps a fresh SvelteSet (no proxy)', () => {
        const s = constFastBoxedSet<string>(['a']);
        expect(s.value).toBeInstanceOf(SvelteSet);
        expect(s.value.has('a')).toBe(true);
    });

    it('mutations through .value are reactive', () => {
        const s = constFastBoxedSet<string>(['a']);
        let observedSize = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observedSize = s.value.size;
            });
        });
        flushSync();
        expect(observedSize).toBe(1);

        s.value.add('b');
        flushSync();
        expect(observedSize).toBe(2);

        cleanup();
    });

    it('throws on .value reassignment', () => {
        const s = constFastBoxedSet<string>();
        expect(() => {
            (s as unknown as { value: SvelteSet<string> }).value = new SvelteSet();
        }).toThrow(TypeError);
    });
});
