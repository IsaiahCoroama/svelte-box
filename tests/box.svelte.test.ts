import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { Box, box } from '../src/lib/index.js';
import { withRoot } from './_helpers.svelte.js';

class MyBox<T> extends Box<T> {
    extra() {
        return 'sub';
    }
}

class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Counter {
    count = 0;
    inc() {
        this.count += 1;
    }
    read() {
        return this.count;
    }
}

class Service {
    constructor(public counter: Box<number>) {}
    tick() {
        this.counter.value += 1;
    }
}

describe('Box: construction', () => {
    it('stores the initial value', () => {
        const b = new Box(42);
        expect(b.value).toBe(42);
    });

    it('stores undefined when no initial value is given via the factory', () => {
        const b = new Box(undefined);
        expect(b.value).toBeUndefined();
    });

    it('box() factory is equivalent to new Box()', () => {
        const a = box('hi');
        const b = new Box('hi');
        expect(a.value).toBe(b.value);
    });

    it('box instanceof Box is true', () => {
        expect(new Box(0) instanceof Box).toBe(true);
        expect(box({}) instanceof Box).toBe(true);
    });

    it('subclass instanceof works', () => {
        const b = new MyBox(1);
        expect(b instanceof MyBox).toBe(true);
        expect(b instanceof Box).toBe(true);
        expect(b.extra()).toBe('sub');
    });
});

describe('Box: primitive reactivity', () => {
    it('tracks reads of the value', () => {
        const b = new Box(0);
        let observed = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = b.value;
            });
        });
        flushSync();
        expect(observed).toBe(0);

        b.value = 5;
        flushSync();
        expect(observed).toBe(5);

        b.value = 10;
        flushSync();
        expect(observed).toBe(10);

        cleanup();
    });

    it('tracks reactivity through a function boundary', () => {
        const count = new Box(0);
        let observed = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = count.value;
            });
        });
        flushSync();

        function increment(b: Box<number>) {
            b.value += 1;
        }

        increment(count);
        flushSync();
        expect(observed).toBe(1);

        increment(count);
        increment(count);
        flushSync();
        expect(observed).toBe(3);

        cleanup();
    });

    it('works for strings, booleans, bigints, and symbols', () => {
        const s = new Box('a');
        const bool = new Box(true);
        const big = new Box(1n);
        const sym = new Box(Symbol('x'));

        expect(s.value).toBe('a');
        s.value = 'b';
        expect(s.value).toBe('b');

        bool.value = false;
        expect(bool.value).toBe(false);

        big.value = 2n;
        expect(big.value).toBe(2n);

        const next = Symbol('y');
        sym.value = next;
        expect(sym.value).toBe(next);
    });
});

describe('Box: object reactivity and forwarding', () => {
    it('forwards property reads to the inner object', () => {
        const user = box({ name: 'Ada', age: 36 });
        expect(user.name).toBe('Ada');
        expect(user.age).toBe(36);
        expect(user.value.name).toBe('Ada');
    });

    it('forwarded property writes are reactive', () => {
        const user = box({ name: 'Ada', age: 36 });
        let observed = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = user.age;
            });
        });
        flushSync();
        expect(observed).toBe(36);

        user.age = 37;
        flushSync();
        expect(observed).toBe(37);

        cleanup();
    });

    it('reassigning value swaps the inner object reactively', () => {
        const u = box({ name: 'Ada' });
        let observed = '';

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = u.value.name;
            });
        });
        flushSync();
        expect(observed).toBe('Ada');

        u.value = { name: 'Grace' };
        flushSync();
        expect(observed).toBe('Grace');

        cleanup();
    });

    it('deletes through the proxy reflect on the inner object', () => {
        const u = box<{ a?: number; b?: number }>({ a: 1, b: 2 });
        delete u.a;
        expect(u.a).toBeUndefined();
        expect(u.b).toBe(2);
    });

    it('Object.keys reflects inner enumerable keys', () => {
        const u = box({ a: 1, b: 2 });
        expect(Object.keys(u).sort()).toEqual(['a', 'b']);
    });
});

describe('Box: array reactivity', () => {
    it('forwards push and indexed access', () => {
        const list = box([1, 2, 3]);
        expect(list.length).toBe(3);
        expect(list[0]).toBe(1);

        list.push(4);
        expect(list.length).toBe(4);
        expect(list[3]).toBe(4);
    });

    it('mutations are reactive', () => {
        const list = box<number[]>([1, 2, 3]);
        let len = 0;
        let first = 0;

        const cleanup = withRoot(() => {
            $effect(() => {
                len = list.length;
                first = list[0];
            });
        });
        flushSync();
        expect(len).toBe(3);
        expect(first).toBe(1);

        list.push(4);
        flushSync();
        expect(len).toBe(4);

        list[0] = 99;
        flushSync();
        expect(first).toBe(99);

        cleanup();
    });

    it('iterates with for...of', () => {
        const list = box([10, 20, 30]);
        const out: number[] = [];
        for (const x of list as unknown as number[]) {
            out.push(x);
        }
        expect(out).toEqual([10, 20, 30]);
    });
});

describe('Box: function callability', () => {
    it('invoking the box calls the inner function', () => {
        const greet = box((name: string) => `hi, ${name}`);
        expect(greet('world')).toBe('hi, world');
    });

    it('reassigning the function changes the call result', () => {
        const fn = box((x: number) => x + 1);

        expect(fn(1)).toBe(2);

        fn.value = (x: number) => x * 10;
        expect(fn(2)).toBe(20);
    });

    it('new on a boxed class constructs the inner', () => {
        const Boxed = box(Point);
        // `new` on a Boxed class needs a cast because `ForwardShape<T>` only
        // projects the call signature, not the construct signature.
        const Ctor = Boxed as unknown as new (x: number, y: number) => Point;
        const p = new Ctor(1, 2);
        expect(p).toBeInstanceOf(Point);
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });

    it('throws TypeError when calling a non-function box', () => {
        const b = box(42);
        // Box<number> has no callable shape, so the cast is required to express
        // the runtime check that calling such a box throws.
        expect(() => (b as unknown as () => void)()).toThrow(TypeError);
    });
});

describe('Box: class instance forwarding', () => {
    it('forwards methods bound to the inner instance', () => {
        const c = box(new Counter());
        c.inc();
        c.inc();
        expect(c.read()).toBe(2);
        expect(c.value.count).toBe(2);
    });
});

describe('Box: type guards', () => {
    it('returns the right boolean for each guard', () => {
        expect(new Box(1).isNumber()).toBe(true);
        expect(new Box('a').isString()).toBe(true);
        expect(new Box(true).isBoolean()).toBe(true);
        expect(new Box(1n).isBigInt()).toBe(true);
        expect(new Box(Symbol()).isSymbol()).toBe(true);
        expect(new Box(undefined).isUndefined()).toBe(true);
        expect(new Box(null).isNull()).toBe(true);

        expect(new Box(null).isNullish()).toBe(true);
        expect(new Box(undefined).isNullish()).toBe(true);
        expect(new Box(1).isNullish()).toBe(false);

        expect(new Box(1).isPrimitive()).toBe(true);
        expect(new Box({}).isPrimitive()).toBe(false);

        expect(new Box({}).isObject()).toBe(true);
        expect(new Box(null).isObject()).toBe(false);

        expect(new Box([]).isArray()).toBe(true);
        expect(new Box({}).isArray()).toBe(false);

        expect(new Box(() => 0).isFunction()).toBe(true);
        expect(new Box(1).isFunction()).toBe(false);

        expect(new Box(new Map()).isMap()).toBe(true);
        expect(new Box(new Set()).isSet()).toBe(true);
    });

    it('updates reactively as the value changes type', () => {
        const b = new Box<unknown>(1);
        let n = false;
        let s = false;

        const cleanup = withRoot(() => {
            $effect(() => {
                n = b.isNumber();
                s = b.isString();
            });
        });
        flushSync();
        expect(n).toBe(true);
        expect(s).toBe(false);

        b.value = 'hello';
        flushSync();
        expect(n).toBe(false);
        expect(s).toBe(true);

        cleanup();
    });
});

describe('Box: get / set / del helpers', () => {
    it('get and set on a primitive box update value reactively', () => {
        const b = new Box(0);
        let observed = -1;
        const cleanup = withRoot(() => {
            $effect(() => {
                observed = b.get();
            });
        });
        flushSync();
        expect(observed).toBe(0);

        b.set(42);
        flushSync();
        expect(observed).toBe(42);

        cleanup();
    });

    it('del resets the value to undefined', () => {
        const b = new Box<number | undefined>(5);
        b.del();
        expect(b.value).toBeUndefined();
    });
});

describe('Box: deep nesting and complex types', () => {
    it('tracks deeply nested object mutations', () => {
        const tree = box({
            user: {
                profile: {
                    settings: { theme: 'light' as 'light' | 'dark' }
                }
            }
        });

        let observed = '';
        const cleanup = withRoot(() => {
            $effect(() => {
                observed = tree.value.user.profile.settings.theme;
            });
        });
        flushSync();
        expect(observed).toBe('light');

        tree.value.user.profile.settings.theme = 'dark';
        flushSync();
        expect(observed).toBe('dark');

        cleanup();
    });

    it('handles arrays of objects with reactive item mutations', () => {
        const list = box([
            { id: 1, name: 'a' },
            { id: 2, name: 'b' }
        ]);

        let firstName = '';
        const cleanup = withRoot(() => {
            $effect(() => {
                firstName = list.value[0]?.name ?? '';
            });
        });
        flushSync();
        expect(firstName).toBe('a');

        list.value[0].name = 'A';
        flushSync();
        expect(firstName).toBe('A');

        cleanup();
    });

    it('integrates with $derived', () => {
        const a = new Box(2);
        const b = new Box(3);

        let product = 0;
        const cleanup = withRoot(() => {
            const p = $derived(a.value * b.value);
            $effect(() => {
                product = p;
            });
        });
        flushSync();
        expect(product).toBe(6);

        a.value = 5;
        flushSync();
        expect(product).toBe(15);

        b.value = 10;
        flushSync();
        expect(product).toBe(50);

        cleanup();
    });

    it('survives type changes through value reassignment', () => {
        const b = new Box<unknown>(1);
        expect(b.isNumber()).toBe(true);

        b.value = 'hi';
        expect(b.isString()).toBe(true);

        b.value = [1, 2, 3];
        expect(b.isArray()).toBe(true);

        b.value = { a: 1 };
        expect(b.isObject()).toBe(true);

        b.value = () => 0;
        expect(b.isFunction()).toBe(true);
    });
});

describe('Box: closures and stable identity', () => {
    it('a boxed function preserves its closure over re-reads', () => {
        let counter = 0;
        const fn = box(() => ++counter);

        expect(fn()).toBe(1);
        expect(fn()).toBe(2);
        expect(fn()).toBe(3);
    });

    it('forwarded methods on a plain object have stable identity', () => {
        const obj = {
            counter: 0,
            increment() {
                this.counter += 1;
            }
        };
        const b = box(obj);

        const a = b.increment;
        const c = b.increment;
        expect(a).toBe(c);
    });

    it('rebinds when the underlying method is reassigned', () => {
        const obj: { fn: () => string } = { fn: () => 'first' };
        const b = box(obj);

        const before = b.fn;
        expect(before()).toBe('first');

        b.value.fn = () => 'second';
        const after = b.fn;

        expect(after).not.toBe(before);
        expect(after()).toBe('second');
    });
});

describe('Box: interop with built-in JS APIs', () => {
    it('JSON.stringify of an object box returns the inner data', () => {
        const u = box({ name: 'Ada', age: 36 });
        const json = JSON.stringify(u);
        expect(JSON.parse(json)).toEqual({ name: 'Ada', age: 36 });
    });

    it('structuredClone works on box.snapshot()', () => {
        const u = box({ a: 1, b: { c: 2 } });
        const cloned = structuredClone(u.snapshot());
        expect(cloned).toEqual({ a: 1, b: { c: 2 } });
    });

    it('structuredClone of a Box throws because the proxy target is a function', () => {
        // Documents the README caveat: pass `box.value` or `box.snapshot()` to
        // structuredClone, never the Box itself. The pattern matches the Node
        // (`could not be cloned`) and the browser (`DataCloneError`) phrasings
        // so a future regression that throws for an unrelated reason still
        // fails this test.
        expect(() => structuredClone(box({ a: 1 }))).toThrow(/cloned|DataCloneError/i);
        expect(() => structuredClone(new Box(0))).toThrow(/cloned|DataCloneError/i);
    });

    it('refuses Object.freeze through the proxy', () => {
        const b = box({ a: 1 });
        expect(() => Object.freeze(b)).toThrow(TypeError);
    });

    it('refuses Object.setPrototypeOf through the proxy', () => {
        const b = box({});
        expect(() => Object.setPrototypeOf(b, Array.prototype)).toThrow(TypeError);
    });

    it('Object.defineProperty routes to the inner object', () => {
        const b = box<Record<string, unknown>>({ a: 1 });
        Object.defineProperty(b, 'b', {
            value: 2,
            writable: true,
            enumerable: true,
            configurable: true
        });
        expect(b.value.b).toBe(2);
    });

    it('throws when deleting box own properties', () => {
        const b = box(0);
        expect(() => {
            // @ts-expect-error testing runtime behavior
            delete b.value;
        }).toThrow(TypeError);
        expect(() => {
            // @ts-expect-error testing runtime behavior
            delete b.set;
        }).toThrow(TypeError);
        expect(() => {
            // @ts-expect-error testing runtime behavior
            delete b.snapshot;
        }).toThrow(TypeError);
        expect(() => {
            // @ts-expect-error testing runtime behavior
            delete b.isNumber;
        }).toThrow(TypeError);
    });
});

describe('Box: snapshot', () => {
    it('returns a deep-cloned plain object', () => {
        const u = box({ name: 'Ada', nested: { age: 36 } });
        const snap = u.snapshot();

        expect(snap).toEqual({ name: 'Ada', nested: { age: 36 } });
        // Mutating the snapshot does not affect the box
        snap.nested.age = 99;
        expect(u.value.nested.age).toBe(36);
    });

    it('returns primitive values as-is', () => {
        const n = new Box(42);
        expect(n.snapshot()).toBe(42);

        const s = new Box('hi');
        expect(s.snapshot()).toBe('hi');
    });

    it('reflects the current value at call time', () => {
        const b = box({ count: 0 });
        expect(b.snapshot().count).toBe(0);
        b.count = 5;
        expect(b.snapshot().count).toBe(5);
    });

    it('JSON.stringify works on the snapshot', () => {
        const u = box({ name: 'Ada' });
        expect(JSON.stringify(u.snapshot())).toBe('{"name":"Ada"}');
    });
});

describe('Box: eager', () => {
    it('returns the current value', () => {
        const b = new Box(7);
        expect(b.eager()).toBe(7);

        b.value = 9;
        expect(b.eager()).toBe(9);
    });

    it('returns objects directly', () => {
        const u = box({ name: 'Ada' });
        const eager = u.eager();
        expect(eager.name).toBe('Ada');
    });
});

describe('Box: cross-boundary reactivity', () => {
    it('survives being passed through multiple functions', () => {
        const b = new Box(0);
        let observed = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = b.value;
            });
        });
        flushSync();

        const layer1 = (x: Box<number>) => layer2(x);
        const layer2 = (x: Box<number>) => layer3(x);
        const layer3 = (x: Box<number>) => {
            x.value += 10;
        };

        layer1(b);
        flushSync();
        expect(observed).toBe(10);

        layer1(b);
        flushSync();
        expect(observed).toBe(20);

        cleanup();
    });

    it('survives being stored on a class instance', () => {
        const counter = new Box(0);
        const svc = new Service(counter);
        let observed = -1;

        const cleanup = withRoot(() => {
            $effect(() => {
                observed = counter.value;
            });
        });
        flushSync();
        expect(observed).toBe(0);

        svc.tick();
        svc.tick();
        flushSync();
        expect(observed).toBe(2);

        cleanup();
    });
});
