<script context="module" lang="ts">
    export interface WindowInterface {
        setWindowSize(width: number, height: number): void;

        hide(): void;
        show(): void;

        getDimensions(): { width: number; height: number };

        getPosition(): { x: number; y: number };
        setPosition(x: number, y: number): void;

        setTitle(to: string): void;

        focus(): void;

        getWindowID(): string;

        getTitle(): string;
    }
</script>

<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";
    import { darkMode, largestZIndex, showIntroduction, statusBarHeight } from "../store";
    import { addWindowToStatusBar } from "./StatusBar.svelte";

    class WindowInterfaceImpl implements WindowInterface {
        setWindowSize(width: number, height: number): void {
            state_width = width;
            state_height = height;
        }

        hide(): void {
            state_visible = false;
        }

        show(): void {
            state_visible = true;
        }

        getDimensions(): { width: number; height: number } {
            return {
                width: state_width,
                height: state_height,
            };
        }

        getPosition(): { x: number; y: number } {
            return {
                x: state_left,
                y: state_top,
            };
        }

        setPosition(x: number, y: number): void {
            state_top = y;
            state_left = x;

            // clip window position to screen
            if (state_top < get(statusBarHeight)) state_top = get(statusBarHeight);
            if (state_left < 0) state_left = 0;
            if (state_top + state_height > window.innerHeight)
                state_top = window.innerHeight - state_height;
            if (state_left + state_width > window.innerWidth)
                state_left = window.innerWidth - state_width;
        }

        setTitle(to: string): void {
            state_title = to;
        }

        focus(): void {
            largestZIndex.update((z) => z + 1);
            state_z_index = get(largestZIndex);
        }

        getWindowID(): string {
            return windowID;
        }

        getTitle(): string {
            return state_title;
        }
    }

    interface WindowConfig {
        width: number;
        height: number | null;
        top?: number;
        left?: number;
        bottom?: number;
        right?: number;
        title?: string;
        visible?: boolean;
    }

    export let config: WindowConfig;

    let state_width: number;
    let state_height: number | null;

    let state_top: number;
    let state_left: number;
    let state_visible = config.visible ?? true;
    let state_title = config.title ?? "";
    largestZIndex.update((z) => z + 1);
    let state_z_index = get(largestZIndex);

    const windowID = Math.random().toString(36);

    let state_maximized = false;

    $: state_focused = $largestZIndex === state_z_index;

    let drag = {
        offsetX: 0,
        offsetY: 0,
        moving: false,
        resizing: false,
    };

    export const windowInterface = new WindowInterfaceImpl();

    function dragManager(event: MouseEvent): void {
        if (drag.moving) {
            windowInterface.setPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
        }

        if (drag.resizing) {
            let width = event.clientX - state_left + drag.offsetX;
            let height = event.clientY - state_top + drag.offsetX;

            if (width < 100) width = 100;
            if (height < 100) height = 100;

            windowInterface.setWindowSize(width, height);
        }
    }

    onMount(() => {
        window.addEventListener("mousemove", dragManager);
    });
    onDestroy(() => {
        window.removeEventListener("mousemove", dragManager);
    });

    let left = config.left ?? 0;
    let top = config.top ?? 0;

    if (config.right !== undefined) {
        left = window.innerWidth - config.right - config.width;
    }

    if (config.bottom !== undefined) {
        top = window.innerHeight - config.bottom - (config.height ?? config.width);
    }

    windowInterface.setPosition(left, top);
    windowInterface.setWindowSize(config.width, config.height);
    windowInterface.setTitle(state_title);
    windowInterface.show();

    statusBarHeight.subscribe((height) => {
        if (state_top < height) {
            state_top = height;
        }
    });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="window"
    class:dark-mode={$darkMode}
    style:top={state_top + "px"}
    style:left={state_left + "px"}
    style:width={state_width + "px"}
    style:height={state_height !== null ? state_height + "px" : "auto"}
    style:visibility={state_visible ? "visible" : "hidden"}
    style:z-index={state_z_index}
    on:click={(ev) => {
        windowInterface.focus();
    }}
>
    <div
        class="header"
        class:dark-mode={$darkMode}
        on:mousedown={(ev) => {
            if (ev.target !== ev.currentTarget) {
                return;
            }

            drag.moving = true;
            drag.offsetX = ev.offsetX;
            drag.offsetY = ev.offsetY;

            windowInterface.focus();

            function release() {
                drag.moving = false;
                window.removeEventListener("mouseup", release);

                showIntroduction.set(false);
            }

            window.addEventListener("mouseup", release);
        }}
    >
        <div class="buttons">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class={"button close"}
                class:unfocused={!state_focused}
                on:click={() => {
                    windowInterface.hide();
                }}
            />
            <div
                class={"button minimize"}
                class:unfocused={!state_focused}
                on:click={() => {
                    windowInterface.hide();
                    addWindowToStatusBar(windowInterface);
                }}
            />
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class={"button maximize"}
                class:unfocused={!state_focused}
                on:click={() => {
                    state_maximized = !state_maximized;
                    if (state_maximized) {
                        windowInterface.setWindowSize(
                            window.innerWidth,
                            window.innerHeight - get(statusBarHeight)
                        );
                        windowInterface.setPosition(0, get(statusBarHeight));
                    } else {
                        windowInterface.setWindowSize(config.width, config.height);
                        windowInterface.setPosition(state_left, state_top);
                    }
                }}
            />
        </div>
        <div class="title">
            {state_title}
        </div>
        {#if state_focused && $showIntroduction}
            <div class="tooltip">
                <div class="arrow" />
                <div class="introduction">
                    <span style="font-size: 12pt;" class="material-symbols-rounded">
                        pan_tool_alt
                    </span>&nbsp; Drag to move window
                </div>
            </div>
        {/if}
    </div>
    <div class="window-container">
        <slot />
        {#if !state_focused}
            <div class="focus-overlay" />
        {/if}
    </div>
    <div
        class="resize-handle"
        on:mousedown={(ev) => {
            drag.resizing = true;
            drag.offsetX = ev.offsetX;
            drag.offsetY = ev.offsetY;

            windowInterface.focus();

            function release() {
                drag.resizing = false;
                window.removeEventListener("mouseup", release);
            }

            window.addEventListener("mouseup", release);
        }}
    >
        <span class="material-symbols-rounded" style="font-size: 14pt;">drag_indicator</span>
    </div>
</div>

<style>
    .window {
        box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.375);
        border-radius: 6px;

        position: absolute;

        display: grid;
        grid-template-rows: 28px auto;

        overflow: hidden;

        background-color: white;
        border: 1px solid #e9e9e9;
    }

    .window.dark-mode {
        background-color: #181b21;
        border: 1px solid #30323d;
    }

    .focus-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0);
        z-index: 1;
    }

    .resize-handle {
        position: absolute;
        right: 0;
        bottom: 0;
        user-select: none;
        opacity: 0.5;
        cursor: nwse-resize;

        -webkit-text-stroke: 0.5px white;
    }

    .header {
        position: relative;
        color: #7a7a7a;
        border-bottom: 1px solid #e9e9e9;
    }
    .header.dark-mode {
        border-bottom: none;
    }

    .header:hover {
        cursor: move;
    }

    .title {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;

        user-select: none;
        pointer-events: none;

        font-size: 8.5pt;
        font-weight: bold;
        letter-spacing: 0.4pt;
    }

    .window-container {
        position: relative;
        display: flex;
        overflow: scroll;
    }

    .button {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-left: 8px;
        background-color: black;
        cursor: pointer;
    }

    .button.close {
        background-color: #ff5555;
    }
    .button.close:hover {
        background-color: #ff7f7f;
    }

    .button.minimize {
        background-color: #ffd438;
    }
    .button.minimize:hover {
        background-color: #ffe06a;
    }

    .button.maximize {
        background-color: #9ed075;
    }
    .button.maximize:hover {
        background-color: #b7e08a;
    }

    .button.unfocused {
        background-color: #b4b4b4;
    }

    .buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        height: 100%;
    }

    .tooltip {
        position: absolute;
        top: 0px;
        right: 30%;
        filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.25));
        pointer-events: none;
        z-index: 100;
    }

    .introduction {
        background-color: #ffac2f;
        border-radius: 4px;
        padding: 8px;
        font-size: 8pt;
        letter-spacing: 0.6pt;
        font-weight: bold;
        color: white;

        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .arrow {
        content: "";
        height: 0px;
        width: 0px;
        top: 0px;
        margin-left: 10px; /* 1px buffer for zooming problems while rendering*/
        border-width: 15px;
        border-color: transparent transparent #ffac2f transparent;
        border-style: solid;
    }
    .dark-mode .introduction {
        background-color: #181b21;
    }
</style>
