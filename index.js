// const {autoUpdater} = require("electron-updater")
const {app, BrowserWindow, globalShortcut, dialog, ipcMain, screen} = require('electron')
const player = require('play-sound')(opts = {})
const path = require('path')
const fs = require('fs')

const keys = '`1234567890-=qwertyuiop[]asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_QWERTYUIOPASDFGHJKL:"ZXCVBNM<>?'.split('')
const soundExt = ['.mp3', '.wav', '.ogg', '.m4a']
const imageExt = ['.png']

const basePath = app.isPackaged ? process.resourcesPath : __dirname

const themes = getDirectories(path.resolve(basePath, 'assets', 'themes'), false)
let currentTheme = themes[Math.floor(Math.random() * themes.length)]

function getFiles(dir, recursive = true) {
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

function getDirectories(dir) {
    const dirents = fs.readdirSync(dir, {withFileTypes: true});
    return dirents.filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}


function loadTheme(theme) {
    currentTheme = theme
    const themePath = path.resolve(basePath, 'assets', 'themes', theme)
    const globalPath = path.resolve(themePath, 'global')

    const globalDirectories = getDirectories(globalPath)

    const keysDirectories = getDirectories(themePath).filter(file => file !== 'global')

    const introFiles = getFiles(path.resolve(themePath), false).filter(file => soundExt.includes(path.extname(file)))

    let images = getFiles(globalPath, false).filter(file => imageExt.includes(path.extname(file)))
    let sounds = getFiles(globalPath, false).filter(file => soundExt.includes(path.extname(file)))

    let global = {}
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

    let keys = {}
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

    // if (introFiles.length) {
    //     playSound(introFiles[Math.floor(Math.random() * introFiles.length)])
    // }

    return {
        images,
        sounds,
        global,
        keys
    }
}

let theme = loadTheme(currentTheme)

let lastSounds = []

function pickRandomSound(opts = {}) {
    const {customItem, key} = opts

    const item = theme.keys[key] ?? theme.global[customItem] ?? theme

    const sounds = item.sounds.filter(sound => !lastSounds.includes(sound))

    if (!sounds.length) {
        lastSounds = lastSounds.length > 1 ? [lastSounds.at(-1)] : []
        return pickRandomSound(opts)
    }

    const sound = sounds[Math.floor(Math.random() * sounds.length)]

    lastSounds.push(sound)

    return sound
}

let lastImages = []

function pickRandomImage(opts = {}) {
    const {customItem, key} = opts
    const item = theme.keys[key] ?? theme.global[customItem] ?? theme
    const images = item.images.filter(image => !lastImages.includes(image))


    if (!images.length) {
        if (item.images.length < 1) {
            lastImages = []
        } else {
            lastImages = lastImages.length > 1 ? [lastImages.at(-1)] : []
        }

        if (key) {
            return pickRandomImage({customItem})
        } else {
            return null
        }

    }

    const image = images[Math.floor(Math.random() * images.length)]

    lastImages.push(image)

    return image
}

function pickKeyItem(key) {
    const sound = pickRandomSound({key})
    const soundFolder = path.basename(path.dirname(sound))
    const images = []

    for (let i = 0; i < 3; i++) {
        let image = pickRandomImage({key, customItem: soundFolder})
        if (!image && i > 0) {
            break
        }
        images.push(image)
    }

    return {
        sound,
        images
    }
}

function playSound(sound) {
    player.play(sound, function (err) {
        if (err) {
            app.quit()
            dialog.showErrorBox("Error", "Error playing sound")
        }
    })
}

function triggerImages(wins, images, count = null) {
    if (typeof images === 'string') {
        images = [images]
    }

    let mousePoint = screen.getCursorScreenPoint()
    wins.forEach(win => {
        let bounds = win.getBounds()

        if (bounds.x <= mousePoint.x && mousePoint.x <= bounds.x + bounds.width &&
            bounds.y <= mousePoint.y && mousePoint.y <= bounds.y + bounds.height) {
            const mousePositionInWindow = {
                x: mousePoint.x - bounds.x,
                y: mousePoint.y - bounds.y
            }

            win.webContents.send('sound', {
                images,
                mousePosition: mousePositionInWindow,
                count
            })
        }
    })
}

function handleKeyPressed(key, wins) {
    const {sound, images} = pickKeyItem(key)

    playSound(sound)
    triggerImages(wins, images)
}

const createWindow = () => {
    let wins = []
    let displays = screen.getAllDisplays()

    for (display of displays) {
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

        win.setAlwaysOnTop(true, 'screen-saver')
        win.setVisibleOnAllWorkspaces(true, {
            visibleOnFullScreen: true
        })
        win.setIgnoreMouseEvents(true)
        win.loadFile('client/index.html')
        // win.webContents.openDevTools()
        wins.push(win)
    }

    return wins
}


app.whenReady().then(async () => {
    const wins = createWindow()

    if (process.platform === 'darwin') {
        app.dock.hide()
    }

    globalShortcut.register('OPTION+P', () => {
        app.quit()
    })

    globalShortcut.register('OPTION+T', () => {
        theme = loadTheme(currentTheme === 'raven' ? 'toad' : 'raven')
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
                } catch (err) {
                    dialog.showErrorBox('Error', err.message)
                    app.quit()
                }
            })
        } catch (err) {
            console.log('Error registering key', key, err.message)
        }
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()

    })

    setTimeout(() => {
        triggerImages(wins, pickRandomImage(), 1)
    }, 1000)

    // autoUpdater.autoDownload = false
    // const updateCheck = await autoUpdater.checkForUpdates()
    // if (updateCheck.updateInfo.version !== app.getVersion()) {
    //   await autoUpdater.downloadUpdate()
    //   await autoUpdater.quitAndInstall()
    // }
})
