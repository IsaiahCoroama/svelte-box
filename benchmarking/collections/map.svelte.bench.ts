/**
 * Benchmark suite for the boxedMap / fastBoxedMap factories.
 *
 * Three-way comparison: bare `SvelteMap` (baseline), `boxedMap` (Box wrapping
 * a SvelteMap, forwarded `.set` / `.get`), and `fastBoxedMap` (FastBox
 * wrapping a SvelteMap, accessed through `.value`).
 *
 * Keys vary across iterations (`'k' + (i++ % 1000)`) so SvelteMap cannot
 * short-circuit on unchanged-value writes and reads stay representative of
 * realistic mixed-key access.
 */

import { describe, bench } from 'vitest';
import { SvelteMap } from 'svelte/reactivity';
import { boxedMap, fastBoxedMap } from '../../src/lib/index.js';

const KEY_COUNT = 1000;

describe('Map.set', () => {
	const sm = new SvelteMap<string, number>();
	const bm = boxedMap<string, number>();
	const fbm = fastBoxedMap<string, number>();
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
});

describe('Map.get', () => {
	const initial: [string, number][] = [];
	for (let n = 0; n < KEY_COUNT; n++) initial.push(['k' + n, n]);

	const sm = new SvelteMap<string, number>(initial);
	const bm = boxedMap<string, number>(initial);
	const fbm = fastBoxedMap<string, number>(initial);
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
});
