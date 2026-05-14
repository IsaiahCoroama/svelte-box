import type { Snapshot } from 'svelte';
import type { AnyBox, BoxGetter, BoxGuards, BoxSerializable, RawCoreBox } from '../core.svelte.js';

type _Mixins<T> = RawCoreBox<T> & BoxGetter<T> & BoxGuards & BoxSerializable<T>;
declare const _Mixins: new <T>(initial: T) => _Mixins<T>;

/**
 * Read-only reactive view of a value. Plain class, no Proxy. Reach
 * inner-object properties through `.value`. Writes through `.value`
 * throw `TypeError`.
 *
 * Read-only counterpart to `FastBox`. Inherits {@link BoxGuards},
 * {@link BoxGetter}, and {@link BoxSerializable} via the mixin chain
 * over {@link RawCoreBox}, so the inherited storage cell is
 * `$state.raw` and the project invariant "every box inherits from
 * `CoreBox` or `RawCoreBox`" holds.
 *
 * Construct from a plain value (captured into the inherited raw cell)
 * or from an existing {@link AnyBox} (shared state with the source).
 * Use `fastbox.const()` to derive a const view from a `FastBox`.
 */
export declare class ConstFastBox<T> extends _Mixins<T> {
    /** Read-only reactive accessor for the underlying value. */
    readonly value: T;

    /** Borrow `initial` so the const view shares state with the source. */
    constructor(initial: AnyBox<T>);

    /** Capture `initial` into the inherited raw cell. */
    constructor(initial: T);

    /** Non-reactive deep clone of the current value. */
    snapshot(): Snapshot<T>;

    /** Current value, bypassing async UI suspension. */
    eager(): T;
}

/** Borrow an existing cell as a {@link ConstFastBox}, sharing state. */
export declare function constfastbox<T>(initial: AnyBox<T>): ConstFastBox<T>;

/** Capture a plain value into a fresh {@link ConstFastBox}. */
export declare function constfastbox<T>(initial: T): ConstFastBox<T>;
