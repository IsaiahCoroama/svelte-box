/** True when `v` is a function. */
export function isFunction(v) {
    return typeof v === 'function';
}

/** True when `v` is non-null and either an `object` or a `function`. */
export function isObjectLike(v) {
    return v !== null && (typeof v === 'object' || typeof v === 'function');
}
