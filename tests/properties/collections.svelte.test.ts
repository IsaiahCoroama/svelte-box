import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    boxedMap,
    fastBoxedMap,
    constBoxedMap,
    constFastBoxedMap,
    boxedSet,
    fastBoxedSet,
    constBoxedSet,
    constFastBoxedSet
} from '../../src/lib/index.js';

describe('boxedMap/fastBoxedMap: property: Map round-trip', () => {
    const entries = () => fc.array(fc.tuple(fc.string(), fc.integer()), { maxLength: 50 });

    it('set then get returns the same value', () => {
        fc.assert(
            fc.property(entries(), fc.string(), fc.integer(), (init, k, v) => {
                const m = boxedMap<string, number>(init);
                (m as unknown as Map<string, number>).set(k, v);
                expect((m as unknown as Map<string, number>).get(k)).toBe(v);
            })
        );
    });

    it('size reflects number of unique keys', () => {
        fc.assert(
            fc.property(entries(), (init) => {
                const m = boxedMap<string, number>(init);
                const unique = new Map(init);
                expect((m as unknown as Map<string, number>).size).toBe(unique.size);
            })
        );
    });

    it('delete removes the key', () => {
        fc.assert(
            fc.property(entries(), (init) => {
                fc.pre(init.length > 0);
                const m = boxedMap<string, number>(init);
                const [firstKey] = init[0];
                const mm = m as unknown as Map<string, number>;
                mm.delete(firstKey);
                expect(mm.has(firstKey)).toBe(false);
            })
        );
    });

    it('clear empties the map', () => {
        fc.assert(
            fc.property(entries(), (init) => {
                const m = boxedMap<string, number>(init);
                (m as unknown as Map<string, number>).clear();
                expect((m as unknown as Map<string, number>).size).toBe(0);
            })
        );
    });

    it('fastBoxedMap matches boxedMap behavior via .value', () => {
        fc.assert(
            fc.property(entries(), fc.string(), fc.integer(), (init, k, v) => {
                const m = fastBoxedMap<string, number>(init);
                m.value.set(k, v);
                expect(m.value.get(k)).toBe(v);
            })
        );
    });
});

describe('constBoxedMap/constFastBoxedMap: property: read-only views', () => {
    it('get works through const view', () => {
        fc.assert(
            fc.property(fc.array(fc.tuple(fc.string(), fc.integer())), (init) => {
                // Dedupe so `[k, v]` reflects what the Map actually holds
                // (Map keeps the last value for repeated keys).
                const deduped = [...new Map(init)] as Array<[string, number]>;
                fc.pre(deduped.length > 0);
                const m = constBoxedMap<string, number>(deduped);
                const cfb = constFastBoxedMap<string, number>(deduped);
                const [k, v] = deduped[0];
                expect((m as unknown as Map<string, number>).get(k)).toBe(v);
                expect(cfb.value.get(k)).toBe(v);
            })
        );
    });
});

describe('boxedSet/fastBoxedSet: property: Set round-trip', () => {
    const values = () => fc.array(fc.integer(), { maxLength: 50 });

    it('add then has returns true', () => {
        fc.assert(
            fc.property(values(), fc.integer(), (init, x) => {
                const s = boxedSet<number>(init);
                (s as unknown as Set<number>).add(x);
                expect((s as unknown as Set<number>).has(x)).toBe(true);
            })
        );
    });

    it('size matches deduplicated input', () => {
        fc.assert(
            fc.property(values(), (init) => {
                const s = boxedSet<number>(init);
                const unique = new Set(init);
                expect((s as unknown as Set<number>).size).toBe(unique.size);
            })
        );
    });

    it('delete removes the value', () => {
        fc.assert(
            fc.property(values(), (init) => {
                fc.pre(init.length > 0);
                const s = boxedSet<number>(init);
                const ss = s as unknown as Set<number>;
                ss.delete(init[0]);
                expect(ss.has(init[0])).toBe(false);
            })
        );
    });

    it('fastBoxedSet behaves like boxedSet through .value', () => {
        fc.assert(
            fc.property(values(), fc.integer(), (init, x) => {
                const s = fastBoxedSet<number>(init);
                s.value.add(x);
                expect(s.value.has(x)).toBe(true);
            })
        );
    });

    it('iteration yields every member', () => {
        fc.assert(
            fc.property(values(), (init) => {
                const s = boxedSet<number>(init);
                const out: number[] = [];
                for (const v of s as unknown as Iterable<number>) out.push(v);
                expect(new Set(out)).toEqual(new Set(init));
            })
        );
    });
});

describe('constBoxedSet/constFastBoxedSet: property: read-only views', () => {
    it('has works through const view', () => {
        fc.assert(
            fc.property(fc.array(fc.integer(), { minLength: 1 }), (init) => {
                const s = constBoxedSet<number>(init);
                const cfb = constFastBoxedSet<number>(init);
                expect((s as unknown as Set<number>).has(init[0])).toBe(true);
                expect(cfb.value.has(init[0])).toBe(true);
            })
        );
    });
});
