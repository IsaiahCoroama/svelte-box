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
 * Subclass-friendly setter handle, shared between the deep-state
 * `CoreBox` line and the raw-state `RawCoreBox` line. Each class
 * defines its own `[VALUE_SET]` method body so the access to the
 * private `#value` field type-checks in the class where the field is
 * declared. The mutable subclasses (`MutCoreBox` / `RawMutCoreBox`)
 * dispatch through `this[VALUE_SET]`, which prototype-resolves to the
 * right parent.
 *
 * Symbol-keyed (rather than a plain method name) so it does not
 * collide with user property names and stays out of normal
 * `for...in` / `Object.keys` enumerations.
 */
const VALUE_SET = Symbol('Box.value.set');

/**
 * Minimal deeply-reactive cell. Private `#value = $state()` field, so
 * mutations to nested fields of an inner object are tracked. Public
 * read-only `.value` accessor; writes are not exposed. Subclasses that
 * need a public setter extend {@link MutCoreBox}.
 *
 * Together with {@link RawCoreBox}, this is one of the two roots of
 * the project's box-class hierarchy. Use the `isBox` helper or the
 * `AnyBox<T>` type to accept either root generically.
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
 * Deeply-reactive cell with public `value` accessors. Adds a public
 * setter on top of {@link CoreBox}. The getter is redeclared because
 * defining a setter alone on a subclass produces a setter-only
 * property descriptor that shadows the parent getter and would make
 * reads return `undefined`.
 *
 * Subclasses can override `set value(next)` to validate or transform
 * incoming writes. Forward to `super.value = next` so the underlying
 * cell stays in sync.
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
 * Minimal raw-reactive cell. Private `#value = $state.raw()` field,
 * so the cell is reactive at the reassignment boundary but the
 * inner value is **not** deep-proxied. Reads of nested fields go
 * straight to the underlying object.
 *
 * Mirror of {@link CoreBox} for cases where deep tracking is unwanted
 * (snapshot-style captures, large opaque payloads). Sibling root of
 * the hierarchy: `AnyBox<T>` accepts a `RawCoreBox` or a `CoreBox`,
 * and `isBox` recognises both.
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
 * {@link MutCoreBox} but over the raw-state cell from
 * {@link RawCoreBox}. Same override pattern: define `set value(next)`
 * on a subclass and forward to `super.value = next` to keep the
 * underlying cell in sync.
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
 * Runtime guard for the `AnyBox<T>` type. True when `value` is an
 * instance of either root: {@link CoreBox} or {@link RawCoreBox}.
 * Every class in the library (and every user subclass following the
 * project invariant) inherits from one of these two roots, so this
 * check accepts every reactive-cell variant.
 */
export function isBox(value) {
    return value instanceof CoreBox || value instanceof RawCoreBox;
}
