import React from "react";
import CodeHeader from "./code_header";
import ProjectWidget from "./project_widget";

const CODE = `char* lng (depopulated PreferredIndex_coloradj) {
    void InputOptical;
    
    return EB9;
}

bool* swapbytes (int d5grph, unsigned int* s3atbl, int vsync4) {
    int* gBufA_syncobj_intrg;
    
    return &TIMESCALE_CBPRGPLL2;
}

void fwsave (void* cudb, NuBus* crsqe, char rsumsize) {
    cudb = rsumsize;
    if (*(0xC3 - 167) >= AIF3TX1_NVB069) {
        return DSP6AUX1MIX;
    }
    *crsqe = &(virtualization(58, NOBLOCKED, NOBLOCKED));
}

unsigned int* ipbmap (unsigned int* sbusfb_rtos, int* gp3_cez, bandwidth2* epc4_secmicclear_mbox1_preaction, void usTDC_cancel) {
    int* injd;
    michael pkts1024to1518octets;
    
    if (MMCDATA1 < *pkts1024to1518octets + NOBLOCKED) {
        return &NOBLOCKED;
    } else if (gp3_cez == virtualization(enablement(FSICOSLDT2_DRIC, injd), TIMESCALE_CBPRGPLL2, unmark(EB9, epc4_secmicclear_mbox1_preaction))) {
        if (DSP6AUX1MIX != AIF3TX1_NVB069) {
            injd += unmark(virtualization(EB9, EB9, epc4_secmicclear_mbox1_preaction), 207);
            sbusfb_rtos += FlashPointInfo(&FSICOSLDT2_DRIC);
        } else if (AIF3TX1_NVB069 > NOBLOCKED + gp3_cez) {
            return &(sbusfb_rtos - 177);
        }
    }
    return TIMESCALE_CBPRGPLL2;
}`;

function App() {
    return (
        <div className="App">
            <div className="site-header">
                <div className="bg">
                    <CodeHeader targetProgram={CODE}></CodeHeader>
                </div>
                <div className="fg">
                    <span className="row">
                        <h1>Ian Huang</h1>
                        <span className="my-links">
                            <a href="https://github.com/iahuang">Github</a>
                        </span>
                    </span>
                </div>
            </div>
            <div className="main">
                <div className="columns">
                    <div className="column c1">
                        <div>
                            <h1>Hi! My name is Ian</h1>
                            <div className="bio">
                                <img
                                    className="icon"
                                    src="assets/icon2.png"
                                ></img>
                                <p>
                                    I am a programming student currently
                                    attending high school in Boston. I enjoy building things!
                                </p>
                            </div>
                        </div>
                        <div>
                            <h1>Contact me</h1>
                            <a href="mailto: ianhuang46@gmail.com">
                                ianhuang46@gmail.com
                            </a>
                        </div>
                    </div>
                    <span className="spacer"></span>
                    <div className="column">
                        <h1>Projects</h1>
                        <ProjectWidget
                            name="Taro.js"
                            image="https://raw.githubusercontent.com/iahuang/taro/master/readme_assets/taro.png"
                            isLogo
                            description="A Javascript library for developing web apps using JSX/TSX without the overhead of React"
                            href="https://github.com/iahuang/taro"
                        ></ProjectWidget>
                        <ProjectWidget
                            name="rpistream"
                            image="assets/rpistream.png"
                            description="A realtime video streaming library designed to be lightweight enough to run on a Raspberry Pi"
                            href="https://pypi.org/project/rpistream/"
                        ></ProjectWidget>
                        <ProjectWidget
                            name="MyHUD"
                            image="https://raw.githubusercontent.com/iahuang/myhud/main/readme_assets/screenshot.png"
                            description="A fancy display for your second monitor"
                            href="https://github.com/iahuang/myhud"
                        ></ProjectWidget>
                    </div>
                </div>
            </div>
            <div className="site-footer">
                <hr></hr>
                Copyright © Ian Huang {new Date().getFullYear()}
                <br></br>I designed this website from scratch! Check out the
                source code <a href="https://github.com/iahuang/me">here</a>
            </div>
        </div>
    );
}

export default App;
