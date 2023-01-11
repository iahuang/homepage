<script lang="ts">
    export let projectName: string;
    export let projectDescription: string;
    export let projectTags: string[];
</script>

<div class="tile">
    <div class="ellipsis">
        <div></div>
        <div></div>
        <div></div>
    </div>
    <div class="centered">
        <img class="project-icon" src="/images/app.svg" alt="App icon" />
    </div>
    <div class="centered">
        <div>
            <div class="project-name">{projectName}</div>
            <div class="project-file">
                {projectName.toLowerCase().replace(" ","_").replace("-","_")}.proj
            </div>
        </div>
    </div>
</div>

<style>
    .tile {
        border-radius: 5px;
        border: 1px solid rgb(156, 156, 156);
        width: 13vw;
        height: 13vw;

        display: grid;
        grid-template-rows: 8vw 5vw;

        box-sizing: border-box;
        margin: 10px;

        position: relative;

        cursor: pointer;
    }
    .tile:hover {
        background-color: #fafafa;
    }

    .centered {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .project-icon {
        opacity: 0.4;
        width: 3.5vw;
        height: 3.5vw;
        object-fit: contain;
        height: auto;
        margin: 25px;
    }

    .ellipsis {
        position: absolute;
        display: flex;
        flex-direction: row;
        right: 0;
        margin: 8px;
    }

    .ellipsis > div {
        width: 4px;
        height: 4px;
        margin: 1.5px;
        background-color: rgb(148, 148, 148);
        border-radius: 100%;
    }

    .project-name {
        font-size: min(2vw, 14pt);
        font-weight: bold;
        margin-bottom: 5px;
    }

    .project-file {
        font-family: 'Roboto Mono', monospace;
        font-size: 1vw;
        opacity: 0.3;
    }

</style>
