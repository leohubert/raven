const { autoUpdater } = require("electron-updater")
const { app, BrowserWindow, globalShortcut, dialog, ipcMain, screen  } = require('electron')
const player = require('play-sound')(opts = {})
const path = require('path')

const basePath = app.isPackaged ? process.resourcesPath : __dirname

const keys = '`1234567890-=qwertyuiop[]asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_QWERTYUIOPASDFGHJKL:"ZXCVBNM<>?'.split('')

const persons = [
  {
    person: 'leo',
    sounds: [
      path.resolve(basePath, 'assets/leo/sounds/foo.m4a')
    ],
    images: [
      path.resolve(basePath, 'assets/leo/images/happy-leo.png')
      // "https://emoji.slack-edge.com/TPVCBCVHC/happy-leo/51b1c74574800482.png"
    ]
  },
  {
    person: 'gael',
    sounds: [
      path.resolve(basePath, 'assets/gael/sounds/kraaa.m4a')
    ],
    images: [
      path.resolve(basePath, 'assets/gael/images/edgael.png'),
      path.resolve(basePath, 'assets/gael/images/gael-phoque-yeah.png'),
      // "https://emoji.slack-edge.com/TPVCBCVHC/edgael/fa0e7760311f5a4a.png"
    ]
  },
  {
    person: 'guillaume',
    sounds: [
      path.resolve(basePath, 'assets/guillaume/sounds/mouette.m4a')
    ],
    images: [
      path.resolve(basePath, 'assets/guillaume/images/pasto-santa.png')
      // 'https://emoji.slack-edge.com/TPVCBCVHC/pasto-santa/87d62245ed0311db.png'
    ]
  },
  {
    person: 'manu',
    sounds: [
      path.resolve(basePath, 'assets/manu/sounds/turtle.m4a')
    ],
    images: [
      path.resolve(basePath, 'assets/manu/images/bunny-manu.png')
      // "https://emoji.slack-edge.com/TPVCBCVHC/bunny-manu/920b24217c240dea.png"
    ]
  }
]


let lastPerson = null;
function pickRandomPerson() {
  let sound;
  do {
    sound = persons[Math.floor(Math.random()*persons.length)];
  } while (sound === lastPerson);

  lastPerson = sound;
  return sound
}

function pickRandomSound(person) {
  return person.sounds[Math.floor(Math.random()*person.sounds.length)];
}

function pickRandomImage(person) {
  return person.images[Math.floor(Math.random()*person.images.length)];
}

function playSound(wins) {
  const person = pickRandomPerson()
  const sound = pickRandomSound(person)
  // const image = pickRandomImage(person)

  let mousePoint = screen.getCursorScreenPoint()
  wins.forEach(win => {
    let bounds = win.getBounds()
    if (bounds.x <= mousePoint.x && mousePoint.x <= bounds.x + bounds.width &&
        bounds.y <= mousePoint.y && mousePoint.y <= bounds.y + bounds.height) {
      win.webContents.send('sound', person.images)
    }
  })

  player.play(sound, function(err){
    if (err) {
      app.quit()
      dialog.showErrorBox("Error", "Error playing sound")
    }
  })
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
    win.setHiddenInMissionControl(true)
    win.setWindowButtonVisibility(false)
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

  globalShortcut.register('OPTION+Q', () => {
    app.quit()
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
    try{
      globalShortcut.register(key, () => {
        try {
          playSound(wins)
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

  autoUpdater.autoDownload = false
  const updateCheck = await autoUpdater.checkForUpdates()
  if (updateCheck.updateInfo.version !== app.getVersion()) {
    await autoUpdater.downloadUpdate()
    await autoUpdater.quitAndInstall()
  }
})
