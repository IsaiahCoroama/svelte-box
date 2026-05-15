// Symbol-keyed write seam. Each root defines its own `[SET_VALUE]` body
// so writes hit the private `#value` field in the class that declared
// it. Mutable subclasses dispatch through `this[SET_VALUE]` so the
// prototype chain picks the right parent. Symbol key keeps it out of
// `for...in` / `Object.keys` enumeration.
const SET_VALUE = Symbol('Box.value.set');

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

// `MutCoreBox` redeclares the getter because a setter-only descriptor
// would shadow the parent's getter and reads would return `undefined`.
export class MutCoreBox extends CoreBox {
    get value() {
        return super.value;
    }

    set value(next) {
        this[SET_VALUE](next);
    }
}

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

export class RawMutCoreBox extends RawCoreBox {
    get value() {
        return super.value;
    }

    set value(next) {
        this[SET_VALUE](next);
    }
}

export function isBox(value) {
    return value instanceof CoreBox || value instanceof RawCoreBox;
}
