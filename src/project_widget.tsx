import { Component } from "react";

interface IProps {
    name: string;
    image?: string;
    isLogo?: boolean;
    description: string;
    href: string;
}

interface IState {}

export default class ProjectWidget extends Component<IProps, IState> {
    makeImage() {
        if (this.props.image) {
            return (
                <div className="project-image">
                    <img src={this.props.image}></img>
                    {!this.props.isLogo ? <div className="overlay"></div> : null}
                </div>
            );
        } else {
            return null;
        }
    }
    render() {
        return (
            <div className="project" onClick={()=>{
                window.location.href = this.props.href;
            }}>
                <h1>{this.props.name}</h1>
                {this.makeImage()}
                <span className="description">{this.props.description}</span>
            </div>
        );
    }
}
