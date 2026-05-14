import { isFunction } from './utils.js';

/** Mix the 14 type-guard methods onto `Base`. See `BoxGuards` in the d.ts. */
export function BoxGuardsMixin(Base) {
    return class extends Base {
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
            const t = typeof this.value;
            return this.value == null || (t !== 'object' && t !== 'function');
        }
        isObject() {
            return this.value !== null && typeof this.value === 'object';
        }
        isArray() {
            return Array.isArray(this.value);
        }
        isFunction() {
            return isFunction(this.value);
        }
        isMap() {
            return this.value instanceof Map;
        }
        isSet() {
            return this.value instanceof Set;
        }
    };
}

/** Mix `toJSON()` onto `Base` so `JSON.stringify(box)` returns the inner value. */
export function BoxSerializableMixin(Base) {
    return class extends Base {
        toJSON() {
            return this.value;
        }
    };
}

/** Mix the `get()` accessor onto `Base`. */
export function BoxGetterMixin(Base) {
    return class extends Base {
        get() {
            return this.value;
        }
    };
}

/** Mix the `set(value)` accessor onto `Base`. */
export function BoxSetterMixin(Base) {
    return class extends Base {
        set(value) {
            this.value = value;
        }
    };
}

/** Mix the `del()` accessor onto `Base`. Sets `value` to `undefined`. */
export function BoxDeleterMixin(Base) {
    return class extends Base {
        del() {
            this.value = undefined;
        }
    };
}

/** Compose getter, setter, and deleter mixins onto `Base`. */
export function BoxAccessorMixin(Base) {
    return BoxDeleterMixin(BoxSetterMixin(BoxGetterMixin(Base)));
}

/**
 * Subclass-friendly setter handle. Each root defines its own
 * `[VALUE_SET]` body so writes to the private `#value` field happen in
 * the class where the field is declared. Mutable subclasses dispatch
 * through `this[VALUE_SET]`, which prototype-resolves to the right
 * parent. Symbol-keyed so it stays out of `for...in` / `Object.keys`
 * enumerations.
 */
const VALUE_SET = Symbol('Box.value.set');

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

    [VALUE_SET](next) {
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
        this[VALUE_SET](next);
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

    [VALUE_SET](next) {
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
        this[VALUE_SET](next);
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
