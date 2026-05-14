import { BaseBox } from '../base.svelte.js';
import { ConstFastBox } from './const.svelte.js';

// See box.d.ts for the public API doc.
export class FastBox extends BaseBox {
    /** Read-only {@link ConstFastBox} capturing the current value. */
    const() {
        return new ConstFastBox(this.value);
    }
}

export function fastbox(initial) {
    return new FastBox(initial);
}
