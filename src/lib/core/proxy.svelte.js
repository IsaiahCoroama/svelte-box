import { BaseBox } from './base.svelte.js';
import { isFunction, isObjectLike } from './utils.js';

// Box helper method names that commonly collide with collection APIs.
// `get` and `set` are the only Box helpers that share a name with a
// reactive-collection method (Map.get/set). For these, the inner value's
// method takes priority so wrapping a Map/Set still works ergonomically.
// `Set.delete` is not listed because Box has no `delete` helper, so the
// normal forwarding path already routes through the inner Set.
//
// String-keyed only. If a future Box helper is renamed to a Symbol, this
// lookup misses and the inner method will not be preferred. Add the new
// key here if that ever happens.
const FORWARD_FIRST = new Set(['get', 'set']);

// Shared dummy proxy target. A function so the proxy is callable and
// constructable when the inner value is a function or class. We never mutate
// it, so it is safe to share across every Box instance. The defensive traps
// below (defineProperty, preventExtensions, setPrototypeOf) protect this
// shared target from being modified through any individual Box.
const PROXY_TARGET = function () {};

// Cache of inner-method bindings so `box.someMethod === box.someMethod`.
// Without this, every property read of a forwarded function would allocate
// a new bound function, breaking identity-based memoization and Svelte's
// keyed-each diffing.
//
// Layout: WeakMap<inner, Map<prop, { source, bound }>>. The `source` field
// detects when a method is reassigned on the inner so we rebind instead of
// returning a stale closure.
//
// Lifetime: entries drop when the inner object is garbage-collected, since
// the outer key is a WeakMap. Per-inner `Map` entries are never pruned,
// so identity is stable for the lifetime of each inner. `bindCache` is
// module-scoped, which means a module reload (Vite HMR) gives you a fresh
// cache. Identity guarantees hold within a single module instance.
const bindCache = new WeakMap();

/**
 * Return a bound version of `inner[prop]` if it's a function, cached so
 * repeated reads return the same reference.
 *
 * @param {object | Function} inner
 * @param {string | symbol} prop
 * @param {unknown} source the freshly-read value of `inner[prop]`
 */
function bindForwarded(inner, prop, source) {
    if (!isFunction(source)) return source;

    let perInner = bindCache.get(inner);
    if (!perInner) {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        perInner = new Map();
        bindCache.set(inner, perInner);
    }

    const entry = perInner.get(prop);
    if (entry && entry.source === source) return entry.bound;

    const bound = source.bind(inner);
    perInner.set(prop, { source, bound });
    return bound;
}

export class Box extends BaseBox {
    constructor(initial) {
        super(initial);

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        // Cache of "is this key owned by Box/subclass?" answers. Seeded by
        // walking the prototype chain once at construction so we catch class
        // fields, prototype methods, and any accessors Svelte installs for
        // $state. We stop before Object.prototype so toString,
        // hasOwnProperty, and friends still forward to the inner value.
        //
        // Negatives are cached on first miss so forwarded property reads
        // (`bx.a`, `bx.length`) do not re-walk the prototype chain every
        // time. Both positives and negatives are cached for the lifetime
        // of the Box: methods added or removed from the prototype after
        // the first read of a given key will not be reflected. This is the
        // documented trade-off for keeping the forwarding hot path cheap.
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const ownCache = new Map();
        {
            let proto = self;
            while (proto && proto !== Object.prototype) {
                for (const k of Reflect.ownKeys(proto)) ownCache.set(k, true);
                proto = Object.getPrototypeOf(proto);
            }
        }

        const isOwn = (prop) => {
            const cached = ownCache.get(prop);
            if (cached !== undefined) return cached;

            let proto = Object.getPrototypeOf(self);
            while (proto && proto !== Object.prototype) {
                if (Object.prototype.hasOwnProperty.call(proto, prop)) {
                    ownCache.set(prop, true);
                    return true;
                }
                proto = Object.getPrototypeOf(proto);
            }
            ownCache.set(prop, false);
            return false;
        };

        return new Proxy(PROXY_TARGET, {
            apply(_t, thisArg, args) {
                const inner = self.value;
                if (!isFunction(inner)) {
                    throw new TypeError('Box value is not a function');
                }
                return Reflect.apply(inner, thisArg, args);
            },
            construct(_t, args, newTarget) {
                const inner = self.value;
                if (!isFunction(inner)) {
                    throw new TypeError('Box value is not a constructor');
                }
                return Reflect.construct(inner, args, newTarget);
            },
            get(_t, prop) {
                // Collision-prone names: prefer inner's method when it's callable
                // so e.g. `boxedMap.set(k, v)` invokes SvelteMap.set instead of
                // Box's generic setter.
                if (FORWARD_FIRST.has(prop)) {
                    const inner = self.value;
                    if (isObjectLike(inner) && typeof inner[prop] === 'function') {
                        return bindForwarded(inner, prop, inner[prop]);
                    }
                }

                if (isOwn(prop)) return self[prop];

                const inner = self.value;
                if (!isObjectLike(inner)) return undefined;

                return bindForwarded(inner, prop, inner[prop]);
            },
            set(_t, prop, newValue) {
                if (isOwn(prop)) {
                    self[prop] = newValue;
                    return true;
                }

                const inner = self.value;
                if (!isObjectLike(inner)) return false;

                inner[prop] = newValue;
                return true;
            },
            deleteProperty(_t, prop) {
                if (isOwn(prop)) {
                    throw new TypeError(
                        `Cannot delete Box's own property '${String(prop)}'. ` +
                            `Use 'box.value = undefined' to clear (when T allows undefined), ` +
                            `or assign a different value through 'box.value = ...'.`
                    );
                }

                const inner = self.value;
                if (!isObjectLike(inner)) return false;

                return Reflect.deleteProperty(inner, prop);
            },
            has(t, prop) {
                // Invariant: must report true for non-configurable own keys of the
                // target (e.g. `prototype` on a function target).
                const td = Reflect.getOwnPropertyDescriptor(t, prop);
                if (td && !td.configurable) return true;

                if (isOwn(prop)) return true;

                const inner = self.value;
                return isObjectLike(inner) && prop in inner;
            },
            ownKeys(t) {
                const inner = self.value;
                const keys = isObjectLike(inner) ? Reflect.ownKeys(inner).slice() : [];

                for (const k of Reflect.ownKeys(t)) {
                    const d = Reflect.getOwnPropertyDescriptor(t, k);
                    if (d && !d.configurable && !keys.includes(k)) keys.push(k);
                }
                return keys;
            },
            getOwnPropertyDescriptor(t, prop) {
                const td = Reflect.getOwnPropertyDescriptor(t, prop);
                if (td && !td.configurable) return td;

                if (isOwn(prop)) {
                    return Reflect.getOwnPropertyDescriptor(self, prop);
                }

                const inner = self.value;
                if (!isObjectLike(inner)) return undefined;

                const desc = Reflect.getOwnPropertyDescriptor(inner, prop);
                return desc ? { ...desc, configurable: true } : undefined;
            },
            defineProperty(_t, prop, desc) {
                // Route definitions to self or inner, never to the shared target.
                if (isOwn(prop)) {
                    return Reflect.defineProperty(self, prop, desc);
                }
                const inner = self.value;
                if (!isObjectLike(inner)) return false;
                return Reflect.defineProperty(inner, prop, desc);
            },
            preventExtensions() {
                // The shared target must stay extensible so other Boxes are not
                // affected. Throw with a clear message rather than letting strict
                // mode surface the generic "trap returned falsish" TypeError.
                throw new TypeError(
                    'Box does not support being made non-extensible. Apply ' +
                        'Object.preventExtensions or Object.freeze to box.value instead.'
                );
            },
            setPrototypeOf() {
                // Prevent reassigning the proxy's prototype, which would either
                // mutate the shared target or violate proxy invariants. If you
                // need to change the prototype of the inner value, do it on
                // box.value directly.
                throw new TypeError(
                    'Box does not support changing its prototype. Set the prototype ' +
                        'of box.value directly if you need to change the inner value.'
                );
            },
            getPrototypeOf() {
                return Object.getPrototypeOf(self);
            }
        });
    }
}

export function box(initial) {
    return new Box(initial);
}
