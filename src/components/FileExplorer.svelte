<script lang="ts" context="module">
    import { darkMode } from "../store";
    import FileList, { FileInfo } from "./FileList.svelte";

    export interface ProjectInfo {
        name: string;
        tags: string[];
        year: number;
        description: string;
        link: string;
    }

    export interface BlogArticleInfo {
        name: string;
        tags: string[];
        publishDate: Date;
        description: string;
        link: string;
    }

    export function projectInfoToFileInfo(project: ProjectInfo): FileInfo {
        return {
            displayName: project.name,
            fileName: project.name.toLowerCase().replace(" ", "_").replace("-", "_") + ".proj",
            isFolder: true,
            tags: project.tags,
            year: project.year,
            description: project.description,
        };
    }

    export function blogInfoToFileInfo(blog: BlogArticleInfo): FileInfo {
        let d = blog.publishDate;
        return {
            displayName: blog.name,
            fileName: `${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}.docx`,
            isFolder: false,
            tags: blog.tags,
            year: blog.publishDate.getFullYear(),
            description: blog.description,
        };
    }

    export const projects: ProjectInfo[] = [
        {
            name: "Oui-Eat",
            tags: ["React Native", "Java", "MongoDB", "UofT"],
            year: 2022,
            description:
                "A combined social media app and crowd-sourced review platform for restaurants and other food businesses.",
            link: "https://github.com/iahuang/oui-eat",
        },
        {
            name: "NeX",
            tags: ["Node", "Typescript", "LaTeX"],
            year: 2022,
            description:
                "A custom-built markup language designed for efficient note-taking and drafting math and computer science-related documents.",
            link: "https://github.com/nex-project/nex",
        },
        {
            name: "CoVariant",
            tags: ["Python", "Deep Learning", "UofT"],
            year: 2021,
            description:
                "Machine learning project for determining the impact of various demographic factors in the outcome of COVID-19.",
            link: "https://github.com/iahuang/covariant",
        },
        {
            name: "Theta",
            tags: ["Python", "Algorithm Analyis"],
            year: 2021,
            description: "A multi-variable time complexity analysis library written in Python",
            link: "https://github.com/iahuang/theta",
        },
        {
            name: "Taro",
            tags: ["Typescript", "HTML/CSS"],
            year: 2020,
            description: "A modern web framework inspired by Svelte and ReactJS.",
            link: "https://github.com/iahuang/taro",
        },
        {
            name: "JAtari",
            tags: ["Java"],
            description: "A work-in-progress Atari 2600 emulator written in Java.",
            year: 2018,
            link: "https://github.com/iahuang/JAtari",
        },
    ];
</script>

<script lang="ts">
    const tagColors = {
        typescript: "#2F73BF",
        python: "#f8ae26",
        azure: "#0285D0",
        node: "#7EC728",
        java: "#E01F22",
        "html/css": "#E36028",
        uoft: "#012B64",
        mongodb: "#04AB4E",
    };
    const tagColorDefault = "#a6a6a6";
</script>

<div class="main" class:dark-mode={$darkMode} >
    <span class="section-header">projects/</span>
    <hr />

    <FileList
        files={projects.map((p) => projectInfoToFileInfo(p))}
        {tagColors}
        {tagColorDefault}
        onClick={(file) => {
            // find corresponding project
            let project = projects.find((p) => p.name === file.displayName);
            window.location.href = project.link;
        }}
    />
    <div style="height: 20px;" />
</div>

<style>
    .main {
        padding: 30px;
        width: 100%;
        text-align: left;
    }

    .section-header {
        display: block;
        font-size: 16pt;
        margin-bottom: 10px;
        font-weight: bold;
        font-family: "Roboto Mono", monospace;
    }

    hr {
        border: none;
        border-bottom: 1px solid rgb(203, 203, 203);
        margin-top: 0;
        margin-bottom: 20px;
        box-sizing: border-box;
        height: 1px;
    }
    .dark-mode hr {
        border-bottom: 1px solid rgba(203, 203, 203, 0.2);
    }
</style>
