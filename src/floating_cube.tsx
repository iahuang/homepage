import { timeStamp } from "console";
import { Component } from "react";

interface IProps {
    x: number;
    y: number;
    z: number;
    img: string;
    scale: number;
}

interface IState {
    x: number;
    y: number;
    scroll: number;
}

export default class FloatingCube extends Component<IProps, IState> {
    t: number;
    speed: number;

    constructor(props: IProps) {
        super(props);

        this.state = {
            x: this.props.x,
            y: this.props.y,
            scroll: window.scrollY,
        };

        this.t = Math.random() * 2 * 3.141;
        this.speed = Math.random() + 0.5;
    }

    componentDidMount() {
        const animInterval = 20;
        const deltaTime = animInterval / 1000;

        window.setInterval(() => {
            this.t += this.speed * deltaTime;
            this.setState({
                y: this.props.y + (Math.sin(this.t) * 50 / this.props.z),
            });
        }, animInterval);

        window.addEventListener("scroll", () => {
            this.setState({ scroll: window.scrollY });
        });
    }

    render() {
        return (
            <div
                className="floating-cube"
                style={{
                    top: this.state.y - (this.state.scroll * 0.5 / this.props.z),
                    left: this.state.x,
                }}
            >
                <img src={this.props.img}></img>
            </div>
        );
    }
}
