import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { Box, FastBox, fastbox } from '../src/lib/index.js';
import { withRoot } from './_helpers.svelte.js';

describe('FastBox: construction and identity', () => {
	it('stores the initial value', () => {
		const b = new FastBox(42);
		expect(b.value).toBe(42);
	});

	it('is not the same class as Box', () => {
		const f = new FastBox(0);
		const b = new Box(0);
		expect(f instanceof FastBox).toBe(true);
		expect(f instanceof Box).toBe(false);
		expect(b instanceof FastBox).toBe(false);
		expect(b instanceof Box).toBe(true);
	});

	it('does not transparently forward inner properties', () => {
		const f = new FastBox({ a: 1, b: 2 });
		expect((f as unknown as { a?: number }).a).toBeUndefined();
		expect(f.value.a).toBe(1);
	});

	it('is not callable when wrapping a function', () => {
		const fn = () => 'hi';
		const f = new FastBox(fn);
		expect(() => (f as unknown as () => string)()).toThrow();
		expect(f.value()).toBe('hi');
	});
});

describe('fastbox factory', () => {
	it('is equivalent to new FastBox(...)', () => {
		const a = fastbox('hi');
		const b = new FastBox('hi');
		expect(a.value).toBe(b.value);
		expect(a).toBeInstanceOf(FastBox);
		expect(b).toBeInstanceOf(FastBox);
	});

	it('produces a fresh instance per call', () => {
		const a = fastbox(0);
		const b = fastbox(0);
		expect(a).not.toBe(b);
	});
});

describe('FastBox: reactivity', () => {
	it('tracks reads of value', () => {
		const f = new FastBox(0);
		let observed = -1;
		const cleanup = withRoot(() => {
			$effect(() => {
				observed = f.value;
			});
		});
		flushSync();
		expect(observed).toBe(0);

		f.value = 7;
		flushSync();
		expect(observed).toBe(7);

		cleanup();
	});

	it('survives passing through function boundaries', () => {
		const f = new FastBox(0);
		let observed = -1;
		const cleanup = withRoot(() => {
			$effect(() => {
				observed = f.value;
			});
		});
		flushSync();

		const bump = (b: FastBox<number>) => {
			b.value += 1;
		};
		bump(f);
		bump(f);
		flushSync();
		expect(observed).toBe(2);

		cleanup();
	});

	it('object boxes deep-track via box.value', () => {
		const u = new FastBox({ name: 'Ada' });
		let observed = '';
		const cleanup = withRoot(() => {
			$effect(() => {
				observed = u.value.name;
			});
		});
		flushSync();
		expect(observed).toBe('Ada');

		u.value.name = 'Grace';
		flushSync();
		expect(observed).toBe('Grace');

		cleanup();
	});
});

describe('FastBox: helpers', () => {
	it('get and set are equivalent to .value', () => {
		const b = new FastBox(0);
		expect(b.get()).toBe(0);
		b.set(5);
		expect(b.value).toBe(5);
		expect(b.get()).toBe(5);
	});

	it('del clears the value when T includes undefined', () => {
		const b = new FastBox<number | undefined>(5);
		b.del();
		expect(b.value).toBeUndefined();
	});

	it('snapshot returns a deep clone', () => {
		const b = new FastBox({ a: 1, b: { c: 2 } });
		const snap = b.snapshot();
		expect(snap).toEqual({ a: 1, b: { c: 2 } });
		snap.b.c = 99;
		expect(b.value.b.c).toBe(2);
	});

	it('eager returns the current value', () => {
		const b = new FastBox(7);
		expect(b.eager()).toBe(7);
		b.value = 9;
		expect(b.eager()).toBe(9);
	});

	it('toJSON makes JSON.stringify see the inner value', () => {
		const b = new FastBox({ name: 'Ada', age: 36 });
		expect(JSON.parse(JSON.stringify(b))).toEqual({ name: 'Ada', age: 36 });
	});

	it('type guards return the right boolean', () => {
		expect(new FastBox(1).isNumber()).toBe(true);
		expect(new FastBox('a').isString()).toBe(true);
		expect(new FastBox(true).isBoolean()).toBe(true);
		expect(new FastBox(null).isNull()).toBe(true);
		expect(new FastBox([]).isArray()).toBe(true);
		expect(new FastBox({}).isObject()).toBe(true);
		expect(new FastBox(() => 0).isFunction()).toBe(true);
		expect(new FastBox(new Map()).isMap()).toBe(true);
		expect(new FastBox(new Set()).isSet()).toBe(true);
	});
});
