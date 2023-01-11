<script lang="ts">
    import Background from "./components/Background.svelte";
    import ContactCard from "./components/ContactCard.svelte";
    import DefaultStyledWindowContainer from "./components/DefaultStyledWindowContainer.svelte";
    import FileExplorer from "./components/FileExplorer.svelte";
    import Window from "./components/Window.svelte";

    function makeScaledWindowDimensions(widthScale: number, aspectRatio?: number): any {
        return {
            width: window.innerWidth * widthScale,
            height: aspectRatio !== undefined ? window.innerWidth * widthScale * aspectRatio : null,
        };
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

    const isMobile = window.innerWidth < window.innerHeight;

    if (isMobile) {
        aboutMeDims = {
            ...makeScaledWindowDimensions(0.9),
            top: 10,
            left: 15,
        };

        projectsDims = {
            ...makeScaledWindowDimensions(0.9, 0.6),
            left: 17,
            bottom: 10,
        };
    } else {
        aboutMeDims = {
            ...makeScaledWindowDimensions(0.45),
            top: 10,
            left: 15,
        };

        projectsDims = {
            ...makeScaledWindowDimensions(0.5, 0.8),
            top: 10,
            right: 10,
        };
    }
</script>

<main>
    <Background />

    <Window config={{...aboutMeDims, title: "About Me"}}>
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
                            exploring the projects highlighted on my Github. You can also interact
                            with many of the items on this page.
                        </p>
                    </div>
                </div>
            </div>
        </DefaultStyledWindowContainer>
    </Window>
    <Window
        config={{
            ...makeScaledWindowDimensions(0.4, 0.5),
            left: 18,
            bottom: 20,
            title: "Contact Info",
        }}
    >
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
    <Window config={{...projectsDims, title: "File Explorer"}}>
        <FileExplorer></FileExplorer>
    </Window>
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
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
