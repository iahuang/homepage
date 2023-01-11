<script>
    import ProjectTile from "./ProjectTile.svelte";
</script>

<div class="main">
    <span class="section-header">Projects</span>
    <div class="tile-view">
        <ProjectTile
            projectName="NeX"
            projectDescription="A custom-built markup language designed for efficient note-taking and drafting math and computer science-related documents."
            projectTags={[]}
        />
        <ProjectTile
            projectName="CoVariant"
            projectDescription="Machine learning project for determining the impact of various demographic factors in the outcome of COVID-19."
            projectTags={[]}
        />
        <ProjectTile
            projectName="Oui-Eat"
            projectDescription="A combined social media app and crowd-sourced review platform for restaurants and other food businesses."
            projectTags={[]}
        />
        <ProjectTile
            projectName="NeX"
            projectDescription="A custom-built markup language designed for efficient note-taking and drafting math and computer science-related documents."
            projectTags={[]}
        />
    </div>
</div>

<style>
    .main {
        padding: 30px;
        width: 100%;
    }

    .section-header {
        display: block;
        font-size: 16pt;
        margin-bottom: 20px;
        font-weight: bold;
    }

    .tile-view {
        display: flex;
        flex-wrap: wrap;
    }
</style>
