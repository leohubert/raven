const { autoUpdater } = require("electron-updater")
const { app, BrowserWindow, globalShortcut, dialog } = require('electron')
const player = require('play-sound')(opts = {})
const path = require('path')

const basePath = app.isPackaged ? process.resourcesPath : __dirname

const keys = '`1234567890-=qwertyuiop[]asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_QWERTYUIOPASDFGHJKL:"ZXCVBNM<>?'.split('')

const sounds = [
  path.resolve(basePath, 'sounds/foo.m4a'),
  path.resolve(basePath, 'sounds/kraaa.m4a'),
  path.resolve(basePath, 'sounds/mouette.m4a'),
  path.resolve(basePath, 'sounds/turtle.m4a')
]

function playSound() {
  player.play(sounds[Math.floor(Math.random()*sounds.length)], function(err){
    if (err) {
      app.quit()
      dialog.showErrorBox("Error", "Error playing sound")
    }
  })
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 0,
    height: 0,
    show: false,
    webPreferences: {nodeIntegration: true}
  })

  if (process.platform == 'darwin') {
    app.dock.hide()
  }
  return win
}


app.whenReady().then(async () => {
  const win = createWindow()

  globalShortcut.register('OPTION+Q', () => {
    app.quit()
  })

  globalShortcut.register('OPTION+V', () => {
    dialog.showErrorBox('Version', 'Version: ' + app.getVersion())
  })

  for (const key of keys) {
    try{
      globalShortcut.register(key, () => {
        try {
          playSound()
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
