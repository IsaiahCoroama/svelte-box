import { ConstFastBox } from '../fast/const.svelte.js';
import { buildBoxProxy } from './base.js';

// `get` collides with Map.get. Preferring the inner keeps
// `constBoxedMap.get(k)` ergonomic. `set` is not listed because
// ConstBox's mixin chain has no `BoxSetter`, so the lookup already
// falls through.
const FORWARD_FIRST = new Set(['get']);

const READONLY_MSG =
    'ConstBox is read-only. Use box.value on a non-const Box if you need to mutate.';

/**
 * Read-only reactive view with transparent property forwarding.
 * Read-only counterpart to `Box`: forwarded reads work the same,
 * callable inners stay callable, every write trap throws.
 *
 * Inherits from {@link ConstFastBox} (and `RawCoreBox`), so the project
 * invariant holds. Use `box.const()` for a snapshot capture, or
 * `new ConstBox(otherBox)` to share state with an existing cell.
 */
export class ConstBox extends ConstFastBox {
    constructor(initial) {
        super(initial);
        return buildBoxProxy(this, {
            readOnly: true,
            forwardFirst: FORWARD_FIRST,
            writeMessage: READONLY_MSG,
            preventExtensionsMessage:
                'ConstBox does not support being made non-extensible. The shared ' +
                'proxy target must stay extensible to avoid affecting other instances.',
            setPrototypeOfMessage: 'ConstBox does not support changing its prototype.',
            applyNonFunctionMessage: 'ConstBox value is not a function',
            constructNonFunctionMessage: 'ConstBox value is not a constructor'
        });
    }
}

/** Borrow an existing cell as a {@link ConstBox}, sharing state. */
export function constbox(initial) {
    return new ConstBox(initial);
}
