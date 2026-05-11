import { isObjectLike } from './utils.js';

/**
 * Shared base class for `Box` and `FastBox`. Holds the reactive
 * `value` field plus every helper method and type guard. Both `Box` (the
 * Proxy variant) and `FastBox` (the plain variant) inherit from this.
 *
 * `BaseBox` itself is a usable container. It is exported so consumers can
 * type a function that accepts either subclass with `BaseBox<T>` instead of
 * `Box<T> | FastBox<T>`. Subclassing `BaseBox` directly is supported and
 * gives you something equivalent to `FastBox`.
 *
 * Helper methods and type guards live on the prototype rather than as
 * per-instance arrow fields so construction stays cheap. Reading detached
 * methods (e.g. `const g = box.get; g()`) loses `this` as a result; call
 * them on the box (`box.get()`) or wrap them yourself (`() => box.value`).
 */
export class BaseBox {
    value = $state();

    constructor(initial) {
        this.value = initial;
    }

    get() {
        return this.value;
    }
    set(value) {
        this.value = value;
    }
    // The `Box<number>` (T excludes undefined) call-site error is enforced at
    // the TypeScript level only, via the polymorphic `this` constraint in the
    // sibling `.d.ts`. JS callers and `as any` casts can still reach this
    // body and break the value type.
    del() {
        this.value = /** @type {any} */ (undefined);
    }

    snapshot() {
        return $state.snapshot(this.value);
    }
    eager() {
        return $state.eager(this.value);
    }

    // Without `toJSON`, `JSON.stringify(box)` returns the wrong thing for
    // both subclasses. Box: the proxy target is a function, so the result
    // is `undefined`. FastBox: serialization sees the class instance and
    // produces `'{"value":...}'` instead of the inner value. Returning
    // `this.value` makes both serialize as if the caller had passed
    // `box.value` directly.
    toJSON() {
        return this.value;
    }

    isBoolean() {
        return typeof this.value === 'boolean';
    }
    isNumber() {
        return typeof this.value === 'number';
    }
    isString() {
        return typeof this.value === 'string';
    }
    isBigInt() {
        return typeof this.value === 'bigint';
    }
    isSymbol() {
        return typeof this.value === 'symbol';
    }
    isUndefined() {
        return this.value === undefined;
    }
    isNull() {
        return this.value === null;
    }

    isNullish() {
        return this.value == null;
    }
    isPrimitive() {
        return !isObjectLike(this.value);
    }

    isObject() {
        return this.value !== null && typeof this.value === 'object';
    }
    isArray() {
        return Array.isArray(this.value);
    }
    isFunction() {
        return typeof this.value === 'function';
    }
    isMap() {
        return this.value instanceof Map;
    }
    isSet() {
        return this.value instanceof Set;
    }
}
