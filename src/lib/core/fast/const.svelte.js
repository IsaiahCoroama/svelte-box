import { RawCoreBox, isBox } from '../core.svelte.js';
import { BoxGetterMixin, BoxGuardsMixin, BoxCommonMixin, BoxMixer } from '../mixins.js';

const _Mixins = BoxMixer(RawCoreBox, BoxGuardsMixin, BoxGetterMixin, BoxCommonMixin);

/**
 * Read-only reactive view. Plain class, no Proxy. Reach inner-object
 * properties through `.value`. Wraps a plain value (captured into a
 * fresh cell) or an existing {@link AnyBox} (shared state with the
 * source). Writes through `.value` throw `TypeError`.
 *
 * Read-only counterpart to `FastBox` with the same `.value`-only access
 * pattern. The proxied variant is {@link ConstBox}.
 *
 * Storage is `$state.raw` (inherited from {@link RawCoreBox}): capture
 * mode is a snapshot of reference, so external mutations of the
 * captured object are not amplified into reactive updates. Use borrow
 * mode (`new ConstFastBox(otherBox)`) for shared live reactivity, or
 * `fastbox.const()` for a snapshot from a `FastBox`.
 */
export class ConstFastBox extends _Mixins {
    #borrowed;

    constructor(initial) {
        if (isBox(initial)) {
            // Borrow mode: inherited raw cell stays unused.
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
