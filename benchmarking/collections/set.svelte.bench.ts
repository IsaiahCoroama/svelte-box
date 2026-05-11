/**
 * Benchmark suite for the boxedSet / fastBoxedSet factories.
 *
 * Three-way comparison: bare `SvelteSet` (baseline), `boxedSet` (Box wrapping
 * a SvelteSet, forwarded `.add`), and `fastBoxedSet` (FastBox wrapping a
 * SvelteSet, accessed through `.value`).
 *
 * Each bench reseeds a fresh set every `RESET_EVERY` iterations so most
 * `add` calls hit the new-key path rather than the cheap duplicate-check
 * fast path. Without this, the set saturates within the first 10k iters
 * and the remaining 99% of samples measure duplicate detection.
 */

import { describe, bench } from 'vitest';
import { SvelteSet } from 'svelte/reactivity';
import { boxedSet, fastBoxedSet } from '../../src/lib/index.js';

const RESET_EVERY = 10_000;

describe('Set.add', () => {
	let ss = new SvelteSet<number>();
	let bs = boxedSet<number>();
	let fbs = fastBoxedSet<number>();
	let i = 0;

	bench('Baseline: SvelteSet.add(i)', () => {
		if (i % RESET_EVERY === 0) ss = new SvelteSet<number>();
		ss.add(i++);
	});

	bench('Box: boxedSet.add(i) (forwarded)', () => {
		if (i % RESET_EVERY === 0) bs = boxedSet<number>();
		bs.add(i++);
	});

	bench('FastBox: fastBoxedSet.value.add(i)', () => {
		if (i % RESET_EVERY === 0) fbs = fastBoxedSet<number>();
		fbs.value.add(i++);
	});
});
