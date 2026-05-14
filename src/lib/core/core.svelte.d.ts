import type { PrimitiveType, UnknownFn } from './utils.js';

/**
 * A `{ value: T }` shape. Used as the narrowed-value side of the type
 * guards on {@link BoxGuards} (`this is this & BoxCell<X>`), so a
 * `Box<unknown>` narrows to `Box<unknown> & BoxCell<string>` rather
 * than dropping to a wider base type. Also the structural constraint
 * on the `Base` parameter of every box mixin function. Re-exported
 * from the public barrel so consumers writing their own guards on
 * `Box` / `FastBox` subclasses can use the same shape.
 */
export type BoxCell<T> = { value: T };

/**
 * Any class inheriting from one of the two reactive-cell roots:
 * {@link CoreBox} (deep `$state` storage) or {@link RawCoreBox}
 * (`$state.raw` storage, no deep proxy). Use as the parameter type
 * when a function should accept any reactive-cell variant —
 * `CoreBox<T>`, `MutCoreBox<T>`, `BaseBox<T>`/`Box<T>`/`FastBox<T>`,
 * `RawCoreBox<T>`, `RawMutCoreBox<T>`, `ConstBox<T>`,
 * `ConstFastBox<T>`, `LazyBox<...>`, or any user-defined subclass.
 *
 * **Project invariant**: every reactive box class in this library,
 * and every user-defined box class, must inherit from `CoreBox` or
 * `RawCoreBox`. The {@link isBox} runtime guard and this `AnyBox<T>`
 * type are the only sanctioned ways to recognise a box generically.
 * Do not introduce a parallel container hierarchy.
 */
export type AnyBox<T> = CoreBox<T> | RawCoreBox<T>;

/**
 * Concrete class constructor. Instantiable with `new`. Used as the upper
 * bound on every mixin function's `Base` parameter.
 *
 * `T` defaults to `object` so a bare `BoxConstructor` (no type args)
 * accepts any concrete class. `A` is the tuple of constructor argument
 * types, defaulted to `readonly unknown[]` so any constructor signature
 * matches at the mixin boundary.
 */
export type BoxConstructor<T = object, A extends readonly unknown[] = readonly unknown[]> = new (
    ...args: A
) => T;

/**
 * Constructor of the class produced by a mixin: takes the same
 * arguments as `Base` and yields `InstanceType<B> & M` (`M` is the
 * methods contributed by the mixin). Use as the return-type annotation
 * on every `*Mixin` function so the chain preserves both the original
 * constructor signature and the accumulated mixin surface.
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
 * Type-guard surface contributed by {@link BoxGuardsMixin}. Type-only;
 * never instantiated at runtime. Each guard returns a polymorphic-`this`
 * predicate (`this is this & BoxCell<X>`) so narrowing inside an
 * `if (b.isString())` block keeps the original subclass type and only
 * refines the `value` field.
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
     * Returns the inner value for `JSON.stringify`. `JSON.stringify(box)`
     * works the same as `JSON.stringify(box.value)`. You generally do not
     * need to call this directly.
     */
    toJSON(): T;
}

/** `get()` surface contributed by {@link BoxGetterMixin}. Type-only. */
export declare class BoxGetter<T> {
    /** Convenience getter for `box.value`. Equivalent to reading `.value` directly. */
    get(): T;
}

/** `set(value)` surface contributed by {@link BoxSetterMixin}. Type-only. */
export declare class BoxSetter<T> {
    /** Convenience setter for `box.value`. Equivalent to `box.value = value`. */
    set(value: T): void;
}

/** `del()` surface contributed by {@link BoxDeleterMixin}. Type-only. */
export declare class BoxDeleter<T> {
    /**
     * Reset the boxed value to `undefined`. Only callable when `T` already
     * includes `undefined`, so `BaseBox<number>.del()` is a type error. For
     * boxes whose value type cannot be `undefined`, assign a real value
     * through `box.value = ...` instead.
     */
    del(this: undefined extends T ? this : never): void;
}

/**
 * Mix the 14 type-guard methods onto `Base`. `Base` must produce
 * instances with a `value: T` member so the guard bodies can read it.
 * Returns a subclass whose instances expose every method declared on
 * {@link BoxGuards}.
 */
export declare function BoxGuardsMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxGuards>;

/**
 * Mix `toJSON()` onto `Base`. Returns a subclass whose `JSON.stringify`
 * output is the inner value rather than the wrapper.
 */
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
 * Mix the `del()` accessor onto `Base`. The call-site `T` excludes
 * non-undefined value types via the polymorphic-`this` constraint on
 * {@link BoxDeleter.del}.
 */
export declare function BoxDeleterMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxDeleter<T>>;

/**
 * Mix the full accessor trio (`get`, `set`, `del`) onto `Base`. Shorthand
 * for `BoxDeleterMixin(BoxSetterMixin(BoxGetterMixin(Base)))`.
 */
export declare function BoxAccessorMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxAccessor<T>>;

/**
 * Minimal deeply-reactive cell. Private `$state` field, public getter
 * only. Setter is intentionally hidden so a read-only variant can
 * extend `CoreBox` without inheriting a mutable accessor. Subclasses
 * that need write access extend {@link MutCoreBox}.
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
 * top of {@link CoreBox}. The prototype accessor pair is the override
 * seam for subclasses: define `set value(next)` on the subclass and
 * forward to `super.value = next` to validate or transform writes
 * while keeping the underlying cell in sync.
 *
 * Mixins applied at `BaseBox` operate on this class. `CoreBox` itself
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
 * only. Reads of nested fields go straight to the underlying value
 * with no deep-proxy mediation; reactivity fires only when the cell
 * itself is reassigned through a subclass setter.
 *
 * Sibling root to {@link CoreBox}. Use for snapshot-style captures
 * (where deep tracking is a wasted cost) or for opaque payloads that
 * should not be wrapped in Svelte's deep proxy.
 *
 * Internal: not re-exported from the public barrel.
 */
export declare class RawCoreBox<T> {
    readonly value: T;

    constructor(initial: T);
}

/**
 * Raw-reactive cell with public `value` accessors. Mirror of
 * {@link MutCoreBox} over the raw-state cell from {@link RawCoreBox}.
 * Same override seam: define `set value(next)` on a subclass and
 * forward to `super.value = next`.
 *
 * Internal: not re-exported from the public barrel.
 */
export declare class RawMutCoreBox<T> extends RawCoreBox<T> {
    value: T;

    constructor(initial: T);
}

/**
 * Runtime guard for {@link AnyBox}. Narrows `value` to
 * `AnyBox<unknown>` (i.e. `CoreBox<unknown> | RawCoreBox<unknown>`)
 * when it is an instance of either root.
 */
export declare function isBox(value: unknown): value is AnyBox<unknown>;
