import './index.css';

import {tsParticles} from "tsparticles-engine";
import {loadFull} from "tsparticles";
import {IImageShape} from "tsparticles-engine/types/Options/Interfaces/Particles/Shape/IImageShape";

function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadFull(tsParticles);

    const particles = await tsParticles.load("tsparticles", {
        fullScreen: {
            enable: true,
            zIndex: 100,
        },
        fpsLimit: 120,
        particles: {
            shape: {
                type: 'image',
                image: {
                    src: "https://emoji.slack-edge.com/TPVCBCVHC/edgael/fa0e7760311f5a4a.png"
                }
            },
            opacity: {
                value: 1,
                animation: {
                    enable: true,
                    minimumValue: 0.2,
                    speed: 0.1,
                    startValue: "max",
                }
            },
            size: {
                value: 60,
                random: {
                    enable: true,
                    minimumValue: 30
                }
            },
            links: {
                enable: false
            },
            move: {
                enable: true,
                gravity: {
                    enable: true,
                    acceleration: 30
                },
                speed: {
                    min: 50,
                    max: 100
                },
                decay: 0.1,
                direction: "top",
                straight: false,
                outModes: {
                    default: "destroy",
                    top: "none"
                }
            },
            rotate: {
                value: {
                    min: 0,
                    max: 120
                },
                direction: "random",
                move: true,
                animation: {
                    enable: true,
                    speed: 42
                }
            },
            // tilt: {
            //     direction: "random",
            //     enable: true,
            //     move: true,
            //     value: {
            //         min: 0,
            //         max: 360
            //     },
            //     animation: {
            //         enable: true,
            //         speed: 60
            //     }
            // },
            shadow: {
                enable: false,
            },
            // roll: {
            //     darken: {
            //         enable: true,
            //         value: 25
            //     },
            //     enable: true,
            //     speed: {
            //         min: 15,
            //         max: 25
            //     }
            // },
            wobble: {
                distance: 30,
                enable: true,
                move: true,
                speed: {
                    min: -15,
                    max: 15
                }
            }
        },
        detectRetina: true,
        motion: {
            disable: true,
        },
        interactivity: {
            detectsOn: "window",
            events: {
                onclick: {
                    enable: true,
                    mode: "push"
                },
                resize: true
            },
            modes: {
                push: {
                    particles_nb: randomInRange(5, 15)
                }
            }
        },
    });

    // @ts-ignore
    window.electron.onSoundPlayed((imagesUrl: string[]) => {
        particles.options.particles.shape.image = imagesUrl.map(url => {
            const config: IImageShape = {
                src: url,
                gif: false,
                height: 50,
                width: 50,
                replaceColor: false,
                replace_color: false,
            }
            if (url.endsWith('.gif')) {
                config.gif = true
            }

            return config
        });
        particles.updateActualOptions();
        particles.handleClickMode('push')
    })
})

