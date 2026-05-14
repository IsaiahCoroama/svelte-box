import type { AnyBox } from '../core.svelte.js';
import { ConstFastBox } from '../fast/const.svelte.js';

/**
 * Shape of the read-only forwarding layer applied to a {@link ConstBox}
 * value. Functions become callable, objects expose their own properties
 * (read-only — write attempts via the proxy throw `TypeError`), and
 * primitives keep only the `ConstBox` surface.
 */
type ConstForwarded<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T extends object
      ? Readonly<T>
      : unknown;

/**
 * Transparent type of a {@link ConstBox}. When `T` is an object,
 * function, or array, `ConstBoxed<T>` exposes `T`'s own properties as
 * read-only via a runtime Proxy. Writes are rejected at the trap.
 *
 * `ConstBox<T>` is the bare class. `ConstBoxed<T>` is what the
 * `constbox(...)` factory returns and what `box.const()` returns from a
 * `Box`.
 */
export type ConstBoxed<T> = ConstBox<T> & ConstForwarded<T>;

/**
 * Read-only reactive view of a value with transparent property
 * forwarding. Read-only counterpart to `Box`: forwarded reads work the
 * same, every write path throws `TypeError`. Callable inner values
 * stay callable; constructable inner values stay constructable.
 *
 * Extends {@link ConstFastBox} which extends `CoreBox`, so the project
 * invariant holds and `instanceof CoreBox` is true. The borrow overload
 * accepts {@link AnyBox} so any class inheriting from `CoreBox` works
 * as a source, not just bare `CoreBox` instances.
 *
 * Prefer the {@link constbox} factory or `box.const()` over
 * `new ConstBox(...)` so transparent forwarding shows up in TypeScript
 * without a cast.
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
