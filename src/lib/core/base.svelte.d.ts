import type { Snapshot } from 'svelte';
import type { BoxCell } from './utils.js';

/**
 * Shared base class for {@link Box} and `FastBox`. Holds the reactive
 * `value` field plus every helper method and type guard. Both `Box` (the
 * Proxy variant) and `FastBox` (the plain variant) inherit from `BaseBox`,
 * so anything documented here applies to both.
 *
 * Use `BaseBox<T>` as a parameter type when you want to accept either
 * subclass without committing to one. Subclassing `BaseBox` directly is
 * supported and produces something equivalent to `FastBox`.
 *
 * Type guards use a polymorphic `this` predicate (`this is this & { value: X }`)
 * so narrowing inside an `if (b.isString())` block keeps the original
 * subclass type and only refines the `value` field. A `Box<unknown>`
 * narrows to `Box<unknown> & { value: string }` rather than dropping to
 * the base class.
 */
export declare class BaseBox<T> {
	/** The reactive value held by the box. Read and write through `box.value`. */
	value: T;

	/**
	 * Create a new reactive box.
	 * @param initial Initial value to store.
	 */
	constructor(initial: T);

	/** Convenience getter for `box.value`. Equivalent to reading `.value` directly. */
	get(): T;

	/** Convenience setter for `box.value`. Equivalent to `box.value = value`. */
	set(value: T): void;

	/**
	 * Reset the boxed value to `undefined`. Only callable when `T` already
	 * includes `undefined`, so `BaseBox<number>.del()` is a type error. For
	 * boxes whose value type cannot be `undefined`, assign a real value
	 * through `box.value = ...` instead.
	 */
	del(this: undefined extends T ? this : never): void;

	/**
	 * Return a non-reactive deep clone of the current value. Equivalent to
	 * `$state.snapshot(box.value)`. Use this for serialization, logging, or
	 * passing the value to code that should not see Svelte's reactive proxy.
	 */
	snapshot(): Snapshot<T>;

	/**
	 * Return the latest value, bypassing any in-flight async UI suspension.
	 * Equivalent to `$state.eager(box.value)`. Useful in templates that need
	 * the current value while another part of the UI is awaiting async work.
	 */
	eager(): T;

	/**
	 * Returns the inner value for `JSON.stringify`. `JSON.stringify(box)`
	 * works the same as `JSON.stringify(box.value)`. You generally do not
	 * need to call this directly.
	 */
	toJSON(): T;

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
	/** True when the boxed value is any primitive type. */
	isPrimitive(): this is this &
		BoxCell<string | number | bigint | boolean | symbol | null | undefined>;

	/** True when the boxed value is a non-null object. */
	isObject(): this is this & BoxCell<object>;
	/** True when the boxed value is an array. */
	isArray(): this is this & BoxCell<unknown[]>;
	/** True when the boxed value is a function. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isFunction(): this is this & BoxCell<(...args: any[]) => unknown>;
	/** True when the boxed value is a `Map` (including `SvelteMap`). */
	isMap(): this is this & BoxCell<Map<unknown, unknown>>;
	/** True when the boxed value is a `Set` (including `SvelteSet`). */
	isSet(): this is this & BoxCell<Set<unknown>>;
}
