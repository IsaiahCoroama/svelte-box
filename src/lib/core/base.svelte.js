import { isObjectLike } from './utils.js';

/**
 * Internal base class shared by `Box` and `FastBox`. Holds the reactive
 * `value` field plus every helper method and type guard. Both `Box` (the
 * Proxy variant) and `FastBox` (the plain variant) inherit from this.
 *
 * `BaseBox` itself is a usable container. It is exported so consumers can
 * type a function that accepts either subclass with `BaseBox<T>` instead of
 * `Box<T> | FastBox<T>`. Subclassing `BaseBox` directly is supported and
 * gives you something equivalent to `FastBox`.
 */
export class BaseBox {
	value = $state();

	constructor(initial) {
		this.value = initial;
	}

	get = () => this.value;
	set = (value) => {
		this.value = value;
	};
	del = () => {
		this.value = /** @type {any} */ (undefined);
	};

	snapshot = () => $state.snapshot(this.value);
	eager = () => $state.eager(this.value);

	// `JSON.stringify(box)` would otherwise see a function (the Box proxy
	// target is a function, so `typeof box === 'function'`) and return
	// `undefined`. Routing through `toJSON` makes serialization see the
	// inner value. FastBox does not need this for serialization but
	// inheriting it keeps the surface identical.
	toJSON = () => this.value;

	// Primitive type guards
	isBoolean = () => typeof this.value === 'boolean';
	isNumber = () => typeof this.value === 'number';
	isString = () => typeof this.value === 'string';
	isBigInt = () => typeof this.value === 'bigint';
	isSymbol = () => typeof this.value === 'symbol';
	isUndefined = () => this.value === undefined;
	isNull = () => this.value === null;

	// Composite
	isNullish = () => this.value == null;
	isPrimitive = () => !isObjectLike(this.value);

	// Object-like
	isObject = () => this.value !== null && typeof this.value === 'object';
	isArray = () => Array.isArray(this.value);
	isFunction = () => typeof this.value === 'function';
	isMap = () => this.value instanceof Map;
	isSet = () => this.value instanceof Set;
}
