export type { PrimitiveType } from './core/util.js';
export type { AnyBox } from './core/core.svelte.js';
export { isBox, type BoxCell } from './core/core.svelte.js';
export { BaseBox } from './core/base.svelte.js';
export { Box, box, type Boxed } from './core/proxy/box.js';
export { ConstBox, constbox, type ConstBoxed } from './core/proxy/const.js';
export { FastBox, fastbox } from './core/fast/box.js';
export { ConstFastBox, constfastbox } from './core/fast/const.svelte.js';
export { LazyBox, lazybox, type LazyLoaderFn } from './core/lazy.js';
export {
    boxedMap,
    fastBoxedMap,
    constBoxedMap,
    constFastBoxedMap,
    type BoxedMap,
    type FastBoxedMap,
    type ConstBoxedMap,
    type ConstFastBoxedMap
} from './core/collections/map.js';
export {
    boxedSet,
    fastBoxedSet,
    constBoxedSet,
    constFastBoxedSet,
    type BoxedSet,
    type FastBoxedSet,
    type ConstBoxedSet,
    type ConstFastBoxedSet
} from './core/collections/set.js';
