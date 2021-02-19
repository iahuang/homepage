import { Component } from "react";
import { randChance, randInt } from "./util";

interface IProps {
    targetProgram: string;
}

interface IState {
    codeTypingPosition: number;
    isCursorVisible: boolean;
}

export default class CodeHeader extends Component<IProps, IState> {
    timeToNextChar = 100;
    lastTypedCharTime: number;
    animInterval?: number;

	lastCursorBlinkTime: number;

	typingPaused = false;

	targetProgram: string[];

    constructor(props: IProps) {
        super(props);

        this.state = {
            codeTypingPosition: 0,
            isCursorVisible: false,
        };

		this.targetProgram = props.targetProgram.split("");
        let targetProgram = [];
        let seq = "";
        let i = 0;
        while (i < this.targetProgram.length) {
            let c = this.targetProgram[i]
            if (c==" ") {
                seq+=c;
            }
            if (c!=" ") {
                if (seq) {
                    targetProgram.push(seq);
                }
                targetProgram.push(c);
                
               
                seq = "";
            }
            i++;
        }
        this.targetProgram = targetProgram;

        this.lastTypedCharTime = Date.now();
		this.lastCursorBlinkTime = Date.now();
    }
    componentDidMount() {
        this.animInterval = window.setInterval(() => {
            this.animLoop();
        }, 20);
    }

    componentWillUnmount() {
        window.clearInterval(this.animInterval!);
    }

    animLoop() {
        let timeSinceLastChar = Date.now() - this.lastTypedCharTime;

        if (timeSinceLastChar >= this.timeToNextChar && !this.typingPaused) {
            this.timeToNextChar = randInt(20, 200);
			if (randChance(0.01)) {
				this.timeToNextChar = 1000;
			}
            this.lastTypedCharTime = Date.now();
            this.typeChar();
        }

		if (Date.now() - this.lastCursorBlinkTime >= 500) {
			this.lastCursorBlinkTime = Date.now();
			this.toggleCursor();
		}

		if (timeSinceLastChar <= 500) {
			this.setCursorState(true);
		}
    }

	stopTyping() {
		this.typingPaused = true;
	}

    typeChar() {
        this.setState({
            codeTypingPosition: this.state.codeTypingPosition + 1,
        });

		if (this.state.codeTypingPosition === this.props.targetProgram.length) {
			this.stopTyping();
		}
    }

	toggleCursor() {
		this.setState({
			isCursorVisible: !this.state.isCursorVisible
		});
	}

	setCursorState(visible: boolean) {
		this.setState({
			isCursorVisible: visible
		});
	}

    delChar() {
        this.setState({
            codeTypingPosition: this.state.codeTypingPosition - 1,
        });
    }

    render() {
        let codeText = this.targetProgram.slice(
            0,
            this.state.codeTypingPosition
        ).join("");

		if (this.state.isCursorVisible) {
			codeText+="▓";
		}
        return (
            <pre>
                <code>
                    {codeText}
                </code>
            </pre>
        );
    }
}
