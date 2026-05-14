import { ConstFastBox } from '../fast/const.svelte.js';
import { buildBoxProxy } from './base.js';

// `get` collides with Map.get; preferring the inner keeps
// `constBoxedMap.get(k)` ergonomic. `set` does not need to be listed:
// ConstBox's mixin chain has no `BoxSetter`, so `'set'` is not own and
// already falls through to the inner method.
const FORWARD_FIRST = new Set(['get']);

const READONLY_MSG =
    'ConstBox is read-only. Use box.value on a non-const Box if you need to mutate.';

/**
 * Read-only reactive view of a value with transparent property
 * forwarding. Read-only counterpart to `Box`: reads of inner-object
 * properties forward through the proxy, callable inners stay callable,
 * but every write trap throws `TypeError`.
 *
 * Inherits from {@link ConstFastBox} (and therefore from `CoreBox`),
 * so the project invariant "every box inherits from `CoreBox`" holds.
 *
 * Use `box.const()` on a `Box` instance to derive a snapshot-style
 * const view. Use `new ConstBox(otherBox)` to share state with an
 * existing reactive cell.
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
