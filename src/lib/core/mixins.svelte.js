import { isFunction } from './util.js';

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

export function BoxSerializableMixin(Base) {
    return class extends Base {
        toJSON() {
            return this.value;
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
    return BoxSerializableMixin(BoxCloneableMixin(Base));
}

export function BoxGetterMixin(Base) {
    return class extends Base {
        get() {
            return this.value;
        }
    };
}

export function BoxSetterMixin(Base) {
    return class extends Base {
        set(value) {
            this.value = value;
        }
    };
}

export function BoxDeleterMixin(Base) {
    return class extends Base {
        del() {
            this.value = undefined;
        }
    };
}

export function BoxAccessorMixin(Base) {
    return BoxDeleterMixin(BoxSetterMixin(BoxGetterMixin(Base)));
}

export function BoxMixer(Base, ...mixins) {
    return mixins.reduce((acc, m) => m(acc), Base);
}
