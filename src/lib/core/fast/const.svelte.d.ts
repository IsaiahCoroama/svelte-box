import type { AnyBox, RawCoreBox } from '../core.svelte.js';
import type { BoxGetter, BoxGuards, BoxCommonMixins } from '../mixins.svelte.js';

// Synthetic constructor for the assembled mixin chain.
type _Mixins<T> = RawCoreBox<T> & BoxGetter<T> & BoxGuards & BoxCommonMixins<T>;
declare const _Mixins: new <T>(initial: T) => _Mixins<T>;

/**
 * Read-only reactive view. Plain class, no Proxy. Reach inner-object
 * properties through `.value`. Writes through `.value` throw
 * `TypeError`.
 *
 * Read-only counterpart to `FastBox`. Mixin chain over
 * {@link RawCoreBox} provides {@link BoxGuards}, {@link BoxGetter},
 * {@link BoxSerializable}, and {@link BoxCloneable}; storage is
 * `$state.raw`.
 *
 * Construct from a plain value (captured into the inherited raw cell)
 * or an existing {@link AnyBox} (shared state). `fastbox.const()` is
 * the shorthand that always borrows from the source `FastBox`.
 */
export declare class ConstFastBox<T> extends _Mixins<T> {
    /** Read-only reactive accessor for the underlying value. */
    readonly value: T;

    /** Borrow `initial` so the const view shares state with the source. */
    constructor(initial: AnyBox<T>);

    /** Capture `initial` into the inherited raw cell. */
    constructor(initial: T);

    /** Non-reactive deep clone of the current value. */
    snapshot(): T;

    /** Current value, bypassing async UI suspension. */
    eager(): T;
}

/** Borrow an existing cell as a {@link ConstFastBox}, sharing state. */
export declare function constfastbox<T>(initial: AnyBox<T>): ConstFastBox<T>;

/** Capture a plain value into a fresh {@link ConstFastBox}. */
export declare function constfastbox<T>(initial: T): ConstFastBox<T>;
