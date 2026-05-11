/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * Benchmark suite for svelte-box.
 *
 * Each group is a three-way comparison between a Baseline (the alternative a
 * developer would otherwise reach for), `Box` (proxy variant), and `FastBox`
 * (no-proxy variant) where applicable. Forwarding-only operations have no
 * FastBox row because FastBox does not implement transparent forwarding.
 *
 * Run with `npm run bench` (single pass) or `npm run bench:json` (writes
 * `bench-results.json`). The browser project is required so `$state` compiles.
 *
 * How to read results
 * - Higher `hz` is faster.
 * - `rme` (relative margin of error) is the noise floor. Treat differences
 *   smaller than ~2x rme as no signal.
 * - Setup is hoisted to `describe`-level so allocation costs are not part of
 *   bench iterations.
 */

import { describe, bench } from 'vitest';
import { Box, FastBox, box } from '../src/lib/index.js';

// $state can only appear as a variable initializer or class field, never as
// a free expression. The wrapper classes below let us compare per-instance
// construction cost against `new Box(...)` on equal footing.
class ManualPrimitive {
	value = $state(0);
}

class ManualObject {
	value = $state({ a: 1, b: 2, c: 3 });
}

// Accessor-pattern alternative: hides the cell behind a getter/setter pair.
// The "manual reactive class" pattern people reach for before adopting a
// library like svelte-box.
class AccessorPrimitive {
	#cell = $state(0);
	get value() {
		return this.#cell;
	}
	set value(v: number) {
		this.#cell = v;
	}
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction (primitive)', () => {
	bench('Baseline: new ManualPrimitive() (class with $state field)', () => {
		new ManualPrimitive();
	});

	bench('Box: new Box(0)', () => {
		new Box(0);
	});

	bench('FastBox: new FastBox(0)', () => {
		new FastBox(0);
	});
});

describe('construction (object)', () => {
	bench('Baseline: new ManualObject() (class with $state field)', () => {
		new ManualObject();
	});

	bench('Box: new Box({ a, b, c })', () => {
		new Box({ a: 1, b: 2, c: 3 });
	});

	bench('Box: box({ a, b, c }) factory', () => {
		box({ a: 1, b: 2, c: 3 });
	});

	bench('FastBox: new FastBox({ a, b, c })', () => {
		new FastBox({ a: 1, b: 2, c: 3 });
	});
});

// ---------------------------------------------------------------------------
// Primitive reads and writes
// ---------------------------------------------------------------------------

describe('primitive read', () => {
	const manual = new ManualPrimitive();
	const accessor = new AccessorPrimitive();
	const bx = new Box(0);
	const fb = new FastBox(0);
	const raw = $state(0);

	bench('Baseline: raw $state read', () => {
		raw;
	});

	bench('Baseline: ManualPrimitive.value (class with $state field)', () => {
		manual.value;
	});

	bench('Baseline: AccessorPrimitive.value (class accessor)', () => {
		accessor.value;
	});

	bench('Box: bx.value', () => {
		bx.value;
	});

	bench('FastBox: fb.value', () => {
		fb.value;
	});
});

describe('primitive write', () => {
	const manual = new ManualPrimitive();
	const accessor = new AccessorPrimitive();
	const bx = new Box(0);
	const fb = new FastBox(0);
	let raw = $state(0);

	bench('Baseline: raw $state write', () => {
		raw = raw + 1;
	});

	bench('Baseline: ManualPrimitive.value = i', () => {
		manual.value = manual.value + 1;
	});

	bench('Baseline: AccessorPrimitive.value = i', () => {
		accessor.value = accessor.value + 1;
	});

	bench('Box: bx.value = i', () => {
		bx.value = bx.value + 1;
	});

	bench('FastBox: fb.value = i', () => {
		fb.value = fb.value + 1;
	});
});

// ---------------------------------------------------------------------------
// Forwarded property access on object boxes (Box-only, FastBox does not forward)
// ---------------------------------------------------------------------------

describe('object property read', () => {
	const innerHolder = new (class {
		obj = $state({ a: 1, b: 2, c: 3 });
	})();
	const bx = box({ a: 1, b: 2, c: 3 });
	const fb = new FastBox({ a: 1, b: 2, c: 3 });

	bench('Baseline: innerHolder.obj.a (direct $state proxy)', () => {
		innerHolder.obj.a;
	});

	bench('Box: bx.a (transparent forward)', () => {
		bx.a;
	});

	bench('Box: bx.value.a (via .value)', () => {
		bx.value.a;
	});

	bench('FastBox: fb.value.a (via .value)', () => {
		fb.value.a;
	});
});

describe('object property write', () => {
	const innerHolder = new (class {
		obj = $state({ a: 0 });
	})();
	const bx = box({ a: 0 });
	const fb = new FastBox({ a: 0 });

	bench('Baseline: innerHolder.obj.a = i (direct $state proxy)', () => {
		innerHolder.obj.a = innerHolder.obj.a + 1;
	});

	bench('Box: bx.a = i (transparent forward)', () => {
		bx.a = bx.a + 1;
	});

	bench('Box: bx.value.a = i (via .value)', () => {
		bx.value.a = bx.value.a + 1;
	});

	bench('FastBox: fb.value.a = i (via .value)', () => {
		fb.value.a = fb.value.a + 1;
	});
});

// ---------------------------------------------------------------------------
// Method forwarding (Box-only)
// ---------------------------------------------------------------------------

describe('forwarded method call', () => {
	class WithMethod {
		count = 0;
		inc() {
			this.count += 1;
		}
	}

	const inner = new WithMethod();
	const bx = box(new WithMethod());
	const fb = new FastBox(new WithMethod());

	bench('Baseline: inner.inc()', () => {
		inner.inc();
	});

	bench('Box: bx.inc() (cached binding)', () => {
		(bx as unknown as WithMethod).inc();
	});

	bench('FastBox: fb.value.inc() (via .value)', () => {
		fb.value.inc();
	});
});

describe('forwarded method identity lookup', () => {
	const inner = { fn() {} };
	const bx = box(inner);
	const fb = new FastBox(inner);

	bench('Baseline: inner.fn', () => {
		inner.fn;
	});

	bench('Box: bx.fn (cache hit)', () => {
		(bx as unknown as typeof inner).fn;
	});

	bench('FastBox: fb.value.fn', () => {
		fb.value.fn;
	});
});

// ---------------------------------------------------------------------------
// Type guards (live on shared BaseBox, identical between Box and FastBox)
// ---------------------------------------------------------------------------

describe('type guards (isNumber)', () => {
	const bx = new Box(42);
	const fb = new FastBox(42);

	bench('Box: bx.isNumber()', () => {
		bx.isNumber();
	});

	bench('FastBox: fb.isNumber()', () => {
		fb.isNumber();
	});
});

describe('type guards (isArray)', () => {
	const bx = new Box([1, 2, 3]);
	const fb = new FastBox([1, 2, 3]);

	bench('Box: bx.isArray()', () => {
		bx.isArray();
	});

	bench('FastBox: fb.isArray()', () => {
		fb.isArray();
	});
});

// ---------------------------------------------------------------------------
// Snapshot, eager, JSON.stringify
// ---------------------------------------------------------------------------

describe('snapshot', () => {
	const holder = new (class {
		obj = $state({ a: 1, b: { c: 2, d: [3, 4, 5] } });
	})();
	const bx = box({ a: 1, b: { c: 2, d: [3, 4, 5] } });
	const fb = new FastBox({ a: 1, b: { c: 2, d: [3, 4, 5] } });

	bench('Baseline: $state.snapshot(inner)', () => {
		$state.snapshot(holder.obj);
	});

	bench('Box: bx.snapshot()', () => {
		bx.snapshot();
	});

	bench('FastBox: fb.snapshot()', () => {
		fb.snapshot();
	});
});

describe('JSON.stringify', () => {
	const holder = new (class {
		obj = $state({ a: 1, b: { c: 2 } });
	})();
	const bx = box({ a: 1, b: { c: 2 } });
	const fb = new FastBox({ a: 1, b: { c: 2 } });

	bench('Baseline: JSON.stringify(inner)', () => {
		JSON.stringify(holder.obj);
	});

	bench('Box: JSON.stringify(bx)', () => {
		JSON.stringify(bx);
	});

	bench('FastBox: JSON.stringify(fb)', () => {
		JSON.stringify(fb);
	});
});

describe('eager', () => {
	const raw = $state(42);
	const bx = new Box(42);
	const fb = new FastBox(42);

	bench('Baseline: raw $state read', () => {
		raw;
	});

	bench('Box: bx.eager()', () => {
		bx.eager();
	});

	bench('FastBox: fb.eager()', () => {
		fb.eager();
	});
});

// ---------------------------------------------------------------------------
// Collection benchmarks live in `benchmarking/collections/map.svelte.bench.ts`
// and `benchmarking/collections/set.svelte.bench.ts` to mirror the lib layout.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cross-boundary: pass to function and mutate.
// This is the use case Box was designed for.
// ---------------------------------------------------------------------------

describe('cross-boundary mutation', () => {
	const manual = new ManualPrimitive();
	const accessor = new AccessorPrimitive();
	const objWrapper = $state({ value: 0 });
	const bx = new Box(0);
	const fb = new FastBox(0);

	function mutateManual(m: ManualPrimitive) {
		m.value += 1;
	}
	function mutateAccessor(a: AccessorPrimitive) {
		a.value += 1;
	}
	function mutateWrapper(w: { value: number }) {
		w.value += 1;
	}
	function mutateBox(b: Box<number>) {
		b.value += 1;
	}
	function mutateFast(b: FastBox<number>) {
		b.value += 1;
	}

	bench('Baseline: $state field (cross-boundary)', () => {
		mutateManual(manual);
	});

	bench('Baseline: accessor (cross-boundary)', () => {
		mutateAccessor(accessor);
	});

	bench('Baseline: $state({ value }) (cross-boundary)', () => {
		mutateWrapper(objWrapper);
	});

	bench('Box: cross-boundary', () => {
		mutateBox(bx);
	});

	bench('FastBox: cross-boundary', () => {
		mutateFast(fb);
	});
});

describe('cross-boundary read from class instance', () => {
	class StoreWithField {
		count = $state(0);
	}
	class StoreWithAccessor {
		#cell = $state(0);
		get count() {
			return this.#cell;
		}
		set count(v: number) {
			this.#cell = v;
		}
	}
	class StoreWithBox {
		count = new Box(0);
	}
	class StoreWithFastBox {
		count = new FastBox(0);
	}

	const sf = new StoreWithField();
	const sa = new StoreWithAccessor();
	const sb = new StoreWithBox();
	const sfb = new StoreWithFastBox();

	bench('Baseline: store.count (class $state field)', () => {
		sf.count;
	});

	bench('Baseline: store.count (class accessor)', () => {
		sa.count;
	});

	bench('Box: store.count.value', () => {
		sb.count.value;
	});

	bench('FastBox: store.count.value', () => {
		sfb.count.value;
	});
});

// ---------------------------------------------------------------------------
// Bulk stress paths
// ---------------------------------------------------------------------------

describe('bulk: 1000 instance construction', () => {
	bench('Baseline: 1000 ManualPrimitive instances', () => {
		const list: ManualPrimitive[] = [];
		for (let i = 0; i < 1000; i++) list.push(new ManualPrimitive());
	});

	bench('Box: 1000 new Box(i)', () => {
		const list: Box<number>[] = [];
		for (let i = 0; i < 1000; i++) list.push(new Box(i));
	});

	bench('FastBox: 1000 new FastBox(i)', () => {
		const list: FastBox<number>[] = [];
		for (let i = 0; i < 1000; i++) list.push(new FastBox(i));
	});
});

describe('bulk: 10k value reads', () => {
	const manual = new ManualPrimitive();
	const bx = new Box(0);
	const fb = new FastBox(0);

	bench('Baseline: 10k manual.value reads', () => {
		for (let i = 0; i < 10_000; i++) manual.value;
	});

	bench('Box: 10k bx.value reads', () => {
		for (let i = 0; i < 10_000; i++) bx.value;
	});

	bench('FastBox: 10k fb.value reads', () => {
		for (let i = 0; i < 10_000; i++) fb.value;
	});
});

describe('bulk: 10k forwarded prop reads', () => {
	const holder = new (class {
		obj = $state({ count: 0 });
	})();
	const bx = box({ count: 0 });
	const fb = new FastBox({ count: 0 });

	bench('Baseline: 10k holder.obj.count reads', () => {
		for (let i = 0; i < 10_000; i++) holder.obj.count;
	});

	bench('Box: 10k bx.count reads (transparent)', () => {
		for (let i = 0; i < 10_000; i++) bx.count;
	});

	bench('FastBox: 10k fb.value.count reads', () => {
		for (let i = 0; i < 10_000; i++) fb.value.count;
	});
});
