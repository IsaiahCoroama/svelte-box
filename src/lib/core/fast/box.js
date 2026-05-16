import { BaseBox } from '../base.svelte.js';
import { ConstFastBox } from './const.svelte.js';

// See box.d.ts for the public API doc.
export class FastBox extends BaseBox {
    toConst() {
        return new ConstFastBox(this);
    }
}

export function fastbox(initial) {
    return new FastBox(initial);
}
