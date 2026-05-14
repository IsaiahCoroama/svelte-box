import { isFunction, isObjectLike } from '../utils.js';

// Shared dummy proxy target. Function so the proxy is callable and
// constructable when the inner value is a function or class. Never
// mutated; defensive traps below protect it across instances.
const PROXY_TARGET = function () {};

// Bound-method cache so forwarded function reads return stable
// references. Layout: WeakMap<inner, Map<prop, { source, bound }>>.
// `source` detects reassignment; WeakMap drops entries on inner GC.
const bindCache = new WeakMap();

/**
 * Bound version of `inner[prop]` if it is a function, cached so repeated
 * reads return the same reference. Identity matters for `{#each}` keying
 * and consumer memoization.
 *
 * @param {object | Function} inner
 * @param {string | symbol} prop
 * @param {unknown} source the freshly-read value of `inner[prop]`
 */
export function bindForwarded(inner, prop, source) {
    if (!isFunction(source)) return source;

    let perInner = bindCache.get(inner);
    if (!perInner) {
        perInner = new Map();
        bindCache.set(inner, perInner);
    }

    const entry = perInner.get(prop);
    if (entry && entry.source === source) return entry.bound;

    const bound = source.bind(inner);
    perInner.set(prop, { source, bound });
    return bound;
}

const EMPTY_SET = new Set();

/**
 * Build a Proxy wrapping `self` so reads forward to its inner value and
 * writes follow the chosen policy. Shared between `Box` (mutable) and
 * `ConstBox` (read-only). The caller's constructor should
 * `return buildBoxProxy(this, opts);` after `super(initial)`.
 *
 * @param {{ value: unknown } & Record<PropertyKey, unknown>} self the
 *   underlying box instance. Reads of own keys route to it; the proxy
 *   itself is returned from the constructor.
 * @param {object} [opts]
 * @param {boolean} [opts.readOnly=false] when true, every write trap
 *   throws `TypeError(opts.writeMessage)`. When false, writes route to
 *   `self` (own keys) or `self.value` (inner keys).
 * @param {Set<string|symbol>} [opts.forwardFirst] property names where
 *   the inner method should win over the box's own (e.g. `get`/`set`
 *   for `boxedMap` ergonomics).
 * @param {string} [opts.writeMessage] thrown by every write trap when
 *   `readOnly` is true.
 * @param {string} [opts.deleteOwnMessage] thrown when deleting an own
 *   helper key on a mutable box. Ignored under `readOnly`.
 * @param {string} [opts.preventExtensionsMessage] thrown by
 *   `preventExtensions` on both variants.
 * @param {string} [opts.setPrototypeOfMessage] thrown by
 *   `setPrototypeOf` on both variants.
 * @param {string} [opts.applyNonFunctionMessage] thrown by `apply` when
 *   the inner value is not a function.
 * @param {string} [opts.constructNonFunctionMessage] thrown by
 *   `construct` when the inner value is not a function.
 */
export function buildBoxProxy(self, opts = {}) {
    const {
        readOnly = false,
        forwardFirst = EMPTY_SET,
        writeMessage = 'Box is read-only.',
        deleteOwnMessage = `Cannot delete an own property of this Box. Use 'box.value = ...' instead.`,
        preventExtensionsMessage = 'Box does not support being made non-extensible. Apply Object.preventExtensions or Object.freeze to box.value instead.',
        setPrototypeOfMessage = 'Box does not support changing its prototype. Set the prototype of box.value directly if you need to change the inner value.',
        applyNonFunctionMessage = 'Box value is not a function',
        constructNonFunctionMessage = 'Box value is not a constructor'
    } = opts;

    // "Is this key owned by Box/subclass?" cache. Positives seeded at
    // construction, negatives filled on miss. Both retained for the
    // instance's lifetime, so methods added or removed after the first
    // read of a given key are not reflected.
    const ownCache = new Map();
    {
        let proto = self;
        while (proto && proto !== Object.prototype) {
            for (const k of Reflect.ownKeys(proto)) ownCache.set(k, true);
            proto = Object.getPrototypeOf(proto);
        }
    }

    /** @param {string | symbol} prop */
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

    const throwReadOnly = () => {
        throw new TypeError(writeMessage);
    };

    return new Proxy(PROXY_TARGET, {
        apply(_t, thisArg, args) {
            const inner = self.value;
            if (!isFunction(inner)) throw new TypeError(applyNonFunctionMessage);
            return Reflect.apply(inner, thisArg, args);
        },
        construct(_t, args, newTarget) {
            const inner = self.value;
            if (!isFunction(inner)) throw new TypeError(constructNonFunctionMessage);
            return Reflect.construct(inner, args, newTarget);
        },
        get(_t, prop) {
            if (forwardFirst.has(prop)) {
                const inner = self.value;
                if (isObjectLike(inner)) {
                    const m = Reflect.get(inner, prop);
                    if (typeof m === 'function') return bindForwarded(inner, prop, m);
                }
            }

            if (isOwn(prop)) return Reflect.get(self, prop);

            const inner = self.value;
            if (!isObjectLike(inner)) return undefined;

            return bindForwarded(inner, prop, Reflect.get(inner, prop));
        },
        set: readOnly
            ? throwReadOnly
            : (_t, prop, newValue) => {
                  if (isOwn(prop)) {
                      Reflect.set(self, prop, newValue);
                      return true;
                  }
                  const inner = self.value;
                  if (!isObjectLike(inner)) return false;
                  Reflect.set(inner, prop, newValue);
                  return true;
              },
        deleteProperty: readOnly
            ? throwReadOnly
            : (_t, prop) => {
                  if (isOwn(prop)) {
                      throw new TypeError(`${deleteOwnMessage} (property: '${String(prop)}')`);
                  }
                  const inner = self.value;
                  if (!isObjectLike(inner)) return false;
                  return Reflect.deleteProperty(inner, prop);
              },
        has(t, prop) {
            // Proxy invariant: report true for non-configurable own
            // keys of the target (e.g. `prototype` on a function).
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

            if (isOwn(prop)) return Reflect.getOwnPropertyDescriptor(self, prop);

            const inner = self.value;
            if (!isObjectLike(inner)) return undefined;

            const desc = Reflect.getOwnPropertyDescriptor(inner, prop);
            return desc ? { ...desc, configurable: true } : undefined;
        },
        defineProperty: readOnly
            ? throwReadOnly
            : (_t, prop, desc) => {
                  if (isOwn(prop)) return Reflect.defineProperty(self, prop, desc);
                  const inner = self.value;
                  if (!isObjectLike(inner)) return false;
                  return Reflect.defineProperty(inner, prop, desc);
              },
        preventExtensions() {
            throw new TypeError(preventExtensionsMessage);
        },
        setPrototypeOf() {
            throw new TypeError(setPrototypeOfMessage);
        },
        getPrototypeOf() {
            return Object.getPrototypeOf(self);
        }
    });
}
