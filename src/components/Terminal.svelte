<script lang="ts" context="module">
    declare const BrowserFS;
    import * as fs from "fs";
    import * as path from "path";
    import { projectInfoToFileInfo, projects } from "./FileExplorer.svelte";
    import FontFaceObserver from "fontfaceobserver";

    BrowserFS.configure({ fs: "InMemory" }, () => {
        fileSystemReady.set(true);
    });

    fileSystemReady.subscribe((ready) => {
        if (!ready) return;

        fs.mkdirSync("/projects");

        for (let project of projects) {
            fs.writeFileSync(
                "/projects/" + projectInfoToFileInfo(project).fileName,
                project.description
            );
        }

        fs.writeFileSync("/README.txt", 'wow u found me :O\r\nuse "enable-gravity"');
    });

    /**
     * Adapted from https://github.com/CoderPad/xterm-webfont
     */
    class XtermWebfont implements ITerminalAddon {
        _terminal: Terminal;

        activate(terminal) {
            this._terminal = terminal;

            terminal.loadWebfontAndOpen = (element) => {
                const fontFamily = this._terminal.options.fontFamily;
                const regular = new FontFaceObserver(fontFamily).load();
                const bold = new FontFaceObserver(fontFamily, { weight: "bold" }).load();

                return (regular.constructor as any).all([regular, bold]).then(
                    () => {
                        this._terminal.open(element);
                        return this;
                    },
                    () => {
                        this._terminal.options.fontFamily = "Courier";
                        this._terminal.open(element);
                        return this;
                    }
                );
            };
        }

        dispose() {
            delete (this._terminal as any).loadWebfontAndOpen;
        }
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import xterm, { ITerminalAddon, Terminal } from "xterm";
    import { FitAddon } from "xterm-addon-fit";
    import { darkMode, fileSystemReady, terminalWindowInterface } from "../store";
    import { get } from "svelte/store";
    import type { WindowInterface } from "./Window.svelte";

    const term = new xterm.Terminal({
        fontFamily: "Roboto Mono",
    });

    let terminalLoaded = false;

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.loadAddon(new XtermWebfont());

    let target: HTMLElement;
    let promptLength = 0;

    let currentDirectory = "/";

    let physics = {
        vx: 0,
        vy: 0,
        enabled: false,
        gravity: 600,
        interval: null,
    };

    function prompt(): void {
        term.write(`user@ianhuang.dev ${currentDirectory} % `, () => {
            promptLength = term.buffer.active.cursorX;
        });
    }

    function getCurrentInput(): string {
        let currentLine = term.buffer.active
            .getLine(term.buffer.active.cursorY + term.buffer.active.viewportY)
            .translateToString(true);

        // console.log(
        //     Array(term.buffer.active.cursorY + term.buffer.active.viewportY + 1)
        //         .fill(null)
        //         .map(
        //             (_, i) =>
        //                 (i < 10 ? " " : "") +
        //                 i.toString() +
        //                 " " +
        //                 term.buffer.active.getLine(i).translateToString(true)
        //         )
        //         .join("\n")
        // );

        return currentLine.slice(promptLength);
    }

    function executeCommandSafely(executor: () => void): void {
        try {
            executor();
        } catch (e) {
            if (e.message) {
                term.writeln(e.message);
                return;
            }
            term.writeln("An unknown error occurred");
        }
    }

    function handleCommandExecution(input: string): void {
        term.write("\r\n");

        if (!get(fileSystemReady)) {
            term.writeln("error: wait for filesystem to initialize");
            return;
        }
        console.log(input);
        // filter out empty strings
        let parts = input.split(" ").filter((p) => p.length);
        let args = parts.slice(1);
        let command = parts[0];

        if (!command) {
            return;
        }

        function canonicalizePath(p: string): string {
            return path.resolve(currentDirectory, p);
        }

        switch (command) {
            case "ls":
                executeCommandSafely(() => {
                    let targetDir = canonicalizePath(args[0] ?? currentDirectory);

                    for (let item of fs.readdirSync(targetDir)) {
                        term.writeln(item);
                    }
                });
                break;
            case "cd":
                executeCommandSafely(() => {
                    let targetDir = canonicalizePath(args[0] ?? currentDirectory);

                    if (!fs.existsSync(targetDir)) {
                        term.writeln("No such directory: " + targetDir);
                        return;
                    }
                    if (!fs.lstatSync(targetDir).isDirectory()) {
                        term.writeln("Not a directory: " + targetDir);
                        return;
                    }

                    currentDirectory = path.resolve(targetDir);
                });
                break;
            case "cat":
                executeCommandSafely(() => {
                    if (!args[0]) return;

                    let target = canonicalizePath(args[0]);

                    term.writeln(fs.readFileSync(target, "utf-8"));
                });
                break;
            case "enable-gravity":
                let termWindow: WindowInterface = get(terminalWindowInterface);

                if (physics.enabled) {
                    term.writeln("gravity is already enabled lmao");
                    break;
                }

                physics.enabled = true;
                const deltaTimeMs = 20;
                const deltaTime = deltaTimeMs / 1000;

                physics.vx += (Math.random() - 0.5) * 400;

                physics.interval = window.setInterval(() => {
                    let { x, y } = termWindow.getPosition();

                    physics.vy += physics.gravity * deltaTime;

                    x += physics.vx * deltaTime;
                    y += physics.vy * deltaTime;

                    if (y + termWindow.getDimensions().height > window.innerHeight) {
                        physics.vy *= -1;
                    }

                    if (x + termWindow.getDimensions().width > window.innerWidth) {
                        physics.vx *= -1;
                    }

                    if (x < 0) {
                        physics.vx *= -1;
                    }

                    termWindow.setPosition(x, y);
                }, deltaTimeMs);
                break;
            case "disable-gravity":
                if (!physics.enabled) {
                    term.writeln("gravity is already disabled lmao");
                    break;
                }

                physics.enabled = false;
                window.clearInterval(physics.interval);
                break;
            case "fullscreen":
                document.body.requestFullscreen();
                break;
            case "reset":
                localStorage.clear();
                window.location.reload();
                break;
            case "clear":
                term.clear();
                break;
            case "mkdir":
                executeCommandSafely(() => {
                    if (!args[0]) return;

                    let target = canonicalizePath(args[0]);

                    fs.mkdirSync(target);
                });
                break;
            case "rm":
                executeCommandSafely(() => {
                    if (!args[0]) return;

                    let target = canonicalizePath(args[0]);
                    
                    if (fs.lstatSync(target).isDirectory()) {
                        fs.rmdirSync(target);
                    } else {
                        fs.unlinkSync(target);
                    }
                });
                break;
            default:
                term.writeln(`Unrecognized command "${command}"`);
        }
    }

    onMount(() => {
        (term as any).loadWebfontAndOpen(target);
        fitAddon.fit();
        prompt();

        terminalLoaded = true;

        term.onData((char) => {
            switch (char) {
                case "\u0003": // Ctrl+C
                    term.write("^C");

                    break;
                case "\r": // Enter
                    handleCommandExecution(getCurrentInput());
                    prompt();
                    break;
                case "\u007F": // Backspace (DEL)
                    // Do not delete the prompt
                    if (term.buffer.active.cursorX > promptLength) {
                        term.write("\b \b");
                    }
                    break;
                default: // Print all other characters for demo
                    if (char.length === 1) term.write(char);
            }
        });
    });

    const baseTheme = {
        foreground: "#F8F8F8",
        background: "#2D2E2C",
        selection: "#5DA5D533",
        black: "#1E1E1D",
        brightBlack: "#262625",
        red: "#CE5C5C",
        brightRed: "#FF7272",
        green: "#5BCC5B",
        brightGreen: "#72FF72",
        yellow: "#CCCC5B",
        brightYellow: "#FFFF72",
        blue: "#5D5DD3",
        brightBlue: "#7279FF",
        magenta: "#BC5ED1",
        brightMagenta: "#E572FF",
        cyan: "#5DA5D5",
        brightCyan: "#72F0FF",
        white: "#F8F8F8",
        brightWhite: "#FFFFFF",
    };

    const darkTheme = {
        foreground: "#CAD3D8",
        background: "#181B21",
        selection: "#5DA5D533",
        black: "#1E1E1D",
        brightBlack: "#262625",
        red: "#CE5C5C",
        brightRed: "#FF7272",
        green: "#5BCC5B",
        brightGreen: "#72FF72",
        yellow: "#CCCC5B",
        brightYellow: "#FFFF72",
        blue: "#5D5DD3",
        brightBlue: "#7279FF",
        magenta: "#BC5ED1",
        brightMagenta: "#E572FF",
        cyan: "#5DA5D5",
        brightCyan: "#72F0FF",
        white: "#CAD3D8",
        brightWhite: "#FFFFFF",
    };

    term.options.theme = baseTheme;

    let currentTheme = get(darkMode) ? darkTheme : baseTheme;

    darkMode.subscribe((dark) => {
        currentTheme = get(darkMode) ? darkTheme : baseTheme;
        term.options.theme = currentTheme;

        if (terminalLoaded) term.refresh(0, term.rows - 1);
    });
</script>

<div class="main" bind:this={target} style:background-color={currentTheme.background} />

<style>
    .main {
        width: 100%;
        height: 100%;
        text-align: left;
        padding: 10px;
        box-sizing: border-box;
        overflow-y: auto;
        overflow-x: hidden;
    }
</style>
