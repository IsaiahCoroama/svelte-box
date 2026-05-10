import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { Box } from './proxy.svelte.js';
import { FastBox } from './fast.svelte.js';

export const boxedMap = (entries) => new Box(new SvelteMap(entries));
export const boxedSet = (values) => new Box(new SvelteSet(values));

export const fastBoxedMap = (entries) => new FastBox(new SvelteMap(entries));
export const fastBoxedSet = (values) => new FastBox(new SvelteSet(values));
