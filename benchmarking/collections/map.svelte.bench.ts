/**
 * Benchmark suite for the boxedMap factories.
 *
 * Comparison across the four variants: `boxedMap` (Box, forwarded
 * methods), `fastBoxedMap` (FastBox, access via `.value`),
 * `constBoxedMap` (ConstBox, forwarded methods, value reference
 * frozen), and `constFastBoxedMap` (ConstFastBox, access via `.value`,
 * value reference frozen). Bare `SvelteMap` is the baseline.
 *
 * Keys vary across iterations (`'k' + (i++ % 1000)`) so SvelteMap cannot
 * short-circuit on unchanged-value writes and reads stay representative of
 * realistic mixed-key access.
 */

import { describe, bench } from 'vitest';
import { SvelteMap } from 'svelte/reactivity';
import { boxedMap, constBoxedMap, constFastBoxedMap, fastBoxedMap } from '../../src/lib/index.js';

const KEY_COUNT = 1000;

describe('Map.set', () => {
    const sm = new SvelteMap<string, number>();
    const bm = boxedMap<string, number>();
    const fbm = fastBoxedMap<string, number>();
    const cbm = constBoxedMap<string, number>();
    const cfbm = constFastBoxedMap<string, number>();
    let i = 0;

    bench('Baseline: SvelteMap.set(k, v)', () => {
        const n = i++;
        sm.set('k' + (n % KEY_COUNT), n);
    });

    bench('Box: boxedMap.set(k, v) (forwarded)', () => {
        const n = i++;
        bm.set('k' + (n % KEY_COUNT), n);
    });

    bench('FastBox: fastBoxedMap.value.set(k, v)', () => {
        const n = i++;
        fbm.value.set('k' + (n % KEY_COUNT), n);
    });

    bench('ConstBox: constBoxedMap.set(k, v) (forwarded)', () => {
        const n = i++;
        cbm.set('k' + (n % KEY_COUNT), n);
    });

    bench('ConstFastBox: constFastBoxedMap.value.set(k, v)', () => {
        const n = i++;
        cfbm.value.set('k' + (n % KEY_COUNT), n);
    });
});

describe('Map.get', () => {
    const initial: [string, number][] = [];
    for (let n = 0; n < KEY_COUNT; n++) initial.push(['k' + n, n]);

    const sm = new SvelteMap<string, number>(initial);
    const bm = boxedMap<string, number>(initial);
    const fbm = fastBoxedMap<string, number>(initial);
    const cbm = constBoxedMap<string, number>(initial);
    const cfbm = constFastBoxedMap<string, number>(initial);
    let i = 0;

    bench('Baseline: SvelteMap.get(k)', () => {
        sm.get('k' + (i++ % KEY_COUNT));
    });

    bench('Box: boxedMap.get(k) (forwarded)', () => {
        bm.get('k' + (i++ % KEY_COUNT));
    });

    bench('FastBox: fastBoxedMap.value.get(k)', () => {
        fbm.value.get('k' + (i++ % KEY_COUNT));
    });

    bench('ConstBox: constBoxedMap.get(k) (forwarded)', () => {
        cbm.get('k' + (i++ % KEY_COUNT));
    });

    bench('ConstFastBox: constFastBoxedMap.value.get(k)', () => {
        cfbm.value.get('k' + (i++ % KEY_COUNT));
    });
});
