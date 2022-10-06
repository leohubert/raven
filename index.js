const { app, BrowserWindow, globalShortcut, dialog } = require('electron')
var player = require('play-sound')(opts = {})
const path = require('path')

const basePath = app.isPackaged ? process.resourcesPath : __dirname 

const sounds = [
  path.resolve(basePath, 'sounds/foo.m4a'),
  path.resolve(basePath, 'sounds/kraaa.m4a'),
  path.resolve(basePath, 'sounds/mouette.m4a')
]

console.log("sounds",  sounds)

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
    show: false
  })
  
  if (process.platform == 'darwin') {  
    app.dock.hide()  
  }
}

const keys = '`1234567890-=qwertyuiop[]asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+QWERTYUIOPASDFGHJKL:"ZXCVBNM<>?'.split('')

app.whenReady().then(() => {
  createWindow()

  globalShortcut.register('OPTION+Q', () => {
    app.quit()
  })

  for (const key of keys) {
    globalShortcut.register(key, () => {
      try {
        playSound()
      } catch (err) {
        dialog.showErrorBox('Error', err.message)
        app.quit()
      }
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})