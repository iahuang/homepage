<script lang="ts" context="module">
    export interface FileInfo {
        displayName: string;
        fileName: string;
        isFolder: boolean;
        tags: string[];
        year: number;
        description: string;
    }
</script>

<script lang="ts">
    import { darkMode } from "../store";


    export let tagColors: { [k: string]: string };
    export let tagColorDefault: string;
    export let files: FileInfo[];
    export let onClick: (file: FileInfo) => void;

    function getTagColor(tag: string): string {
        return tagColors[tag] ?? tagColorDefault;
    }

    function fontSizeFromName(name: string): string {
        if (name.length <= 20) {
            return "11pt";
        } else if (name.length <= 30) {
            return "9pt";
        } else if (name.length <= 40) {
            return "7pt";
        } else {
            return "6pt";
        }
    }
</script>

<table>
    <tr class:dark-mode={$darkMode}>
        <th style="width: 5%" />
        <th style="width: 15%">Name</th>
        <th style="width: 6%">Year</th>
        <th style="width: 45%">Description</th>
        <th>Tags</th>
    </tr>
    <tr class="spacer" />
    {#each files as file}
        <tr
            class="file-row"
            class:dark-mode={$darkMode}
            on:click={() => {
                onClick(file);
            }}
        >
            <td class="icon"
                ><span class="material-symbols-outlined"
                    >{file.isFolder ? "folder_open" : "description"}</span
                ></td
            >
            <td>
                <div class="file-info">
                    <span
                        class="file-display-name"
                        style:font-size={fontSizeFromName(file.displayName)}
                        >{file.displayName}</span
                    >
                    <span class="file-name">{file.fileName}</span>
                </div>
            </td>
            <td>{file.year}</td>
            <td class="description">
                <div class="vcenter">
                    <span class="desc-text">{file.description}</span>
                </div>
            </td>
            <td>
                <div class="tags">
                    {#each file.tags as tag}
                        <span
                            class="tag"
                            style="background-color: {tagColors[tag.toLowerCase()] ??
                                tagColorDefault}">{tag}</span
                        >
                    {/each}
                </div>
            </td>
        </tr>
    {/each}
</table>

<style>
    .file-row:hover {
        cursor: pointer;
        opacity: 0.65;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .file-info {
        display: flex;
        flex-direction: column;
        margin-top: 7px;
        margin-bottom: 7px;
    }

    .file-display-name {
        font-size: 11pt;
        font-weight: bold;
    }

    .file-name {
        font-family: "Roboto Mono", monospace;
        font-size: 7pt;
        opacity: 0.6;
    }

    .icon {
        font-size: 5pt;
    }

    .icon > .material-symbols-outlined {
        font-size: 16pt;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .file-row > td {
        height: 20px;
        font-size: 10pt;
    }

    .file-row:nth-child(2n + 1) {
        background-color: rgb(244, 244, 244);
    }
    .file-row:nth-child(2n + 1).dark-mode {
        background-color: #1D2027;
    }

    .file-row > td:first-child {
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }
    .file-row > td:last-child {
        border-bottom-right-radius: 10px;
        border-top-right-radius: 10px;
    }

    .description {
        height: 100%;
        position: relative;
        opacity: 0.8;

        font-weight: 500;
    }

    .vcenter {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
    }

    .desc-text {
        white-space: nowrap;
        text-overflow: ellipsis;
        top: 0;
        font-size: 8pt;
        overflow: hidden;
        width: 100%;
    }

    th:nth-child(n + 2) {
        border-left: 1px solid rgb(227, 227, 227);
    }
    tr.dark-mode > th:nth-child(n + 2) {
        border-left: 1px solid rgba(227, 227, 227, 0.2);
    }

    th {
        padding-top: 5px;
        padding-bottom: 5px;
    }

    th,
    td {
        padding-left: 10px;
        box-sizing: border-box;
    }

    .spacer {
        height: 10px;
    }

    .tag {
        display: inline-block;
        background-color: #f8ae26;
        color: white;
        border-radius: 5px;
        padding: 2px 5px;
        margin-right: 5px;
        margin-bottom: 2px;
        font-size: 8pt;
        opacity: 0.8;
        font-family: "Roboto Mono", monospace;
    }
</style>
