<script context="module" lang="ts">
    import type { WindowInterface } from "./Window.svelte";

    export function addWindowToStatusBar(window: WindowInterface) {
        minimizedWindows.update((items) => {
            items.push(window);
            return items;
        });
    }

    export function removeWindowFromStatusBar(window: WindowInterface) {
        minimizedWindows.update((items) => {
            items = items.filter((item) => item.getWindowID() !== window.getWindowID());
            return items;
        });
    }
</script>

<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { statusBarHeight, minimizedWIndows as minimizedWindows, darkMode } from "../store";

    let time = new Date();
    let interval: number;
    let statusBar: HTMLDivElement;

    onMount(() => {
        interval = window.setInterval(() => {
            time = new Date();
        }, 1000);

        statusBarHeight.set(statusBar.offsetHeight);
    });

    onDestroy(() => {
        clearInterval(interval);
    });

    function dateAsAMPMTime(time: Date) {
        let hours = time.getHours();
        let minutes = time.getMinutes();
        let ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        let strMinutes = minutes < 10 ? "0" + minutes : minutes;
        let strTime = hours + ":" + strMinutes + " " + ampm;
        return strTime;
    }

    function dateAsWeekdayMonthDate(date: Date) {
        let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        return days[date.getDay()] + " " + months[date.getMonth()] + " " + date.getDate();
    }

    let state_minimizedWindows: WindowInterface[] = [];
    minimizedWindows.subscribe((items) => {
        state_minimizedWindows = items;
    });
</script>

<div class="status-bar" bind:this={statusBar} class:dark-mode={$darkMode}>
    <span class="status-items left">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
            style="cursor: pointer;"
            on:click={() => {
                darkMode.update((value) => !value);
            }}
        >
            <span class="material-symbols-rounded thick">{$darkMode ? "light_mode" : "dark_mode"}</span>
        </div>

        <div class="status-item minimized-windows">
            {#each state_minimizedWindows as minimizedWindow}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <span
                    class="minimized-window"
                    on:click={() => {
                        minimizedWindow.show();
                        minimizedWindow.focus();
                        removeWindowFromStatusBar(minimizedWindow);
                    }}
                >
                    <span>{minimizedWindow.getTitle()}</span>
                    <span class="material-symbols-rounded window-icon"> web_asset </span>
                </span>
            {/each}
        </div>
    </span>
    <span class="status-items right">
        <div class="status-item decorative-icon">
            <span class="material-symbols-rounded thick" style="font-size: 14pt">bluetooth</span>
        </div>
        <div class="status-item decorative-icon">
            <span class="material-symbols-rounded thick" style="font-size: 14pt">wifi</span>
        </div>
        <div class="status-item decorative-icon">
            <span class="material-symbols-rounded thick" style="font-size: 14pt">volume_up</span>
        </div>
        <div class="status-item date-time">{dateAsWeekdayMonthDate(time)}</div>
        <div class="status-item date-time">{dateAsAMPMTime(time)}</div>
    </span>
</div>

<style>
    .status-bar {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        min-height: 30px;

        display: flex;
        flex-direction: row;
        justify-content: space-between;

        background-color: rgba(255, 255, 255, 0.215);

        backdrop-filter: blur(3px);
        border-bottom: 1px solid #e9e9e9;
        padding-top: 5px;
        padding-bottom: 5px;
        padding-right: 10px;
        padding-left: 10px;

        color: #7a7a7a;

        box-sizing: border-box;
    }

    .dark-mode.status-bar {
        background-color: rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid #e9e9e916;
        color: rgba(255, 255, 255, 0.5);
    }

    .status-items {
        display: flex;
        flex-direction: row;
        align-items: center;
        user-select: none;
    }

    .status-item {
        margin-left: 8px;
        margin-right: 8px;
    }

    .date-time {
        font-size: 10pt;
        font-weight: bold;
        letter-spacing: 0.5pt;
    }

    .minimized-windows {
        display: flex;
    }

    .minimized-window {
        font-size: 10pt;
        background-color: rgba(197, 197, 197, 0.419);
        border-radius: 5px;

        padding-left: 8px;
        padding-right: 8px;
        padding-top: 2px;
        padding-bottom: 2px;

        margin-left: 2px;
        margin-right: 2px;

        display: flex;
        flex-direction: row;
        align-items: center;

        cursor: pointer;
    }
    .minimized-window:hover {
        background-color: rgba(197, 197, 197, 0.3);
    }

    .dark-mode .minimized-window {
        background-color: rgba(197, 197, 197, 0.64);
        color: black;
    }

    .window-icon {
        margin-left: 5px;
        font-size: 14pt;
    }

    .decorative-icon {
        opacity: 0.4;
        margin-left: 8px;
        margin-right: 8px;
    }
</style>
