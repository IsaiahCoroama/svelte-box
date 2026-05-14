import type { PrimitiveType, UnknownFn } from './utils.js';

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
 * Concrete class constructor. Upper bound on every mixin's `Base`
 * parameter. `T` defaults to `object` so a bare `BoxConstructor` accepts
 * any concrete class. `A` defaults to `readonly unknown[]` so any
 * constructor signature matches at the mixin boundary.
 */
export type BoxConstructor<T = object, A extends readonly unknown[] = readonly unknown[]> = new (
    ...args: A
) => T;

/**
 * Constructor of the class produced by a mixin: same arguments as
 * `Base`, instance type `InstanceType<B> & M` (`M` is the mixin's
 * contributed surface). Used as the return type of every `*Mixin`
 * function so chained mixins preserve both the original constructor
 * signature and the accumulated surface.
 */
export type BoxMixin<B extends BoxConstructor, M> = new (
    ...args: ConstructorParameters<B>
) => InstanceType<B> & M;

/**
 * Combined accessor surface: `get`, `set`, and `del`. Produced by
 * {@link BoxAccessorMixin} which composes {@link BoxGetterMixin},
 * {@link BoxSetterMixin}, and {@link BoxDeleterMixin} in that order.
 */
export type BoxAccessor<T> = BoxGetter<T> & BoxSetter<T> & BoxDeleter<T>;

/**
 * Type-guard surface contributed by {@link BoxGuardsMixin}. Type-only.
 * Each guard returns a polymorphic-`this` predicate
 * (`this is this & BoxCell<X>`) so narrowing inside `if (b.isString())`
 * keeps the original subclass type and only refines `value`.
 */
export declare class BoxGuards {
    /** True when the boxed value is a `boolean`. Narrows the value to `boolean`. */
    isBoolean(): this is this & BoxCell<boolean>;
    /** True when the boxed value is a `number`. Narrows the value to `number`. */
    isNumber(): this is this & BoxCell<number>;
    /** True when the boxed value is a `string`. Narrows the value to `string`. */
    isString(): this is this & BoxCell<string>;
    /** True when the boxed value is a `bigint`. Narrows the value to `bigint`. */
    isBigInt(): this is this & BoxCell<bigint>;
    /** True when the boxed value is a `symbol`. Narrows the value to `symbol`. */
    isSymbol(): this is this & BoxCell<symbol>;
    /** True when the boxed value is `undefined`. Narrows the value to `undefined`. */
    isUndefined(): this is this & BoxCell<undefined>;
    /** True when the boxed value is `null`. Narrows the value to `null`. */
    isNull(): this is this & BoxCell<null>;

    /** True when the boxed value is `null` or `undefined`. */
    isNullish(): this is this & BoxCell<null | undefined>;
    /** True when the boxed value is any primitive type. Narrows to {@link PrimitiveType}. */
    isPrimitive(): this is this & BoxCell<PrimitiveType>;

    /** True when the boxed value is a non-null, non-function object. */
    isObject(): this is this & BoxCell<object>;
    /** True when the boxed value is an array. */
    isArray(): this is this & BoxCell<unknown[]>;
    /** True when the boxed value is a function. */
    isFunction(): this is this & BoxCell<UnknownFn>;
    /** True when the boxed value is a `Map` (including `SvelteMap`). */
    isMap(): this is this & BoxCell<Map<unknown, unknown>>;
    /** True when the boxed value is a `Set` (including `SvelteSet`). */
    isSet(): this is this & BoxCell<Set<unknown>>;
}

/**
 * `toJSON` surface contributed by {@link BoxSerializableMixin}. Makes
 * `JSON.stringify(box)` serialise the inner value rather than the
 * wrapper. Type-only.
 */
export declare class BoxSerializable<T> {
    /**
     * Returns the inner value for `JSON.stringify`, so
     * `JSON.stringify(box)` equals `JSON.stringify(box.value)`. Rarely
     * called directly.
     */
    toJSON(): T;
}

/** `get()` surface contributed by {@link BoxGetterMixin}. Type-only. */
export declare class BoxGetter<T> {
    /** Convenience reader equivalent to `box.value`. */
    get(): T;
}

/** `set(value)` surface contributed by {@link BoxSetterMixin}. Type-only. */
export declare class BoxSetter<T> {
    /** Convenience writer equivalent to `box.value = value`. */
    set(value: T): void;
}

/** `del()` surface contributed by {@link BoxDeleterMixin}. Type-only. */
export declare class BoxDeleter<T> {
    /**
     * Reset the boxed value to `undefined`. Only callable when `T`
     * includes `undefined`, so `BaseBox<number>.del()` is a type error.
     * Assign through `box.value = ...` for non-nullable types.
     */
    del(this: undefined extends T ? this : never): void;
}

/**
 * Mix the 14 type-guard methods onto `Base`. `Base` instances must
 * expose `value: T` so guard bodies can read it.
 */
export declare function BoxGuardsMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxGuards>;

/** Mix `toJSON()` onto `Base` so `JSON.stringify(box)` returns the inner value. */
export declare function BoxSerializableMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxSerializable<T>>;

/** Mix the `get()` accessor onto `Base`. */
export declare function BoxGetterMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxGetter<T>>;

/** Mix the `set(value)` accessor onto `Base`. */
export declare function BoxSetterMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxSetter<T>>;

/**
 * Mix the `del()` accessor onto `Base`. The polymorphic-`this`
 * constraint on {@link BoxDeleter.del} blocks the call when `T` does
 * not include `undefined`.
 */
export declare function BoxDeleterMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxDeleter<T>>;

/** Compose `get`, `set`, `del` onto `Base`. */
export declare function BoxAccessorMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxAccessor<T>>;

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
