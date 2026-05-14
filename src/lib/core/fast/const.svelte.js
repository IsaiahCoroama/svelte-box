import {
    BoxGetterMixin,
    BoxGuardsMixin,
    BoxSerializableMixin,
    RawCoreBox,
    isBox
} from '../core.svelte.js';

const _Mixins = BoxGuardsMixin(BoxSerializableMixin(BoxGetterMixin(RawCoreBox)));

/**
 * Read-only reactive view of a value. Plain class, no Proxy. Reach
 * inner-object properties through `.value`. Wraps either a plain value
 * (captured into a fresh internal cell) or an existing {@link AnyBox}
 * (shared state with the source). Writes through `.value` throw
 * `TypeError`.
 *
 * `ConstFastBox` is the read-only counterpart to `FastBox`: same
 * `.value`-only access pattern, but with mutation rejected at the
 * accessor. The companion class {@link ConstBox} adds a read-only
 * Proxy that forwards inner-object reads the way `Box` does.
 *
 * Storage is `$state.raw` (inherited from {@link RawCoreBox}). The
 * contract is "snapshot of reference, not live view": if the caller
 * mutates a captured object through an external reference, those
 * mutations are not amplified into reactive updates here. Use the
 * borrow-mode constructor (pass an `AnyBox`) for shared, live
 * reactivity instead.
 *
 * Inherits from `RawCoreBox`, so `isBox(constFast)` is true and the
 * `AnyBox<T>` type accepts a `ConstFastBox` like any other reactive
 * cell.
 *
 * Use `fastbox.const()` to derive a const view from a `FastBox`, or
 * `new ConstFastBox(otherBox)` to share state with the source cell.
 */
export class ConstFastBox extends _Mixins {
    #borrowed;

    constructor(initial) {
        if (isBox(initial)) {
            // Borrow mode: the inherited raw cell stays unused.
            super(undefined);
            this.#borrowed = initial;
        } else {
            // Capture mode: store into the inherited raw cell.
            super(initial);
            this.#borrowed = null;
        }
    }

    get value() {
        return this.#borrowed !== null ? this.#borrowed.value : super.value;
    }

    set value(_) {
        throw new TypeError(
            'ConstFastBox is read-only. Use box.value on a non-const Box if you need to mutate.'
        );
    }

    snapshot() {
        return $state.snapshot(this.value);
    }

    eager() {
        return $state.eager(this.value);
    }
}

/** Borrow `initial` so the const view shares state with the source. */
export function constfastbox(initial) {
    return new ConstFastBox(initial);
}
