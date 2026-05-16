import { BaseBox } from '../base.svelte.js';
import { ConstBox } from './const.js';
import { buildBoxProxy } from './base.js';

// Inner-wins for collision-prone names so `boxedMap.set(k, v)` invokes
// SvelteMap.set, not Box.set. Symbol keys are not consulted.
const FORWARD_FIRST = new Set(['get', 'set']);

export class Box extends BaseBox {
    constructor(initial) {
        super(initial);
        return buildBoxProxy(this, {
            readOnly: false,
            forwardFirst: FORWARD_FIRST,
            deleteOwnMessage:
                `Cannot delete Box's own property. ` +
                `Use 'box.value = undefined' to clear (when T allows undefined), ` +
                `or assign a different value through 'box.value = ...'.`,
            preventExtensionsMessage:
                'Box does not support being made non-extensible. Apply ' +
                'Object.preventExtensions or Object.freeze to box.value instead.',
            setPrototypeOfMessage:
                'Box does not support changing its prototype. Set the prototype ' +
                'of box.value directly if you need to change the inner value.',
            applyNonFunctionMessage: 'Box value is not a function',
            constructNonFunctionMessage: 'Box value is not a constructor'
        });
    }

    toConst() {
        return new ConstBox(this);
    }
}

export function box(initial) {
    return new Box(initial);
}
