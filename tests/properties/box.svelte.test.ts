import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { flushSync } from 'svelte';
import { Box, box, FastBox, fastbox, isBox } from '../../src/lib/index.js';
import { withRoot } from '../_helpers.svelte.js';

// Primitive arbitrary that excludes -0/NaN-style oddities that defeat
// `toBe`. Booleans/strings/integers/bigints/symbols/null/undefined.
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

// Any JSON-safe value. Used for structural-equality assertions on
// `box.value` / `box.snapshot()`: Svelte's `$state` proxy roundtrips
// plain objects and arrays cleanly but loses identity on Map/Set/Date,
// so we stick to JSON values here. `__proto__` is excluded because
// $state's proxy treats it as a prototype write rather than an own
// data property, breaking the structural-equality predicate. Tests
// that only need typeof on the inner use `fc.anything()` directly.
function hasProtoKey(v: unknown): boolean {
    if (Array.isArray(v)) return v.some(hasProtoKey);
    if (v && typeof v === 'object') {
        for (const k of Object.keys(v)) {
            if (k === '__proto__') return true;
            if (hasProtoKey((v as Record<string, unknown>)[k])) return true;
        }
    }
    return false;
}
const fcAnyValue = () => fc.jsonValue().filter((v) => !hasProtoKey(v));

describe('Box: property: round-trip', () => {
    it('primitive set/get is identity', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                const b = new Box(v);
                expect(b.value).toBe(v);
            })
        );
    });

    it('primitive set after construction propagates', () => {
        fc.assert(
            fc.property(fcPrimitive(), fcPrimitive(), (a, b) => {
                const cell = new Box<unknown>(a);
                cell.value = b;
                expect(cell.value).toBe(b);
            })
        );
    });

    it('object set/get is structurally equal', () => {
        fc.assert(
            fc.property(fcAnyValue(), (v) => {
                const b = new Box(v);
                expect(b.value).toEqual(v);
            })
        );
    });

    it('box() factory matches new Box()', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(box(v).value).toBe(new Box(v).value);
            })
        );
    });

    it('FastBox primitive round-trip', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(new FastBox(v).value).toBe(v);
                expect(fastbox(v).value).toBe(v);
            })
        );
    });
});

describe('Box: property: isBox detection', () => {
    it('isBox is true for every factory', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(isBox(new Box(v))).toBe(true);
                expect(isBox(box(v))).toBe(true);
                expect(isBox(new FastBox(v))).toBe(true);
                expect(isBox(fastbox(v))).toBe(true);
            })
        );
    });

    it('isBox is false for any non-box value', () => {
        fc.assert(
            fc.property(fc.anything(), (v) => {
                expect(isBox(v)).toBe(false);
            })
        );
    });
});

describe('Box: property: snapshot', () => {
    it('snapshot of primitive is identity', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(new Box(v).snapshot()).toBe(v);
                expect(new FastBox(v).snapshot()).toBe(v);
            })
        );
    });

    it('snapshot is structurally equal to value', () => {
        fc.assert(
            fc.property(fcAnyValue(), (v) => {
                expect(new Box(v).snapshot()).toEqual(v);
                expect(new FastBox(v).snapshot()).toEqual(v);
            })
        );
    });

    it('JSON.stringify(box) matches JSON.stringify(snapshot)', () => {
        // Stick to JSON-safe values: no bigint, no undefined, no symbol.
        const jsonSafe = fc.jsonValue();
        fc.assert(
            fc.property(jsonSafe, (v) => {
                const b = box(v);
                expect(JSON.stringify(b)).toBe(JSON.stringify(b.snapshot()));
            })
        );
    });
});

describe('Box: property: type guards', () => {
    it('guards match typeof for primitive arbitraries', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                const b = new Box<unknown>(v);
                expect(b.isString()).toBe(typeof v === 'string');
                expect(b.isNumber()).toBe(typeof v === 'number');
                expect(b.isBoolean()).toBe(typeof v === 'boolean');
                expect(b.isBigInt()).toBe(typeof v === 'bigint');
                expect(b.isNull()).toBe(v === null);
                expect(b.isUndefined()).toBe(v === undefined);
                expect(b.isNullish()).toBe(v == null);
            })
        );
    });

    it('isPrimitive matches the classical predicate', () => {
        fc.assert(
            fc.property(fc.anything(), (v) => {
                const t = typeof v;
                const expected = v == null || (t !== 'object' && t !== 'function');
                expect(new Box<unknown>(v).isPrimitive()).toBe(expected);
            })
        );
    });

    it('isArray matches Array.isArray', () => {
        fc.assert(
            fc.property(fc.anything(), (v) => {
                expect(new Box<unknown>(v).isArray()).toBe(Array.isArray(v));
            })
        );
    });
});

describe('Box: property: array operations', () => {
    it('push then length increments by 1 and at(-1) matches', () => {
        fc.assert(
            fc.property(fc.array(fc.integer()), fc.integer(), (arr, x) => {
                const list = box([...arr]);
                const before = list.length as number;
                (list as unknown as number[]).push(x);
                expect(list.length).toBe(before + 1);
                expect((list as unknown as number[]).at(-1)).toBe(x);
            })
        );
    });

    it('pop returns last and shrinks by 1 when non-empty', () => {
        fc.assert(
            fc.property(fc.array(fc.integer(), { minLength: 1 }), (arr) => {
                const list = box([...arr]);
                const last = arr.at(-1);
                const popped = (list as unknown as number[]).pop();
                expect(popped).toBe(last);
                expect(list.length).toBe(arr.length - 1);
            })
        );
    });
});

describe('Box: property: function callability', () => {
    it('boxed function forwards arguments and return value', () => {
        fc.assert(
            fc.property(fc.array(fc.integer()), (args) => {
                const sum = (...xs: number[]) => xs.reduce((a, b) => a + b, 0);
                const b = box(sum);
                const expected = sum(...args);
                expect((b as unknown as (...xs: number[]) => number)(...args)).toBe(expected);
            })
        );
    });

    it('calling a non-function box throws TypeError', () => {
        // Filter functions; the proxy `apply` trap forwards instead of
        // throwing when the inner is callable.
        const nonCallable = fc.anything().filter((v) => typeof v !== 'function');
        fc.assert(
            fc.property(nonCallable, (v) => {
                const b = new Box<unknown>(v);
                expect(() => (b as unknown as () => void)()).toThrow(TypeError);
            })
        );
    });
});

describe('Box: property: reactivity through layers', () => {
    it('cross-function write propagates to effect observer', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const b = new Box(init);
                let seen = init - 1;
                const cleanup = withRoot(() => {
                    $effect(() => {
                        seen = b.value;
                    });
                });
                flushSync();
                expect(seen).toBe(init);

                const writer = (cell: Box<number>) => {
                    cell.value = next;
                };
                writer(b);
                flushSync();
                expect(seen).toBe(next);

                cleanup();
            })
        );
    });
});
