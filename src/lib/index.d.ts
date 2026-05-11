// `BoxCell<T>` is the `{ value: T }` shape used as the narrowed-value side
// of the polymorphic type guards on BaseBox. Re-exported so consumers can
// write their own guards on Box/FastBox subclasses with the same shape.
// `PrimitiveType` is the union returned by `isPrimitive` narrowing.
export type { BoxCell, PrimitiveType } from './core/utils.js';
export { BaseBox } from './core/base.svelte.js';
export { Box, box, type Boxed } from './core/proxy.svelte.js';
export { FastBox, fastbox, type FastBoxed } from './core/fast.svelte.js';
export { boxedMap, fastBoxedMap, type BoxedMap, type FastBoxedMap } from './collections/map.js';
export { boxedSet, fastBoxedSet, type BoxedSet, type FastBoxedSet } from './collections/set.js';
