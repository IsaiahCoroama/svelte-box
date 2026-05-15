import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { flushSync } from 'svelte';
import {
    Box,
    FastBox,
    ConstBox,
    ConstFastBox,
    constbox,
    constfastbox,
    isBox
} from '../../src/lib/index.js';
import { withRoot } from '../_helpers.svelte.js';

const fcPrimitive = () =>
    fc.oneof(
        fc.boolean(),
        fc.string(),
        fc.integer(),
        fc.double({ noNaN: true }),
        fc.bigInt(),
        fc.constant(null),
        fc.constant(undefined)
    );

describe('ConstBox: property: capture mode', () => {
    it('captures primitive at construction', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(new ConstBox(v).value).toBe(v);
                expect(new ConstFastBox(v).value).toBe(v);
                expect(constbox(v).value).toBe(v);
                expect(constfastbox(v).value).toBe(v);
            })
        );
    });

    it('writes through .value always throw TypeError', () => {
        fc.assert(
            fc.property(fcPrimitive(), fcPrimitive(), (init, next) => {
                const cb = new ConstBox<unknown>(init);
                const cfb = new ConstFastBox<unknown>(init);
                expect(() => {
                    (cb as unknown as { value: unknown }).value = next;
                }).toThrow(TypeError);
                expect(() => {
                    (cfb as unknown as { value: unknown }).value = next;
                }).toThrow(TypeError);
                // Value did not change.
                expect(cb.value).toBe(init);
                expect(cfb.value).toBe(init);
            })
        );
    });
});

describe('ConstBox: property: borrow mode', () => {
    it('reads track the borrowed source', () => {
        fc.assert(
            fc.property(fcPrimitive(), fcPrimitive(), (init, next) => {
                const src = new Box<unknown>(init);
                const cv = new ConstBox(src);
                const cfv = new ConstFastBox(src);
                expect(cv.value).toBe(init);
                expect(cfv.value).toBe(init);

                src.value = next;
                expect(cv.value).toBe(next);
                expect(cfv.value).toBe(next);
            })
        );
    });

    it('borrows from FastBox too', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (a, b) => {
                const src = new FastBox(a);
                const cv = new ConstFastBox(src);
                expect(cv.value).toBe(a);
                src.value = b;
                expect(cv.value).toBe(b);
            })
        );
    });

    it('borrow-mode write through const still throws', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const src = new Box(init);
                const cv = new ConstBox(src);
                expect(() => {
                    (cv as unknown as { value: number }).value = next;
                }).toThrow(TypeError);
                // Source unaffected.
                expect(src.value).toBe(init);
            })
        );
    });
});

describe('ConstBox: property: reactivity', () => {
    it('borrow-mode source change re-runs effect on const reader', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (a, b) => {
                const src = new Box(a);
                const cv = new ConstBox(src);

                let seen = a - 1;
                const cleanup = withRoot(() => {
                    $effect(() => {
                        seen = cv.value;
                    });
                });
                flushSync();
                expect(seen).toBe(a);

                src.value = b;
                flushSync();
                expect(seen).toBe(b);

                cleanup();
            })
        );
    });
});

describe('ConstBox: property: isBox', () => {
    it('every const variant satisfies isBox', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(isBox(new ConstBox(v))).toBe(true);
                expect(isBox(new ConstFastBox(v))).toBe(true);
                expect(isBox(constbox(v))).toBe(true);
                expect(isBox(constfastbox(v))).toBe(true);
            })
        );
    });
});

describe('ConstBox: property: Box.const() borrows', () => {
    // `.const()` borrows the source cell so the view stays reactive.
    // This lets a `Box` pass into APIs that require a `ConstBox`.

    it('Box.const() reflects source updates', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const b = new Box(init);
                const cv = b.const();
                expect(cv.value).toBe(init);
                b.value = next;
                expect(cv.value).toBe(next);
            })
        );
    });

    it('FastBox.const() reflects source updates', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const b = new FastBox(init);
                const cv = b.const();
                expect(cv.value).toBe(init);
                b.value = next;
                expect(cv.value).toBe(next);
            })
        );
    });

    it('Box.const() rejects writes through the view', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const b = new Box(init);
                const cv = b.const();
                expect(() => {
                    (cv as unknown as { value: number }).value = next;
                }).toThrow(TypeError);
                expect(b.value).toBe(init);
            })
        );
    });

    it('FastBox.const() rejects writes through the view', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const b = new FastBox(init);
                const cv = b.const();
                expect(() => {
                    (cv as unknown as { value: number }).value = next;
                }).toThrow(TypeError);
                expect(b.value).toBe(init);
            })
        );
    });
});
