<script lang="ts">
    import Background from "./components/Background.svelte";
    import ContactCard from "./components/ContactCard.svelte";
    import DefaultStyledWindowContainer from "./components/DefaultStyledWindowContainer.svelte";
    import FileExplorer from "./components/FileExplorer.svelte";
    import StatusBar from "./components/StatusBar.svelte";
    import Terminal from "./components/Terminal.svelte";
    import Window from "./components/Window.svelte";

    import { darkMode, terminalWindowInterface } from "./store";

    function makeScaledWindowDimensions(
        widthScale: number,
        aspectRatio?: number
    ): { width: number; height: number | null } {
        return {
            width: window.innerWidth * widthScale,
            height: aspectRatio !== undefined ? window.innerWidth * widthScale * aspectRatio : null,
        };
    }

    function centerWindow(scaledWidth: number, scaledCenter: number): number {
        return (scaledCenter - scaledWidth / 2) * window.innerWidth;
    }

    interface Dimensions {
        width: number;
        height: number | null;
        top?: number;
        left?: number;
        bottom?: number;
        right?: number;
    }

    let aboutMeDims: Dimensions;
    let projectsDims: Dimensions;
    let contactDims: Dimensions;
    let terminalDims: Dimensions;

    const isMobile = window.innerWidth < window.innerHeight;

    if (isMobile) {
        aboutMeDims = {
            ...makeScaledWindowDimensions(0.9),
            top: 20,
            left: 15,
        };

        projectsDims = {
            ...makeScaledWindowDimensions(0.9, 0.6),
            left: 17,
            bottom: 10,
        };

        contactDims = {
            ...makeScaledWindowDimensions(0.9, 0.5),
            left: 19,
            bottom: 20,
        };

        terminalDims = {
            ...makeScaledWindowDimensions(0.9, 0.6),
            left: 0.24 * window.innerWidth,
            bottom: 43,
        };
    } else {
        aboutMeDims = {
            ...makeScaledWindowDimensions(0.45),
            top: 20,
            left: centerWindow(0.45, 0.4),
        };

        projectsDims = {
            ...makeScaledWindowDimensions(0.7, 0.5),
            top: 0.1 * window.innerHeight,
            left: centerWindow(0.8, 0.55),
        };

        contactDims = {
            ...makeScaledWindowDimensions(0.37),
            left: centerWindow(0.37, 0.7),
            top: window.innerHeight * 0.5,
        };

        terminalDims = {
            ...makeScaledWindowDimensions(0.48, 0.6),
            left: centerWindow(0.48, 0.6),
            bottom: 43,
        };
    }
</script>

<main class:dark-mode={$darkMode}>
    <Background />
    <StatusBar />
    <Window config={{ ...projectsDims, title: "File Explorer" }}>
        <FileExplorer />
    </Window>
    <Window
        config={{ ...terminalDims, title: "Terminal" }}
        bind:windowInterface={$terminalWindowInterface}
    >
        <Terminal />
    </Window>
    <Window config={{ ...contactDims, title: "Contact Info" }}>
        <DefaultStyledWindowContainer>
            <span class="title"> Contact </span>
            <ContactCard
                iconImageURL="/images/github.png"
                targetURL="https://github.com/iahuang"
                title="Github"
                subtitle="github.com/iahuang"
            />
            <ContactCard
                iconImageURL="/images/linkedin.png"
                targetURL="https://www.linkedin.com/in/ian-a-huang/"
                title="LinkedIn"
                subtitle="linkedin.com/in/ian-a-huang/"
            />
            <ContactCard
                iconImageURL="/images/email.png"
                targetURL="mailto:ia.huang@mail.utoronto.ca"
                title="Email"
                subtitle="ia.huang@mail.utoronto.ca"
            />
        </DefaultStyledWindowContainer>
    </Window>
    <Window config={{ ...aboutMeDims, title: "About Me" }}>
        <DefaultStyledWindowContainer>
            <div class="biography-container">
                <div>
                    <img class="pfp" src="/images/pfp.jpeg" alt="Profile" />
                </div>
                <div style="margin-left: 30px; margin-right: 10px">
                    <span class="title" style="font-size: 24pt;">Ian Huang</span>
                    <div>
                        <p>
                            Hi, I'm a software developer and student at the University of Toronto
                            with specific interests in web development, systems programming, and
                            machine learning.
                        </p>
                        <p>
                            You can learn more about my work using the window on the right or by
                            exploring the projects highlighted on my Github.
                        </p>
                        <p>
                            The source code for this website can also be found
                            <a href="https://github.com/iahuang/homepage">here</a>.
                        </p>
                    </div>
                </div>
            </div>
        </DefaultStyledWindowContainer>
    </Window>
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;

        color: #484848;
    }
    main.dark-mode {
        color: #cad3d8;
    }

    main.dark-mode > :global(a) {
        color: #cad3d8;
    }
    main.dark-mode :global(a:visited) {
        color: #7bbadd;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }

    .pfp {
        border-radius: 100%;
        object-fit: cover;
        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.446));
        width: 100%;
        height: auto;
    }

    .biography-container {
        display: grid;
        grid-template-columns: 20% auto;
    }
</style>
