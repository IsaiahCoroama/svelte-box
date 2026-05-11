export function isFunction(v) {
	return typeof v === 'function';
}

export function isObjectLike(v) {
	return v !== null && (typeof v === 'object' || typeof v === 'function');
}
