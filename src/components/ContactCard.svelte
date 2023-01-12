<script lang="ts">
    import { darkMode } from "../store";


    export let iconImageURL: string;
    export let targetURL: string;
    export let title: string;
    export let subtitle: string;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="contact-card"
    class:dark-mode={$darkMode}
    on:click={() => {
        window.location.href = targetURL;
    }}
>
    <div>
        <img src={iconImageURL} alt="icon" class="icon-image" />
    </div>

    <div class="profile-info">
        <div class="display-name">{title}</div>
        <div class="username">{subtitle}</div>
    </div>
</div>

<style>
    .contact-card {
        border-radius: 5px;
        border: 1px solid rgb(188, 188, 188);
        width: 100%;

        display: grid;
        grid-template-columns: 64px auto;
        box-sizing: border-box;

        cursor: pointer;

        margin-bottom: 10px;
    }
    .contact-card.dark-mode {
        border: 1px solid rgba(100, 100, 100, 0.337);
    }

    .contact-card > * {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .profile-info {
        align-items: flex-start;
        padding-top: 10px;
        padding-bottom: 10px;
    }

    .username {
        font-family: 'Roboto Mono', monospace;
        font-size: 10pt;
        opacity: 0.6;
        font-weight: normal;
    }

    .display-name {
        font-size: 14pt;
        font-weight: bold;
    }

    .icon-image {
        width: 32px;
        height: 32px;
        object-fit: contain;
    }
    .dark-mode .icon-image {
        filter: invert(1) saturate(0) brightness(90) opacity(0.6);
    }
</style>
