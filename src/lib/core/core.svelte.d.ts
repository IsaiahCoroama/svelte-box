/**
 * `{ value: T }` shape. Used as the narrowed-value side of the type
 * guards on {@link BoxGuards} (`this is this & BoxCell<X>`), so a
 * `Box<unknown>` narrows to `Box<unknown> & BoxCell<string>` instead
 * of dropping to a wider base. Also the structural constraint on every
 * mixin's `Base` parameter. Re-exported so consumers writing their own
 * guards on `Box` / `FastBox` subclasses can use the same shape.
 */
export type BoxCell<T> = { value: T };

/**
 * Any class inheriting from one of the two reactive-cell roots:
 * {@link CoreBox} (deep `$state`) or {@link RawCoreBox} (`$state.raw`,
 * no deep proxy). Use as a parameter type when a function should accept
 * any reactive-cell variant.
 *
 * **Project invariant**: every box class in this library, and every
 * user-defined box class, must inherit from `CoreBox` or `RawCoreBox`.
 * {@link isBox} and this type are the only sanctioned ways to recognise
 * a box generically. Do not introduce a parallel container hierarchy.
 */
export type AnyBox<T> = CoreBox<T> | RawCoreBox<T>;

/**
 * Minimal deeply-reactive cell. Private `$state` field, public getter
 * only. The hidden setter lets a read-only variant extend `CoreBox`
 * without inheriting a mutable accessor; subclasses that need writes
 * extend {@link MutCoreBox}.
 *
 * One of the two roots of the box hierarchy. Use {@link AnyBox} and
 * {@link isBox} when accepting any reactive-cell variant.
 *
 * Internal: not re-exported from the public barrel.
 */
export declare class CoreBox<T> {
    readonly value: T;

    constructor(initial: T);
}

/**
 * Deeply-reactive cell with public `value` accessors. Adds a setter on
 * top of {@link CoreBox}. The accessor pair is the override seam:
 * define `set value(next)` on a subclass and forward to
 * `super.value = next` to validate or transform writes while keeping
 * the cell in sync.
 *
 * Mixins applied at `BaseBox` operate on this class; `CoreBox` itself
 * has only a getter and does not satisfy the mixin
 * `BoxConstructor<BoxCell<T>>` constraint at write sites.
 *
 * Internal: not re-exported from the public barrel.
 */
export declare class MutCoreBox<T> extends CoreBox<T> {
    value: T;

    constructor(initial: T);
}

/**
 * Minimal raw-reactive cell. Private `$state.raw` field, public getter
 * only. Reads of nested fields skip Svelte's deep proxy; reactivity
 * fires only on cell reassignment through a subclass setter.
 *
 * Sibling root to {@link CoreBox}. Use for snapshot-style captures or
 * opaque payloads where deep tracking would be wasted cost.
 *
 * Internal: not re-exported from the public barrel.
 */
export declare class RawCoreBox<T> {
    readonly value: T;

    constructor(initial: T);
}

/**
 * Raw-reactive cell with public `value` accessors. Mirror of
 * {@link MutCoreBox} over the raw cell. Same override seam: define
 * `set value(next)` and forward to `super.value = next`.
 *
 * Internal: not re-exported from the public barrel.
 */
export declare class RawMutCoreBox<T> extends RawCoreBox<T> {
    value: T;

    constructor(initial: T);
}

/**
 * Runtime guard for {@link AnyBox}. Narrows `value` to `AnyBox<unknown>`
 * when it inherits from either root.
 */
export declare function isBox(value: unknown): value is AnyBox<unknown>;
