export const isFunction = (v) => typeof v === 'function';
export const isObjectLike = (v) => v !== null && (typeof v === 'object' || typeof v === 'function');
