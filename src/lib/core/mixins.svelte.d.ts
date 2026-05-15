import type { BoxCell } from './core.svelte.js';
import type { PrimitiveType, UnknownFn, IntersectAll } from './util.js';

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
 * Mixin factory shape: takes a `Base` class and returns the constructor
 * with surface `M` mixed in. Drives the variadic typing of {@link BoxMixer}.
 */
export type BoxMixinFactory<M = unknown> = <B extends BoxConstructor>(Base: B) => BoxMixin<B, M>;

// Pull the contributed surface `M` out of each factory in the tuple so
// `BoxMixer` can intersect them at the call site.
type ExtractMixinTypes<T extends readonly BoxMixinFactory[]> = {
    [K in keyof T]: T[K] extends BoxMixinFactory<infer M> ? M : never;
};

/**
 * Combined accessor surface: `get`, `set`, and `del`. Produced by
 * {@link BoxAccessorMixin}, which composes {@link BoxGetterMixin},
 * {@link BoxSetterMixin}, and {@link BoxDeleterMixin} in that order.
 */
export type BoxAccessor<T> = BoxGetter<T> & BoxSetter<T> & BoxDeleter<T>;

/**
 * Combined non-mutating utility surface: serialise, freeze, clone.
 * Produced by {@link BoxCommonMixin}, applied wherever a class wants
 * the standard auxiliary methods regardless of whether the value is
 * mutable.
 */
export type BoxCommonMixins<T> = BoxSerializable<T> & BoxFreezable & BoxCloneable<T>;

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

/**
 * Freeze surface contributed by {@link BoxFreezableMixin}. Non-generic
 * because `Object.freeze` returns the same reference and the predicate
 * is value-shape-independent.
 */
export declare class BoxFreezable {
    /** Alias for `Object.freeze(box.value)`. Returns `this` for chaining. */
    freeze(): this;
    /** True when `Object.isFrozen(box.value)`. */
    isFrozen(): boolean;
}

/**
 * Deep-clone surface contributed by {@link BoxCloneableMixin}.
 * Snapshots before cloning so the underlying `$state` proxy does not
 * trip `structuredClone`.
 */
export declare class BoxCloneable<T> {
    /**
     * Deep clone of the inner value via `structuredClone`. Handles
     * cycles, `Map`, `Set`, `Date`, typed arrays. Throws `DataCloneError`
     * on functions or DOM nodes.
     */
    clone(): T;
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
 * expose `value` so guard bodies can read it.
 */
export declare function BoxGuardsMixin<B extends BoxConstructor<BoxCell<unknown>>>(
    Base: B
): BoxMixin<B, BoxGuards>;

/** Mix `toJSON()` onto `Base` so `JSON.stringify(box)` returns the inner value. */
export declare function BoxSerializableMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxSerializable<T>>;

/** Mix `freeze()` and `isFrozen()` onto `Base`. */
export declare function BoxFreezableMixin<B extends BoxConstructor<BoxCell<unknown>>>(
    Base: B
): BoxMixin<B, BoxFreezable>;

/**
 * Mix `clone()` onto `Base`. Body snapshots the inner value before
 * passing it to `structuredClone` to avoid the `DataCloneError` raised
 * on Svelte's `$state` proxy.
 */
export declare function BoxCloneableMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxCloneable<T>>;

/**
 * Compose {@link BoxSerializable}, {@link BoxFreezable}, and
 * {@link BoxCloneable} onto `Base`. Convenience for the standard
 * non-mutating utility surface attached to every box variant.
 */
export declare function BoxCommonMixin<T, B extends BoxConstructor<BoxCell<T>>>(
    Base: B
): BoxMixin<B, BoxCommonMixins<T>>;

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
 * Apply a list of mixin factories to `Base` left-to-right, accumulating
 * each contributed surface into the final instance type. Reads
 * top-down at the call site, in contrast to nested-call composition
 * (which reads inside-out).
 *
 * Tradeoff: per-step `Base` constraints are not enforced (TS only
 * checks the original `Base`); only the intersection of contributed
 * surfaces is preserved. Use the hand-chained form in `_Mixins` blocks
 * when per-layer constraints matter.
 */
export declare function BoxMixer<B extends BoxConstructor, M extends readonly BoxMixinFactory[]>(
    Base: B,
    ...mixins: M
): BoxMixin<B, IntersectAll<ExtractMixinTypes<M>>>;
