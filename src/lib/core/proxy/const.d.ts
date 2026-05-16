import type { AnyBox } from '../core.svelte.js';
import { ConstFastBox } from '../fast/const.svelte.js';

/**
 * Read-only forwarding shape for a {@link ConstBox} value. Functions
 * become callable, objects expose their own properties (read-only:
 * write attempts via the proxy throw `TypeError`), primitives keep only
 * the `ConstBox` surface.
 */
type Forwarded<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T extends object
      ? Readonly<T>
      : unknown;

/**
 * Transparent type of a {@link ConstBox}. When `T` is an object,
 * function, or array, `ConstBoxed<T>` exposes `T`'s own properties as
 * read-only via a runtime Proxy. Writes are rejected at the trap.
 *
 * `ConstBox<T>` is the bare class; `ConstBoxed<T>` is what the
 * `constbox(...)` factory and `box.toConst()` return.
 */
export type ConstBoxed<T> = ConstBox<T> & Forwarded<T>;

/**
 * Read-only reactive view with transparent property forwarding.
 * Read-only counterpart to `Box`: forwarded reads work the same,
 * callable inners stay callable, every write path throws.
 *
 * Extends {@link ConstFastBox} (which roots at `RawCoreBox`), so the
 * project invariant holds. The borrow overload accepts {@link AnyBox},
 * so any reactive-cell variant works as a source.
 *
 * Prefer {@link constbox} or `box.toConst()` over `new ConstBox(...)` so
 * forwarding shows up in TypeScript without a cast.
 */
export declare class ConstBox<T> extends ConstFastBox<T> {
    /** Borrow `initial` so the const view shares state with the source. */
    constructor(initial: AnyBox<T>);

    /** Capture `initial` into a fresh internal cell. */
    constructor(initial: T);
}

/** Borrow an existing cell as a {@link ConstBoxed}, sharing state. */
export declare function constbox<T>(initial: AnyBox<T>): ConstBoxed<T>;

/** Capture a plain value into a fresh {@link ConstBoxed}. */
export declare function constbox<T>(initial: T): ConstBoxed<T>;
