import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { Box, box, ConstBox, ConstFastBox, constbox, FastBox } from '../src/lib/index.js';
import { withRoot } from './_helpers.svelte.js';

class ConstTestPoint {
    constructor(
        public x: number,
        public y: number
    ) {}
}

describe('ConstBox: construction', () => {
    it('stores the initial value', () => {
        const c = new ConstBox(42);
        expect(c.value).toBe(42);
    });

    it('constbox() factory is equivalent to new ConstBox()', () => {
        const a = constbox('hi');
        const b = new ConstBox('hi');
        expect(a.value).toBe(b.value);
        expect(a).toBeInstanceOf(ConstBox);
    });

    it('shares state when constructed from a Box', () => {
        const src = new Box(1);
        const c = new ConstBox(src);
        expect(c.value).toBe(1);

        src.value = 2;
        expect(c.value).toBe(2);
    });

    it('captures a snapshot when constructed from a plain value', () => {
        const c = new ConstBox(5);
        expect(c.value).toBe(5);
    });
});

describe('ConstBox: read-only setter', () => {
    it('throws TypeError when writing through .value', () => {
        const c = new ConstBox(0);
        expect(() => {
            // @ts-expect-error runtime check
            c.value = 1;
        }).toThrow(TypeError);
    });

    it('preserves value after a failed write', () => {
        const c = new ConstBox(7);
        expect(() => {
            // @ts-expect-error runtime check
            c.value = 99;
        }).toThrow();
        expect(c.value).toBe(7);
    });
});

describe('ConstBox: reactivity', () => {
    it('tracks reads when sharing state with a Box', () => {
        const src = new Box(0);
        const c = new ConstBox(src);
        let observed = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = c.value;
            });
        });
        flushSync();
        expect(observed).toBe(0);

        src.value = 5;
        flushSync();
        expect(observed).toBe(5);

        cleanup();
    });

    it('Box.const() borrows the source so the view stays reactive', () => {
        const src = box(10);
        const view = src.const();
        expect(view.value).toBe(10);

        src.value = 20;
        expect(view.value).toBe(20);
    });

    it('Box.const() returns a proxy-backed ConstBox', () => {
        const src = box({ a: 1, b: 2 });
        const view = src.const();
        expect(view).toBeInstanceOf(ConstBox);
        expect(view.value).toEqual({ a: 1, b: 2 });
    });

    it('FastBox.const() returns a plain ConstFastBox', () => {
        const src = new FastBox(3);
        const view = src.const();
        expect(view).toBeInstanceOf(ConstFastBox);
        expect(view).not.toBeInstanceOf(ConstBox);
        expect(view.value).toBe(3);
    });
});

describe('ConstBox: proxy forwarding', () => {
    it('forwards inner-object property reads through the proxy', () => {
        const c = constbox({ name: 'Ada', age: 36 });
        expect((c as unknown as { name: string }).name).toBe('Ada');
        expect((c as unknown as { age: number }).age).toBe(36);
    });

    it('throws on writes through the proxy', () => {
        const c = constbox({ a: 1 });
        expect(() => {
            (c as unknown as { a: number }).a = 99;
        }).toThrow(TypeError);
    });

    it('callable inner functions remain callable, no writes allowed', () => {
        const c = constbox((x: number) => x + 1);
        expect((c as unknown as (n: number) => number)(2)).toBe(3);
    });

    it('throws on Object.defineProperty through the proxy', () => {
        const c = constbox<{ a?: number }>({ a: 1 });
        expect(() => {
            Object.defineProperty(c, 'b', { value: 2 });
        }).toThrow(TypeError);
    });

    it('throws on delete through the proxy', () => {
        const c = constbox<{ a?: number }>({ a: 1 });
        expect(() => {
            delete (c as unknown as { a?: number }).a;
        }).toThrow(TypeError);
    });
});

describe('ConstBox: proxy traps', () => {
    it('has trap reports own helpers, inner keys, and target prototype', () => {
        const c = constbox({ a: 1 });
        expect('value' in c).toBe(true);
        expect('a' in c).toBe(true);
        expect('missing' in c).toBe(false);
        expect('prototype' in c).toBe(true);
    });

    it('has trap on primitive inner returns false for absent keys', () => {
        const c = constbox(0);
        expect('foo' in c).toBe(false);
    });

    it('ownKeys reflects inner enumerable keys', () => {
        const c = constbox({ a: 1, b: 2 });
        expect(Object.keys(c).sort()).toEqual(['a', 'b']);
    });

    it('getOwnPropertyDescriptor routes own-keys through self and inner keys through inner', () => {
        const c = constbox({ a: 1 });
        expect(Object.getOwnPropertyDescriptor(c, 'value')).toBeUndefined();
        const dA = Object.getOwnPropertyDescriptor(c, 'a');
        expect(dA?.value).toBe(1);
        expect(dA?.configurable).toBe(true);
    });

    it('rejects Object.freeze (preventExtensions trap)', () => {
        const c = constbox({ a: 1 });
        expect(() => Object.freeze(c)).toThrow(TypeError);
    });

    it('rejects Object.setPrototypeOf', () => {
        const c = constbox({});
        expect(() => Object.setPrototypeOf(c, Array.prototype)).toThrow(TypeError);
    });

    it('apply trap throws when inner is not a function', () => {
        const c = constbox(42);
        expect(() => (c as unknown as () => void)()).toThrow(TypeError);
    });

    it('construct trap throws when inner is not a function', () => {
        const c = constbox(42);
        const Ctor = c as unknown as new () => unknown;
        expect(() => new Ctor()).toThrow(TypeError);
    });

    it('new on a boxed class constructs the inner', () => {
        const Boxed = constbox(ConstTestPoint);
        const Ctor = Boxed as unknown as new (x: number, y: number) => ConstTestPoint;
        const p = new Ctor(1, 2);
        expect(p).toBeInstanceOf(ConstTestPoint);
        expect(p.x).toBe(1);
    });

    it('forwarded methods on object inner have stable identity', () => {
        const c = constbox({ greet: () => 'hi' });
        const a = (c as unknown as { greet: () => string }).greet;
        const b = (c as unknown as { greet: () => string }).greet;
        expect(a).toBe(b);
        expect(a()).toBe('hi');
    });

    it('primitive inner does not forward primitive prototype methods', () => {
        const c = constbox('hi');
        expect((c as unknown as { toUpperCase?: () => string }).toUpperCase).toBeUndefined();
        expect(c.value.toUpperCase()).toBe('HI');
    });

    it('borrows when given a Box source and tracks writes to source', () => {
        const src = box({ n: 1 });
        const c = new ConstBox(src);
        expect(c.value.n).toBe(1);
        src.value.n = 5;
        expect(c.value.n).toBe(5);
    });
});

describe('ConstFastBox: behavior', () => {
    it('captures and reads through .value', () => {
        const c = new ConstFastBox({ x: 1 });
        expect(c.value).toEqual({ x: 1 });
    });

    it('borrows when given a CoreBox source', () => {
        const src = new FastBox(10);
        const c = new ConstFastBox(src);
        expect(c.value).toBe(10);
        src.value = 20;
        expect(c.value).toBe(20);
    });

    it('throws on .value write', () => {
        const c = new ConstFastBox(0);
        expect(() => {
            // @ts-expect-error runtime check
            c.value = 1;
        }).toThrow(TypeError);
    });

    it('does not forward inner-object reads (no proxy)', () => {
        const c = new ConstFastBox({ a: 1 });
        expect((c as unknown as { a?: number }).a).toBeUndefined();
    });
});

describe('ConstBox: helpers', () => {
    it('get() returns the value', () => {
        const c = new ConstBox('hello');
        expect(c.get()).toBe('hello');
    });

    it('toJSON returns the inner value', () => {
        const c = new ConstBox({ a: 1 });
        expect(JSON.parse(JSON.stringify(c))).toEqual({ a: 1 });
    });

    it('snapshot returns a deep clone', () => {
        const c = new ConstBox({ a: 1, b: { c: 2 } });
        const snap = c.snapshot();
        expect(snap).toEqual({ a: 1, b: { c: 2 } });
    });

    it('eager returns the current value', () => {
        const c = new ConstBox(9);
        expect(c.eager()).toBe(9);
    });
});

describe('ConstBox: type guards', () => {
    it('returns the right boolean for each guard', () => {
        expect(new ConstBox(1).isNumber()).toBe(true);
        expect(new ConstBox('a').isString()).toBe(true);
        expect(new ConstBox(true).isBoolean()).toBe(true);
        expect(new ConstBox(null).isNull()).toBe(true);
        expect(new ConstBox(undefined).isUndefined()).toBe(true);
        expect(new ConstBox(null).isNullish()).toBe(true);
        expect(new ConstBox(1).isPrimitive()).toBe(true);
        expect(new ConstBox({}).isObject()).toBe(true);
        expect(new ConstBox(() => 0).isObject()).toBe(false);
        expect(new ConstBox([]).isArray()).toBe(true);
        expect(new ConstBox(() => 0).isFunction()).toBe(true);
        expect(new ConstBox(new Map()).isMap()).toBe(true);
        expect(new ConstBox(new Set()).isSet()).toBe(true);
    });
});
