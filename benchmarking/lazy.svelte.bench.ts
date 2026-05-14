/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * Benchmark suite for `LazyBox`.
 *
 * Two paths matter for real apps:
 *
 * - **Warm hit**: `prefetch()` returning the cached promise. This is
 *   the hot path because data-loaded once is read many times (route
 *   guards, derived stores, repeated component mounts).
 * - **Reset + first prefetch**: invalidation cycle where the consumer
 *   drops the cached value (e.g. SWR-style stale-while-revalidate) and
 *   the next call runs the loader again.
 *
 * Baselines: a hand-rolled cached-promise pattern and a hand-rolled
 * class with the same shape. The loader bodies are intentionally
 * trivial so the bench measures `LazyBox`'s own overhead, not the cost
 * of whatever real work the loader does.
 */

import { describe, bench } from 'vitest';
import { LazyBox, lazybox } from '../src/lib/index.js';

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('LazyBox construction', () => {
    const loader = () => 1;

    bench('Baseline: { cached: null, loader } object literal', () => {
        ({ cached: null, loader });
    });

    bench('LazyBox: new LazyBox(loader)', () => {
        new LazyBox(loader);
    });

    bench('LazyBox: lazybox(loader) factory', () => {
        lazybox(loader);
    });
});

// ---------------------------------------------------------------------------
// Warm path: cached promise hit
// ---------------------------------------------------------------------------

describe('prefetch warm hit (cache returns same promise)', () => {
    // Manual cache pattern someone would write without a library.
    class ManualCached<T> {
        cached: Promise<T> | null = null;
        constructor(public loader: () => T | Promise<T>) {}
        prefetch(): Promise<T> {
            if (this.cached) return this.cached;
            try {
                this.cached = Promise.resolve(this.loader());
            } catch (err) {
                this.cached = Promise.reject(err);
            }
            this.cached.catch(() => {});
            return this.cached;
        }
    }

    const manual = new ManualCached(() => ({ ok: true }));
    const lb = lazybox(() => ({ ok: true }));

    // Prime caches outside the timed region.
    void manual.prefetch();
    void lb.prefetch();

    bench('Baseline: ManualCached.prefetch() (warm)', () => {
        manual.prefetch();
    });

    bench('LazyBox: lb.prefetch() (warm)', () => {
        lb.prefetch();
    });
});

// ---------------------------------------------------------------------------
// Reset + first prefetch
// ---------------------------------------------------------------------------

describe('reset + cold prefetch (invalidation cycle)', () => {
    // Synchronous-return loader so each iteration measures the
    // wrapper overhead, not whatever the loader does. A real loader
    // would dominate the timing.
    const lb = lazybox(() => 1);

    bench('LazyBox: lb.reset() then lb.prefetch()', () => {
        lb.reset();
        lb.prefetch();
    });
});

// ---------------------------------------------------------------------------
// Direct .value read (already-cached scenario, no method call)
// ---------------------------------------------------------------------------

describe('cached promise via .value', () => {
    const lb = lazybox(() => 7);
    void lb.prefetch();

    bench('LazyBox: lb.value (cached promise)', () => {
        lb.value;
    });
});
