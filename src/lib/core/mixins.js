import { isFunction } from './util.js';

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

export function BoxFreezableMixin(Base) {
    return class extends Base {
        freeze() {
            Object.freeze(this.value);
            return this;
        }
        isFrozen() {
            return Object.isFrozen(this.value);
        }
    };
}

export function BoxCloneableMixin(Base) {
    return class extends Base {
        clone() {
            // Unwrap reactive proxy first; structuredClone throws on Proxy.
            return structuredClone($state.snapshot(this.value));
        }
    };
}

export function BoxCommonMixin(Base) {
    return BoxSerializableMixin(BoxFreezableMixin(BoxCloneableMixin(Base)));
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

export function BoxMixer(Base, ...mixins) {
    return mixins.reduce((acc, m) => m(acc), Base);
}
