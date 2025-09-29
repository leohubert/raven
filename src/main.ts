import createPlayer from 'play-sound';
import {app, BrowserWindow, dialog, globalShortcut, ipcMain, net, protocol, screen} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from "fs";
import {EventPayloads, EventType, GlobalItem, KeyItem, Theme} from "./shared";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

const soundPlayer = createPlayer({})

const keys = '`1234567890-=qwertyuiop[]asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_QWERTYUIOPASDFGHJKL:"ZXCVBNM<>?'.split('')
const soundExt = ['.mp3', '.wav', '.ogg', '.m4a']
const imageExt = ['.webp']

const basePath = app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..', '..')

const themes = getDirectories(path.resolve(basePath, 'assets', 'themes'))
const availableThemes = Object.values(themes)

let theme: Theme
let lastSounds: string[] = []

function getFiles(dir: string, recursive = true): string[] {
	const dirents = fs.readdirSync(dir, {withFileTypes: true});
	const files = dirents.map((dirent) => {
		const res = path.resolve(dir, dirent.name);
		if (dirent.isDirectory() && recursive) {
			return getFiles(res);
		}
		return res;
	});
	return Array.prototype.concat(...files);
}

function getDirectories(dir: string) {
	const dirents = fs.readdirSync(dir, {withFileTypes: true});
	return dirents.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);
}


function loadTheme(themeName: string): Theme {
	const themePath = path.resolve(basePath, 'assets', 'themes', themeName)
	const globalPath = path.resolve(themePath, 'global')

	const globalDirectories = getDirectories(globalPath)

	const keysDirectories = getDirectories(themePath).filter(file => file !== 'global')

	const introSounds = getFiles(path.resolve(themePath), false).filter(file => soundExt.includes(path.extname(file)))

	const images = getFiles(globalPath, false).filter(file => imageExt.includes(path.extname(file)))
	const sounds = getFiles(globalPath, false).filter(file => soundExt.includes(path.extname(file)))

	const global: Record<string, GlobalItem> = {}
	for (const globalDir of globalDirectories) {
		const globalFiles = getFiles(path.resolve(globalPath, globalDir))
		const curSounds = globalFiles.filter(file => soundExt.includes(path.extname(file)))
		const curImages = globalFiles.filter(file => imageExt.includes(path.extname(file)))

		images.push(...curImages)
		sounds.push(...curSounds)

		global[globalDir] = {
			key: globalDir,
			sounds: curSounds,
			images: curImages
		}

	}

	const keys: Record<string, KeyItem> = {}
	for (const keyDir of keysDirectories) {
		const keyFiles = getFiles(path.resolve(themePath, keyDir))
		const curSounds = keyFiles.filter(file => soundExt.includes(path.extname(file)))
		const curImages = keyFiles.filter(file => imageExt.includes(path.extname(file)))

		keys[keyDir] = {
			key: keyDir,
			sounds: curSounds,
			images: curImages
		}
	}

	// if (introSounds.length) {
	// 	playSound(introSounds[Math.floor(Math.random() * introSounds.length)])
	// }

	const isUpdate = !!theme

	theme = {
		name: themeName,
		images,
		sounds,
		introSounds,
		global,
		keys
	}

	if (isUpdate) {
		triggerEvent(EventType.OnThemeLoaded, {
			theme
		})
	}

	return theme
}

function pickRandomSound(opts: any = {}): string {
	const {customItem, key} = opts

	const item = theme.keys[key] ?? theme.global[customItem] ?? theme

	const sounds = item.sounds.filter((sound: any) => !lastSounds.includes(sound))

	if (!sounds.length) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		lastSounds = lastSounds.length > 1 ? [lastSounds.at(-1)!] : []
		return pickRandomSound(opts)
	}

	const sound = sounds[Math.floor(Math.random() * sounds.length)]

	lastSounds.push(sound)

	return sound
}

let lastImages: string[] = []

type PickRandomImageOpts = {
	customItem?: string,
	key?: string
}

function pickRandomImage(count: number, opts: PickRandomImageOpts = {}): string[] {
	let item: Theme | KeyItem | GlobalItem
	if (opts.key && theme.keys[opts.key]) {
		console.log('Picking image for key:', opts.key)
		item = theme.keys[opts.key]
	} else if (opts.customItem && theme.global[opts.customItem]) {
		console.log('Picking image for customItem:', opts.customItem)
		item = theme.global[opts.customItem]
	} else {
		item = theme
	}

	const hasImages = item.images && item.images.length
	if (!hasImages && opts.key && opts.customItem)  {
		return pickRandomImage(count, {customItem: opts.customItem})
	}

	const images: string[] = []

	for (let i = 0; i < count; i++) {
		const availableImages = item.images.filter((image: string) => !lastImages.includes(image))
		if (!availableImages.length) {
			lastImages = lastImages.length > 1 ? [lastImages.at(-1)!] : []
			i--;
			continue
		}

		const image = availableImages[Math.floor(Math.random() * availableImages.length)]
		lastImages.push(image)
		images.push(image)
	}

	return images
}

function pickKeyItem(key: string): { sound: string, images: string[] } {
	const sound = pickRandomSound({key})
	const soundFolder = path.basename(path.dirname(sound))
	const images: string[] = pickRandomImage(3, {key, customItem: soundFolder})

	console.log('Picked for key:', key, {
		sound,
		images
	})

	return {
		sound,
		images
	}
}

function playSound(sound: string) {
	soundPlayer.play(sound, function (err: Error) {
		if (err) {
			console.error('Error playing sound:', sound, err.message)
			// dialog.showErrorBox("Error", "Error playing sound")
			app.quit()
		}
	})
}

function triggerImages(images: string[] | string, count?: number, wins?: BrowserWindow[]) {
	if (wins === undefined) {
		wins = BrowserWindow.getAllWindows()
	}

	if (typeof images === 'string') {
		images = [images]
	}

	const mousePoint = screen.getCursorScreenPoint()
	wins.forEach(win => {
		const bounds = win.getBounds()

		if (bounds.x <= mousePoint.x && mousePoint.x <= bounds.x + bounds.width &&
			bounds.y <= mousePoint.y && mousePoint.y <= bounds.y + bounds.height) {
			triggerEvent(EventType.OnSoundPlayed, {
				images,
				count: count ?? null,
				mousePosition: {
					x: mousePoint.x - bounds.x,
					y: mousePoint.y - bounds.y
				},
			}, {
				wins: [win]
			})
		}
	})
}

function handleKeyPressed(key: string, wins: BrowserWindow[]) {
	const {sound, images} = pickKeyItem(key)

	try {
		playSound(sound)
		triggerImages(images, undefined, wins)
	} catch (err: any) {
		console.error('Error handling key', key, err.message, {
			stack: err.stack
		})
		app.quit()
	}

}

const DEBUG = false

async function createWindow() {
	const wins = []
	let displays = screen.getAllDisplays()

	const mainDisplay = screen.getPrimaryDisplay()

	if (DEBUG) {
		displays = displays.filter(display => display.id !== mainDisplay.id)
		if (displays.length < 1) {
			displays = [mainDisplay]
		}
	}

	for (const display of displays) {
		const win = new BrowserWindow({
			x: display.bounds.x,
			y: display.bounds.y,
			width: display.bounds.width,
			height: display.bounds.height,
			transparent: true,
			frame: false,
			hasShadow: false,
			titleBarStyle: 'hidden',
			titleBarOverlay: true,
			alwaysOnTop: true,
			skipTaskbar: true,
			enableLargerThanScreen: true,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
				nodeIntegration: true
			}
		})

		if (process.platform === 'darwin') {
			win.setHiddenInMissionControl(true)
			win.setWindowButtonVisibility(false)
			win.setSkipTaskbar(true)
		} else {
			win.setMenuBarVisibility(false)
		}

		if (!DEBUG) {
			win.setIgnoreMouseEvents(true)
			win.setAlwaysOnTop(true, 'screen-saver')
			win.setVisibleOnAllWorkspaces(true, {
				visibleOnFullScreen: true
			})
		} else {
			win.webContents.openDevTools()
		}


		if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
			await win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
		} else {
			await win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
		}


		wins.push(win)

	}


	return wins
}

app.whenReady().then(async () => {
	loadTheme(themes[Math.floor(Math.random() * themes.length)])

	protocol.handle('app', (request) => {
		const filePath = request.url.slice('app://'.length)
		return net.fetch(`file://${filePath}`)
	})

	ipcMain.handle(EventType.OnFrontLoaded, () => {
		console.log("Front loaded event received in main process")
		return theme
	})

	const wins = await createWindow()

	if (process.platform === 'darwin') {
		app.dock!.hide()
	}

	globalShortcut.register('OPTION+P', () => {
		app.quit()
	})

	globalShortcut.register('OPTION+T', () => {
		const currentThemeIndex = availableThemes.indexOf(theme.name)
		const nextThemeIndex = (currentThemeIndex + 1) % availableThemes.length
		const nextTheme = availableThemes[nextThemeIndex]

		console.log('Switching theme:', theme.name, '->', nextTheme)
		loadTheme(nextTheme)
	})

	globalShortcut.register('OPTION+V', () => {
		dialog.showErrorBox('Version', 'Version: ' + app.getVersion())
	})

	globalShortcut.register('OPTION+D', () => {
		wins.forEach(win => {
			win.webContents.openDevTools()
		})
	})

	for (const key of keys) {
		try {
			globalShortcut.register(key, () => {
				try {
					handleKeyPressed(key, wins)
				} catch (err: any) {
					console.error('Error handling key', key, err.message, {
						stack: err.stack
					})
					// dialog.showErrorBox('Error', err.message)
					app.quit()
				}
			})
		} catch (err: any) {
			console.log('Error registering key', key, err.message)
		}
	}

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})


// UTILS


function triggerEvent<T extends EventType>(event: T, payload: EventPayloads[T], opts?: {
	wins?: BrowserWindow[]
	filterWindow?: (win: BrowserWindow) => boolean
}) {
	let wins = opts?.wins
	if (wins === undefined) {
		wins = BrowserWindow.getAllWindows()
	}

	if (opts?.filterWindow) {
		wins = wins.filter(opts.filterWindow)
	}

	for (const win of wins) {
		win.webContents.send(event, payload)
	}
}