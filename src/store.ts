import { writable } from 'svelte/store';

export const largestZIndex = writable(0);
export const statusBarHeight = writable(0);
export const minimizedWIndows = writable([]);
export const fileSystemReady = writable(false);
export const terminalWindowInterface = writable(null);