import {useEffect, useMemo, useState} from "react";
import Particles, {initParticlesEngine} from "@tsparticles/react";
import {
	type Container,
	type ISourceOptions,
} from "@tsparticles/engine";
import {loadSlim} from "@tsparticles/slim";
import {OnSoundPlayedOpts, OnThemeLoadedOpts, Theme} from "../shared";

function randomInRange(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function App() {
	const [init, setInit] = useState(false);
	const [preload, setPreload] = useState<any[]>([]);

	function loadThemeImages(theme: Theme) {
		const allImages = [
			...theme.images,
			...Object.values(theme.keys).flat().map(k => k.images).flat()
		]

		setPreload(allImages.map((image) => ({
			src: `app://${image}`,
			gif: image.toLowerCase().endsWith('.gif'),
			height: 128,
			name:  image,
			width: 128
		})))
	}

	// this should be run only once per application lifetime
	useEffect(() => {
		const cancel = window.electron.onThemeLoaded((opts: OnThemeLoadedOpts) => {
			console.debug("Theme loaded:", opts.theme)

			loadThemeImages(opts.theme)
		})

		initParticlesEngine(async (engine) => {
			await loadSlim(engine);
		}).then(() => {
			setInit(true);
		});


		window.electron.onFrontLoaded((theme: Theme) =>{
			console.debug("Front loaded event sent", theme)
			loadThemeImages(theme)
		})

		return () => cancel()
	}, []);

	const particlesLoaded = async (container?: Container): Promise<void> => {
		if (!container) {
			console.error("Particles container is not defined.");
			return;

		}


		const cancel = window.electron.onSoundPlayed((opts: OnSoundPlayedOpts) => {
			if (!container) {
				console.error("Particles container is not defined.");
				return;
			}

			console.log("Sound played event received:")

			const shapesToDisplay = opts.count ?? randomInRange(5, 15);
			for (let i = 0; i < shapesToDisplay; i++) {
				container.particles.addParticle({
					x: opts.mousePosition.x * 2,
					y: opts.mousePosition.y * 2
				}, {
					shape: {
						type: "image",
						close: true,
						fill: true,
						options: {
							image: opts.images.map((i) => ({name: i})),
						},
					},
				})
			}
		})
	};

	const options: ISourceOptions = useMemo(
		() => ({
			fullScreen: {
				enable: true,
				zIndex: 100,
			},
			fpsLimit: 120,
			particles: {
				shape: {
					type: "image",
					close: true,
					fill: true,
					options: {
						image: preload.map((i) => ({name: i.name})),
					},
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
			},
			preload: preload,
		}),
		[preload],
	);


	if (init) {
		return (
			<Particles
				id="tsparticles"
				particlesLoaded={particlesLoaded}
				options={options}
			/>
		);
	}

	return <></>;
}