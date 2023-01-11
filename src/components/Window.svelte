<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";
    import { largestZIndex } from "../store";

    export class WindowInterface {
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

        setPosition(x: number, y: number): void {
            state_top = y;
            state_left = x;

            // clip window position to screen
            if (state_top < 0) state_top = 0;
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

    let state_maximized = false;

    $: state_focused = $largestZIndex === state_z_index;

    let drag = {
        offsetX: 0,
        offsetY: 0,
        dragging: false,
    };

    export const windowInterface = new WindowInterface();

    function dragManager(event: MouseEvent): void {
        if (drag.dragging) {
            windowInterface.setPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
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

    $: buttonClass = state_focused ? "button" : "button unfocused";
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="window"
    style:top={state_top + "px"}
    style:left={state_left + "px"}
    style:width={state_width + "px"}
    style:height={state_height !== null ? state_height + "px" : "auto"}
    style:display={state_visible ? "visible" : "none"}
    style:z-index={state_z_index}
    on:click={() => {
        windowInterface.focus();
    }}
>
    <div
        class="header"
        on:mousedown={(ev) => {
            drag.dragging = true;
            drag.offsetX = ev.offsetX;
            drag.offsetY = ev.offsetY;

            function release() {
                drag.dragging = false;
                window.removeEventListener("mouseup", release);
            }

            window.addEventListener("mouseup", release);
            windowInterface.focus();
        }}
    >
        <div class="buttons">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class={buttonClass + " close"}
                on:click={() => {
                    windowInterface.hide();
                }}
            />
            <div class={buttonClass + " minimize"} />
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class={buttonClass + " maximize"}
                on:click={() => {
                    state_maximized = !state_maximized;
                    if (state_maximized) {
                        windowInterface.setWindowSize(window.innerWidth, window.innerHeight);
                        windowInterface.setPosition(0, 0);
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
    </div>
    <div class="window-container">
        <slot />
    </div>
</div>

<style>
    .window {
        box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.375);
        border-radius: 6px;
        background-color: white;
        position: absolute;

        display: grid;
        grid-template-rows: 28px auto;
        border: 1px solid #e9e9e9;

        overflow: hidden;
    }

    .header {
        border-bottom: 1px solid #e9e9e9;
        position: relative;
        color: #7a7a7a;
    }
    .header:hover {
        cursor: move;
    }

    .title {
        font-size: 10pt;

        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;

        user-select: none;
    }

    .window-container {
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
    .button.button.close:hover {
        background-color: #ff7f7f;
    }

    .button.minimize {
        background-color: #ffd438;
    }

    .button.maximize {
        background-color: #9ed075;
    }

    .unfocused {
        opacity: 0.4;
        filter: saturate(0.2);
    }

    .buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        height: 100%;
    }
</style>
