const { tsParticles } = require("tsparticles-engine");
const { loadFull } = require("tsparticles");
const { loadImageShape } = require("tsparticles-shape-image");


document.addEventListener("DOMContentLoaded", async () => {
    await loadFull(tsParticles);

    await loadImageShape(tsParticles);

    const particles = await tsParticles.load("tsparticles", {
        fullScreen: {
            enable: true,
            zIndex: 100,
        },
        fpsLimit: 120,
        particles: {
            number: {
                value: 0,
            },
            color: {
                value: ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],
            },
            shape: {
                type: 'image',
                image: {
                    src: "https://emoji.slack-edge.com/TPVCBCVHC/edgael/fa0e7760311f5a4a.png"
                }
            },
            opacity: {
                value: { min: 0, max: 1 },
                animation: {
                    enable: true,
                    speed: 0.5,
                    startValue: "max",
                    destroy: "min",
                },
            },
            size: {
                value: 50,
            },
            links: {
                enable: false,
            },
            life: {
                duration: {
                    sync: true,
                    value: 20 / 6,
                },
                count: 1,
            },
            move: {
                angle: {
                    value: 45,
                    offset: 0,
                },
                drift: 0,
                enable: true,
                gravity: {
                    enable: true,
                    acceleration: 9.81,
                },
                speed: 45,
                decay: 0.1,
                direction: -90,
                random: true,
                straight: false,
                outModes: {
                    default: "none",
                    bottom: "destroy",
                },

            },
            rotate: {
                value: {
                    min: 0,
                    max: 360,
                },
                direction: "random",
                animation: {
                    enable: true,
                    speed: 60,
                },
            },
            tilt: {
                direction: "random",
                enable: true,
                value: {
                    min: 0,
                    max: 360,
                },
                animation: {
                    enable: true,
                    speed: 60,
                },
            },
            roll: {
                darken: {
                    enable: true,
                    value: 25,
                },
                enable: true,
                speed: {
                    min: 15,
                    max: 25,
                },
            },
            wobble: {
                distance: 70,
                enable: true,
                speed: {
                    min: -15,
                    max: 15,
                },
            },
        },
        detectRetina: true,
        motion: {
            disable: true,
        },
        interactivity: {
            detectsOn: "window",
            events: {
              // onhover: {
              //   enable: true,
              //   mode: "trail"
              // },
              onclick: {
                enable: true,
                mode: "push"
              },
              resize: true
            },
            modes: {
              grab: {
                distance: 400,
                line_linked: {
                  opacity: 1
                }
              },
              bubble: {
                distance: 400,
                size: 40,
                duration: 2,
                opacity: 0.8,
                speed: 3
              },
              repulse: {
                distance: 200
              },
              push: {
                particles_nb: 5
              },
              remove: {
                particles_nb: 4
              },
            }
          },
    });

    window.electron.onSoundPlayed((image) => {
        particles.options.particles.shape.image = [{
            src: image
        }];
        particles.updateActualOptions();
        particles.handleClickMode('push')
    })
})
