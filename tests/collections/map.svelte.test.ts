import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { boxedMap, fastBoxedMap } from '../../src/lib/index.js';
import { withRoot } from '../_helpers.svelte.js';

describe('BoxedMap', () => {
    it('set and get work through forwarding', () => {
        const m = boxedMap<string, number>();
        m.set('a', 1);
        m.set('b', 2);
        expect(m.get('a')).toBe(1);
        expect(m.get('b')).toBe(2);
        expect(m.size).toBe(2);
    });

    it('mutations are reactive', () => {
        const m = boxedMap<string, number>([['a', 1]]);
        let observedSize = -1;
        let observedA: number | undefined;

        const cleanup = withRoot(() => {
            $effect(() => {
                observedSize = m.size;
                observedA = m.get('a');
            });
        });
        flushSync();
        expect(observedSize).toBe(1);
        expect(observedA).toBe(1);

        m.set('b', 2);
        flushSync();
        expect(observedSize).toBe(2);

        m.set('a', 99);
        flushSync();
        expect(observedA).toBe(99);

        m.delete('a');
        flushSync();
        expect(observedA).toBeUndefined();

        cleanup();
    });

    it('replacing the value is reactive', () => {
        const m = boxedMap<string, number>([['a', 1]]);
        let observed = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = m.value.size;
            });
        });
        flushSync();
        expect(observed).toBe(1);

        m.value = new SvelteMap([
            ['x', 10],
            ['y', 20]
        ]);
        flushSync();
        expect(observed).toBe(2);

        cleanup();
    });

    it('set on a Map-wrapping box calls the inner Map.set', () => {
        const m = boxedMap<string, number>();
        m.set('k', 1);
        expect(m.get('k')).toBe(1);
        expect(m.value.size).toBe(1);
    });

    it('replacing a BoxedMap requires box.value =', () => {
        const m = boxedMap<string, number>([['a', 1]]);

        m.value = new SvelteMap([['z', 99]]);
        expect(m.get('a')).toBeUndefined();
        expect(m.get('z')).toBe(99);
    });
});

describe('boxedMap: JSON.stringify', () => {
    // JSON.stringify of a Map returns "{}" because entries are not own
    // enumerable properties. Box's `toJSON` returns the inner SvelteMap,
    // which inherits that behavior.
    it('JSON.stringify of a boxedMap returns "{}"', () => {
        const m = boxedMap<string, number>([
            ['a', 1],
            ['b', 2]
        ]);
        expect(JSON.stringify(m)).toBe('{}');
    });

    it('Array.from is the supported way to serialize a boxedMap', () => {
        const m = boxedMap<string, number>([['a', 1]]);
        expect(JSON.stringify(Array.from(m))).toBe('[["a",1]]');
    });
});

describe('fastBoxedMap', () => {
    it('exposes SvelteMap through .value', () => {
        const m = fastBoxedMap<string, number>([['a', 1]]);
        expect(m.value.get('a')).toBe(1);
        m.value.set('b', 2);
        expect(m.value.get('b')).toBe(2);
        expect(m.value.size).toBe(2);
    });

    it('mutations through .value are reactive', () => {
        const m = fastBoxedMap<string, number>([['a', 1]]);
        let observedSize = -1;
        let observedA: number | undefined;

        const cleanup = withRoot(() => {
            $effect(() => {
                observedSize = m.value.size;
                observedA = m.value.get('a');
            });
        });
        flushSync();
        expect(observedSize).toBe(1);
        expect(observedA).toBe(1);

        m.value.set('b', 2);
        flushSync();
        expect(observedSize).toBe(2);

        m.value.set('a', 99);
        flushSync();
        expect(observedA).toBe(99);

        m.value.delete('a');
        flushSync();
        expect(observedA).toBeUndefined();

        cleanup();
    });

    it('replacing the value is reactive', () => {
        const m = fastBoxedMap<string, number>([['a', 1]]);
        let observed = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = m.value.size;
            });
        });
        flushSync();
        expect(observed).toBe(1);

        m.value = new SvelteMap([
            ['x', 10],
            ['y', 20]
        ]);
        flushSync();
        expect(observed).toBe(2);

        cleanup();
    });

    it('does not transparently forward .set, .get to inner map', () => {
        const m = fastBoxedMap<string, number>();
        // FastBox.set replaces the whole value, not what we want for a map.
        // This is the documented trade-off for using fastBoxed*.
        expect(typeof (m as unknown as { set: unknown }).set).toBe('function');
        expect((m as unknown as { set: unknown }).set).not.toBe(m.value.set);

        // Calling FastBox.set with a key/value overwrites .value with the key.
        // Documents the destructive trap so behavior cannot regress silently.
        (m as unknown as { set: (k: unknown, v: unknown) => void }).set('k', 1);
        expect(m.value).toBe('k');
    });
});
