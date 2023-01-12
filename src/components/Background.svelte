<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    const config = {
        backgroundColor: "#FFFFFF",
        dotColor: "#d4d4d4",
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
        let ctx = canvas.getContext("2d");

        // clear background
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fill();

        // draw dots

        ctx.fillStyle = config.dotColor;

        for (let x = config.gridOffset; x <= canvas.width; x += config.dotSpacing) {
            for (let y = config.gridOffset; y <= canvas.height; y += config.dotSpacing) {
                ctx.beginPath();
                ctx.arc(x, y, config.dotRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

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
