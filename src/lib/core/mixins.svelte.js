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

/**
 * Mix `freeze()`, `isFrozen()`, and a frozen-aware `.value` setter onto
 * `Base`. Freeze status is tracked on the wrapper rather than the inner
 * value because Svelte 5's `$state` proxy refuses `Object.freeze`
 * (`state_descriptors_fixed`). Once frozen:
 *
 * - `box.value = ...` throws `TypeError`.
 * - For `Box` (proxy-wrapped), forwarded writes also throw because the
 *   proxy traps call `self.isFrozen()`.
 * - For `FastBox` and `ConstFastBox` (no wrapper proxy), inner-property
 *   writes (`fb.value.x = ...`) are NOT blocked. Use `clone()` for a
 *   detached mutable copy or `box.const()` for a reactive read-only
 *   view if you need that boundary.
 *
 * The `#frozen` flag is `$state(...)` so reactive consumers of
 * `box.isFrozen()` re-run when freeze flips.
 */
export function BoxFreezableMixin(Base) {
    return class extends Base {
        #frozen = $state(false);

        freeze() {
            this.#frozen = true;
            return this;
        }

        isFrozen() {
            return this.#frozen;
        }

        get value() {
            return super.value;
        }

        set value(next) {
            if (this.#frozen) {
                throw new TypeError(
                    'Box is frozen. Reassigning .value is not allowed after freeze().'
                );
            }
            super.value = next;
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
