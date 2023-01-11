<div class="container">
    <slot />
</div>

<style>
    .container {
        padding-left: 20px;
        padding-right: 20px;
        padding-top: 10px;
        padding-bottom: 10px;
        width: 100%;
        text-align: start;
    }

    .container :global(h1) {
        margin: 0;
        margin-bottom: 10px;
    }

    .container :global(span.title) {
        display: block;
        text-align: center;
        width: 100%;
        font-weight: bold;
        font-size: 18pt;
        margin-bottom: 10px;
    }

    
</style>
