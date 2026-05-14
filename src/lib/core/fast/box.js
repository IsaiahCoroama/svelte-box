import { BaseBox } from '../base.svelte.js';
import { ConstFastBox } from './const.svelte.js';

// See box.d.ts for the public API doc.
export class FastBox extends BaseBox {
    /**
     * Derive a read-only plain {@link ConstFastBox} capturing the
     * current value. Returns the no-proxy variant so it matches
     * `FastBox`'s own no-proxy semantics.
     */
    const() {
        return new ConstFastBox(this.value);
    }
}

export function fastbox(initial) {
    return new FastBox(initial);
}
