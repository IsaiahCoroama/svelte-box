declare const _typeof: <T>(value: T) => typeof value;

export type PrimitiveType = ReturnType<typeof _typeof>;

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

export declare const isFunction: (v: unknown) => v is (...args: unknown[]) => unknown;
export declare const isObjectLike: (v: unknown) => v is object;
