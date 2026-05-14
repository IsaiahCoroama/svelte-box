import { SvelteMap } from 'svelte/reactivity';
import { Box } from '../proxy/box.js';
import { ConstBox } from '../proxy/const.js';
import { FastBox } from '../fast/box.js';
import { ConstFastBox } from '../fast/const.svelte.js';

export function boxedMap(entries) {
    return new Box(new SvelteMap(entries));
}

export function fastBoxedMap(entries) {
    return new FastBox(new SvelteMap(entries));
}

export function constBoxedMap(entries) {
    return new ConstBox(new SvelteMap(entries));
}

export function constFastBoxedMap(entries) {
    return new ConstFastBox(new SvelteMap(entries));
}
