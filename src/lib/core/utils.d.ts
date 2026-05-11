/**
 * Union of every primitive value type. Matches the values for which
 * `box.isPrimitive()` returns `true` and which `BaseBox.isPrimitive()`
 * narrows the boxed value to.
 *
 * Functions and non-null objects are excluded. `null` and `undefined` are
 * included because ECMAScript classes both as primitive values.
 */
export type PrimitiveType = string | number | bigint | boolean | symbol | null | undefined;

/**
 * A `{ value: T }` shape. Used by the type guards on {@link BaseBox} as the
 * narrowed-value side of `this is this & BoxCell<X>`, so a `Box<unknown>`
 * narrows to `Box<unknown> & BoxCell<string>` rather than dropping to a
 * wider base type. Reads as "this box is also a cell holding `X`".
 *
 * Exported from the public barrel so consumers writing their own type
 * guards on `Box` or `FastBox` subclasses can use the same shape.
 */
export type BoxCell<T> = { value: T };

/** True when `v` is a function. Narrows `v` to a callable type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare function isFunction(v: unknown): v is (...args: any[]) => unknown;

/** True when `v` is non-null and either an `object` or a `function`. */
export declare function isObjectLike(v: unknown): v is object;
