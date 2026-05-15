/**
 * Subclass-friendly setter handle. Each root defines its own
 * `[SET_VALUE]` body so writes to the private `#value` field happen in
 * the class where the field is declared. Mutable subclasses dispatch
 * through `this[SET_VALUE]`, which prototype-resolves to the right
 * parent. Symbol-keyed so it stays out of `for...in` / `Object.keys`
 * enumerations.
 */
const SET_VALUE = Symbol('Box.value.set');

/**
 * Minimal deeply-reactive cell. Private `#value = $state()`, so
 * mutations to nested fields of an inner object are tracked. Public
 * read-only `.value` accessor. Subclasses that need a public setter
 * extend {@link MutCoreBox}.
 *
 * One of two roots of the box-class hierarchy (sibling: {@link RawCoreBox}).
 * Use {@link isBox} or the `AnyBox<T>` type to accept either generically.
 */
export class CoreBox {
    #value = $state();

    constructor(initial) {
        this.#value = initial;
    }

    get value() {
        return this.#value;
    }

    [SET_VALUE](next) {
        this.#value = next;
    }
}

/**
 * Deeply-reactive cell with public `value` accessors. Adds a setter on
 * top of {@link CoreBox}. The getter is redeclared because a setter
 * alone produces a setter-only descriptor that shadows the parent
 * getter, making reads return `undefined`.
 *
 * Override seam: subclasses can define `set value(next)` to validate or
 * transform writes; forward to `super.value = next` to keep the cell in
 * sync.
 */
export class MutCoreBox extends CoreBox {
    get value() {
        return super.value;
    }

    set value(next) {
        this[SET_VALUE](next);
    }
}

/**
 * Minimal raw-reactive cell. Private `#value = $state.raw()`: reactive
 * at the reassignment boundary, but the inner value is **not** deep
 * proxied. Reads of nested fields go straight to the underlying object.
 *
 * Mirror of {@link CoreBox} for cases where deep tracking is unwanted
 * (snapshot-style captures, large opaque payloads). Sibling root:
 * `AnyBox<T>` accepts either, and `isBox` recognises both.
 */
export class RawCoreBox {
    #value = $state.raw();

    constructor(initial) {
        this.#value = initial;
    }

    get value() {
        return this.#value;
    }

    [SET_VALUE](next) {
        this.#value = next;
    }
}

/**
 * Raw-reactive cell with public `value` accessors. Mirror of
 * {@link MutCoreBox} over the raw cell from {@link RawCoreBox}. Same
 * override seam: define `set value(next)` and forward to
 * `super.value = next`.
 */
export class RawMutCoreBox extends RawCoreBox {
    get value() {
        return super.value;
    }

    set value(next) {
        this[SET_VALUE](next);
    }
}

/**
 * Runtime guard for `AnyBox<T>`. True when `value` inherits from either
 * root, {@link CoreBox} or {@link RawCoreBox}, so it accepts every
 * reactive-cell variant in the library plus user subclasses that follow
 * the project invariant.
 */
export function isBox(value) {
    return value instanceof CoreBox || value instanceof RawCoreBox;
}
