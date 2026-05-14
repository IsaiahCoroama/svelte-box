/**
 * Union of every primitive value type. Matches the values for which
 * `box.isPrimitive()` returns `true` and which `BaseBox.isPrimitive()`
 * narrows the boxed value to.
 *
 * Functions and non-null objects are excluded. `null` and `undefined` are
 * included because ECMAScript classes both as primitive values.
 */
export type PrimitiveType = string | number | bigint | boolean | symbol | null | undefined;

/** Broadest function shape. Every function is assignable to `UnknownFn`. */
export type UnknownFn = (...args: never[]) => unknown;

/** True when `v` is a function. Narrows `v` to a callable type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare function isFunction(v: unknown): v is (...args: any[]) => unknown;

/** True when `v` is non-null and either an `object` or a `function`. */
export declare function isObjectLike(v: unknown): v is object;
