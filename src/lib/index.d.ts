export type { BoxCell } from './core/utils.js';
export { FastBox, fastbox, type FastBoxed } from './core/fast.svelte.js';
export { Box, box, type Boxed } from './core/proxy.svelte.js';
export {
	boxedMap,
	boxedSet,
	fastBoxedMap,
	fastBoxedSet,
	type BoxedMap,
	type BoxedSet,
	type FastBoxedMap,
	type FastBoxedSet
} from './core/collections.svelte.js';
