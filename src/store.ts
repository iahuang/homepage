import { writable } from "svelte/store";

export const largestZIndex = writable(0);
export const statusBarHeight = writable(0);
export const minimizedWIndows = writable([]);
export const fileSystemReady = writable(false);
export const terminalWindowInterface = writable(null);

export const darkMode = writable(localStorage.getItem("darkMode") === "true" || false);
darkMode.subscribe((value) => localStorage.setItem("darkMode", value.toString()));

export const showIntroduction = writable(
    localStorage.getItem("showIntroduction") !== "false"
);
showIntroduction.subscribe((value) => localStorage.setItem("showIntroduction", value.toString()));
