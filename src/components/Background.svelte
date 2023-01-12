<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { darkMode } from "../store";

    const lightColors = {
        backgroundColor: "#FFFFFF",
        dotColor: "#d4d4d4",
    };
    const darkColors = {
        backgroundColor: "#121419",
        dotColor: "#292c38",
    };

    const config = {
        dotRadius: 2,
        dotSpacing: 48,
        gridOffset: 10,
    };

    let canvas: HTMLCanvasElement;

    function resizeHandler(): void {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        drawBackground();
    }

    function drawBackground(): void {
        let colors = $darkMode ? darkColors : lightColors;
        let ctx = canvas.getContext("2d");

        // clear background
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = colors.backgroundColor;
        ctx.fill();

        // draw dots

        ctx.fillStyle = colors.dotColor;

        for (let x = config.gridOffset; x <= canvas.width; x += config.dotSpacing) {
            for (let y = config.gridOffset; y <= canvas.height; y += config.dotSpacing) {
                ctx.beginPath();
                ctx.arc(x, y, config.dotRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    darkMode.subscribe((isDarkMode) => {
        if (canvas) drawBackground();
    });

    onMount(() => {
        window.addEventListener("resize", resizeHandler);
        resizeHandler();
    });

    onDestroy(() => {
        window.removeEventListener("resize", resizeHandler);
    });
</script>

<div class="background">
    <canvas bind:this={canvas} />
</div>

<style>
    .background {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
    }
</style>
