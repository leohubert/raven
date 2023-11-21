import { app, BrowserWindow, globalShortcut, dialog, ipcMain, screen  } from 'electron'
import initPlayer from 'play-sound'
import path from 'path'
// import * as process from "process";

const player = initPlayer()

const soundBasePath = path.resolve(__dirname, '../../')
const imageBasePath = app.isPackaged ? path.resolve(__dirname, '../../') : ''

console.log(path.join( soundBasePath, 'assets/leo/sounds/foo.m4a'))

const keys = '`1234567890-=qwertyuiop[]asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_QWERTYUIOPASDFGHJKL:"ZXCVBNM<>?'.split('')

const persons = [
  {
    person: 'leo',
    sounds: [
      path.join(soundBasePath, 'assets/leo/sounds/foo.m4a')
    ],
    images: [
      path.join(imageBasePath, 'assets/leo/images/happy-leo.png')
    ]
  },
  {
    person: 'gael',
    sounds: [
      path.join(soundBasePath, 'assets/gael/sounds/kraaa.m4a')
    ],
    images: [
      path.join(imageBasePath, 'assets/gael/images/edgael.png'),
      path.join(imageBasePath, 'assets/gael/images/gael-phoque-yeah.png'),
      path.join(imageBasePath, 'assets/gael/images/bunny-gael.png'),
    ]
  },
  {
    person: 'guillaume',
    sounds: [
      path.join(soundBasePath, 'assets/guillaume/sounds/mouette.m4a')
    ],
    images: [
      path.join(imageBasePath, 'assets/guillaume/images/pasto-santa.png')
    ]
  },
  {
    person: 'manu',
    sounds: [
      path.join(soundBasePath, 'assets/manu/sounds/turtle.m4a')
    ],
    images: [
      path.join(imageBasePath, 'assets/manu/images/bunny-manu.png'),
      path.join(imageBasePath, 'assets/manu/images/manium.gif')
    ]
  },
  {
    person: 'seb',
    sounds: [
      path.join(soundBasePath, 'assets/seb/sounds/seb-pouet.m4a')
    ],
    images: [
      path.join(imageBasePath, 'assets/seb/images/french-seb.png'),
      path.join(imageBasePath, 'assets/seb/images/seb-round.png')
    ]
  },
  {
    person: 'grace',
    sounds: [
      path.join(soundBasePath, 'assets/grace/sounds/ya-grace.m4a')
    ],
    images: [
      path.join(imageBasePath, 'assets/grace/images/grace-slayy.png'),
    ]
  },
  {
    person: 'nikan',
    sounds: [
      path.join(soundBasePath, 'assets/nikan/sounds/cat.m4a')
    ],
    images: [
      path.join(imageBasePath, 'assets/nikan/images/porshe.png'),
    ]
  }
]


let lastPerson: any | null = null;
function pickRandomPerson() {
  let sound;
  do {
    sound = persons[Math.floor(Math.random()*persons.length)];
  } while (sound === lastPerson);

  lastPerson = sound;
  return sound
}

function pickRandomSound(person: any) {
  return person.sounds[Math.floor(Math.random()*person.sounds.length)];
}

function pickRandomImage(person: any) {
  return person.images[Math.floor(Math.random()*person.images.length)];
}

function playSound(wins: BrowserWindow[]) {
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

  player.play(sound, function(err: any){
    if (err) {
      dialog.showErrorBox("Error", "Error playing sound")
      app.quit()
    }
  })
}

const createWindow = () => {
  let wins = []
  let displays = screen.getAllDisplays()

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
    win.setHiddenInMissionControl(true)
    win.setWindowButtonVisibility(false)
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true
    })
    win.setIgnoreMouseEvents(true)
    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // win.loadFile('client/index.html')
    // win.webContents.openDevTools()
    wins.push(win)
  }

  return wins
}


app.whenReady().then(async () => {
  const wins = createWindow()

  // if (process.platform === 'darwin') {
  //   app.dock.hide()
  // }

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
})
