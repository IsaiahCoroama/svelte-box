import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isFunction, isObjectLike } from '../../src/lib/core/util.js';
import {
    BoxMixer,
    BoxGuardsMixin,
    BoxAccessorMixin,
    BoxCommonMixin
} from '../../src/lib/core/mixins.svelte.js';
import { MutCoreBox } from '../../src/lib/core/core.svelte.js';
import { Box, FastBox, ConstBox, ConstFastBox, isBox, box } from '../../src/lib/index.js';

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

describe('util: property: isFunction', () => {
    it('agrees with typeof === function', () => {
        fc.assert(
            fc.property(fc.anything(), (v) => {
                expect(isFunction(v)).toBe(typeof v === 'function');
            })
        );
    });

    it('returns true for all generated functions', () => {
        fc.assert(
            fc.property(fc.func(fc.integer()), (f) => {
                expect(isFunction(f)).toBe(true);
            })
        );
    });
});

describe('util: property: isObjectLike', () => {
    it('matches the formal definition', () => {
        fc.assert(
            fc.property(fc.anything(), (v) => {
                const expected = v !== null && (typeof v === 'object' || typeof v === 'function');
                expect(isObjectLike(v)).toBe(expected);
            })
        );
    });

    it('returns false for every primitive arbitrary', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(isObjectLike(v)).toBe(false);
            })
        );
    });
});

describe('mixins: property: BoxMixer composition', () => {
    // BoxMixer's variadic factory tuple widens to `BoxMixinFactory<unknown>`,
    // which is less specific than the per-mixin `BoxConstructor<BoxCell<T>>`
    // constraint, so the runtime call is fine but the call site needs a
    // local cast to satisfy the type checker.
    type AnyCtor = new (initial: unknown) => Record<string, unknown> & { value: unknown };
    const mix = BoxMixer as unknown as (Base: unknown, ...fns: unknown[]) => AnyCtor;

    it('produces a class whose instance.value matches the constructor arg', () => {
        const Composed = mix(MutCoreBox, BoxGuardsMixin, BoxAccessorMixin, BoxCommonMixin);
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(new Composed(v).value).toBe(v);
            })
        );
    });

    it('mixed-in guards behave on any inner type', () => {
        const Composed = mix(MutCoreBox, BoxGuardsMixin);
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                const inst = new Composed(v) as unknown as {
                    isString: () => boolean;
                    isNumber: () => boolean;
                    isNull: () => boolean;
                };
                expect(inst.isString()).toBe(typeof v === 'string');
                expect(inst.isNumber()).toBe(typeof v === 'number');
                expect(inst.isNull()).toBe(v === null);
            })
        );
    });

    it('mixed-in accessor: get matches value, set propagates', () => {
        const Composed = mix(MutCoreBox, BoxAccessorMixin);
        fc.assert(
            fc.property(fcPrimitive(), fcPrimitive(), (a, b) => {
                const inst = new Composed(a) as unknown as {
                    value: unknown;
                    get: () => unknown;
                    set: (v: unknown) => void;
                };
                expect(inst.get()).toBe(a);
                inst.set(b);
                expect(inst.get()).toBe(b);
                expect(inst.value).toBe(b);
            })
        );
    });
});

describe('isBox: property: every box subclass passes, nothing else does', () => {
    it('isBox is a stable invariant across constructors', () => {
        fc.assert(
            fc.property(fcPrimitive(), (v) => {
                expect(isBox(new Box(v))).toBe(true);
                expect(isBox(new FastBox(v))).toBe(true);
                expect(isBox(new ConstBox(v))).toBe(true);
                expect(isBox(new ConstFastBox(v))).toBe(true);
                expect(isBox(new MutCoreBox(v))).toBe(true);
            })
        );
    });

    it('non-box values never satisfy isBox', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.anything(),
                    fc.func(fc.integer()),
                    fc.constant(new Date()),
                    fc.constant(new Map())
                ),
                (v) => {
                    expect(isBox(v)).toBe(false);
                }
            )
        );
    });
});

describe('Box: property: toJSON parity with snapshot', () => {
    it('JSON.stringify(box) equals JSON.stringify(box.value)', () => {
        // Stays in string-space so that JSON's `-0 -> 0` normalization
        // applies to both sides identically.
        fc.assert(
            fc.property(fc.jsonValue(), (v) => {
                const b = box(v);
                expect(JSON.stringify(b)).toBe(JSON.stringify(b.value));
            })
        );
    });
});

describe('Box: property: freeze blocks writes', () => {
    it('isFrozen flips on freeze()', () => {
        fc.assert(
            fc.property(fc.integer(), (init) => {
                const b = box(init);
                expect(b.isFrozen()).toBe(false);
                b.freeze();
                expect(b.isFrozen()).toBe(true);
            })
        );
    });

    it('Box.value = ... throws after freeze and the value is preserved', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const b = box(init);
                b.freeze();
                expect(() => {
                    b.value = next;
                }).toThrow(TypeError);
                expect(b.value).toBe(init);
            })
        );
    });

    it('FastBox.value = ... throws after freeze', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const fb = new FastBox(init);
                fb.freeze();
                expect(() => {
                    fb.value = next;
                }).toThrow(TypeError);
                expect(fb.value).toBe(init);
            })
        );
    });

    it('Box forwarded writes throw after freeze (proxy trap)', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const b = box({ count: init });
                b.freeze();
                expect(() => {
                    (b as unknown as { count: number }).count = next;
                }).toThrow(TypeError);
                expect(b.value.count).toBe(init);
            })
        );
    });

    it('Box forwarded delete throws after freeze (proxy trap)', () => {
        fc.assert(
            fc.property(fc.integer(), (init) => {
                const b = box<{ a?: number; b?: number }>({ a: init, b: init });
                b.freeze();
                expect(() => {
                    delete (b as unknown as { a?: number }).a;
                }).toThrow(TypeError);
                expect(b.value.a).toBe(init);
            })
        );
    });

    it('Box.set() throws after freeze', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (init, next) => {
                const b = box(init);
                b.freeze();
                expect(() => b.set(next)).toThrow(TypeError);
                expect(b.value).toBe(init);
            })
        );
    });
});

describe('ConstFastBox: property: clone', () => {
    it('clone is structurally equal but a different reference', () => {
        fc.assert(
            fc.property(fc.dictionary(fc.string(), fc.integer()), (obj) => {
                fc.pre(Object.keys(obj).length > 0);
                const c = new ConstFastBox({ ...obj });
                const cloned = c.clone();
                expect(cloned).toEqual(c.snapshot());
                expect(cloned).not.toBe(c.value);
            })
        );
    });
});
