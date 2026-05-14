/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * Benchmark suite for the const-view variants.
 *
 * Compares `ConstBox` (proxy, read-only) and `ConstFastBox` (plain
 * class, read-only) against a mutable `Box` baseline. Two construction
 * modes:
 *
 * - **Capture**: const view stores its own internal cell, decoupled
 *   from the source.
 * - **Borrow**: const view shares state with an existing box, so reads
 *   reflect live mutations on the source.
 *
 * Real-world signal: const views are the "hand a child a read-only
 * handle" pattern. The borrow benches answer "what does it cost a
 * consumer to read the same live value through a const wrapper?"; the
 * forwarded-property benches answer "does the read-only proxy add
 * measurable overhead compared to the mutable proxy?".
 */

import { describe, bench } from 'vitest';
import { Box, ConstBox, ConstFastBox, FastBox } from '../src/lib/index.js';

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('construction (const, primitive capture)', () => {
    bench('Baseline: new Box(0)', () => {
        new Box(0);
    });

    bench('ConstBox: new ConstBox(0)', () => {
        new ConstBox(0);
    });

    bench('ConstFastBox: new ConstFastBox(0)', () => {
        new ConstFastBox(0);
    });
});

describe('construction (const, borrow)', () => {
    const source = new Box(0);

    bench('ConstBox: new ConstBox(source)', () => {
        new ConstBox(source);
    });

    bench('ConstFastBox: new ConstFastBox(source)', () => {
        new ConstFastBox(source);
    });
});

// ---------------------------------------------------------------------------
// Primitive reads
// ---------------------------------------------------------------------------

describe('const primitive read (capture)', () => {
    const bx = new Box(0);
    const cb = new ConstBox(0);
    const cfb = new ConstFastBox(0);

    bench('Baseline: bx.value', () => {
        bx.value;
    });

    bench('ConstBox: cb.value', () => {
        cb.value;
    });

    bench('ConstFastBox: cfb.value', () => {
        cfb.value;
    });
});

describe('const primitive read (borrow)', () => {
    const source = new Box(0);
    const cb = new ConstBox(source);
    const cfb = new ConstFastBox(source);

    // Borrow mode adds a `#borrowed !== null` branch and one extra
    // property hop before reaching the source cell.
    bench('Baseline: source.value', () => {
        source.value;
    });

    bench('ConstBox borrow: cb.value', () => {
        cb.value;
    });

    bench('ConstFastBox borrow: cfb.value', () => {
        cfb.value;
    });
});

// ---------------------------------------------------------------------------
// Forwarded property access (ConstBox only — ConstFastBox has no proxy)
// ---------------------------------------------------------------------------

describe('const forwarded prop read', () => {
    const inner = { count: 0 };
    const bx = new Box(inner);
    const cb = new ConstBox(inner);
    const cfb = new ConstFastBox(inner);

    bench('Baseline: bx.count (mutable proxy forward)', () => {
        (bx as unknown as typeof inner).count;
    });

    bench('ConstBox: cb.count (read-only proxy forward)', () => {
        (cb as unknown as typeof inner).count;
    });

    bench('ConstFastBox: cfb.value.count (via .value)', () => {
        cfb.value.count;
    });
});

// ---------------------------------------------------------------------------
// Derive const view from a mutable Box
// ---------------------------------------------------------------------------

describe('box.const() and fastbox.const()', () => {
    const bx = new Box({ a: 1, b: 2 });
    const fb = new FastBox({ a: 1, b: 2 });

    bench('Box.const(): returns ConstBox snapshot', () => {
        bx.const();
    });

    bench('FastBox.const(): returns ConstFastBox snapshot', () => {
        fb.const();
    });
});

// ---------------------------------------------------------------------------
// Fan-out: one source, many const views reading concurrently
// ---------------------------------------------------------------------------

describe('borrow fan-out (10 readers, 1 source)', () => {
    // Models the "one store, many read-only consumers" pattern: a
    // parent owns the cell, children receive a const handle.
    const source = new Box(0);
    const constReaders: ConstBox<number>[] = [];
    const fastReaders: ConstFastBox<number>[] = [];
    const directReaders: Box<number>[] = [];
    for (let i = 0; i < 10; i++) {
        constReaders.push(new ConstBox(source));
        fastReaders.push(new ConstFastBox(source));
        directReaders.push(source);
    }

    bench('Baseline: 10 reads of source.value', () => {
        for (let i = 0; i < 10; i++) directReaders[i].value;
    });

    bench('ConstBox: 10 reads through borrowed const views', () => {
        for (let i = 0; i < 10; i++) constReaders[i].value;
    });

    bench('ConstFastBox: 10 reads through borrowed const views', () => {
        for (let i = 0; i < 10; i++) fastReaders[i].value;
    });
});
