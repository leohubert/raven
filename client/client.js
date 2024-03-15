const {tsParticles} = require("tsparticles-engine");
const {loadFull} = require("tsparticles");

function randomInRange(min, max) {
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
            shadow: {
                enable: false,
            },
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
        }
    });

    window.electron.onSoundPlayed((opts) => {
        const {images, mousePosition, count} = opts

        const shapesToDisplay = count ?? randomInRange(5, 15);
        for (let i = 0; i < shapesToDisplay; i++) {
            particles.particles.addParticle({
                x: mousePosition.x * 2,
                y: mousePosition.y * 2
            }, {
                shape: {
                    type: 'image',
                    image: images.map(url => ({
                        src: url,
                    })),
                },
            })
        }
    })
})
