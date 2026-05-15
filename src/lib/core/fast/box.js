import { BaseBox } from '../base.svelte.js';
import { ConstFastBox } from './const.svelte.js';

// See box.d.ts for the public API doc.
export class FastBox extends BaseBox {
    /**
     * Read-only {@link ConstFastBox} borrowing this cell so the view
     * stays reactive to source updates. Use to pass a `FastBox` where a
     * `ConstFastBox` is required.
     */
    const() {
        return new ConstFastBox(this);
    }
}

export function fastbox(initial) {
    return new FastBox(initial);
}
