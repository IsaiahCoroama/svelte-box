import { RawCoreBox, isBox } from '../core.svelte.js';
import { BoxGetterMixin, BoxGuardsMixin, BoxCommonMixin, BoxMixer } from '../mixins.svelte.js';

const _Mixins = BoxMixer(RawCoreBox, BoxGuardsMixin, BoxGetterMixin, BoxCommonMixin);

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

export function constfastbox(initial) {
    return new ConstFastBox(initial);
}
