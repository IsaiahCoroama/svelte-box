import { SvelteSet } from 'svelte/reactivity';
import { Box } from '../proxy/box.js';
import { ConstBox } from '../proxy/const.js';
import { FastBox } from '../fast/box.js';
import { ConstFastBox } from '../fast/const.svelte.js';

export function boxedSet(values) {
    return new Box(new SvelteSet(values));
}

export function fastBoxedSet(values) {
    return new FastBox(new SvelteSet(values));
}

export function constBoxedSet(values) {
    return new ConstBox(new SvelteSet(values));
}

export function constFastBoxedSet(values) {
    return new ConstFastBox(new SvelteSet(values));
}
