const { app, BrowserWindow, Menu, MenuItem, globalShortcut } = require('electron')
var player = require('play-sound')(opts = {})


const sounds = [
  'foo.m4a',
  'kraaa.m4a',
]


function playSound() {
  player.play(sounds[Math.floor(Math.random()*sounds.length)], function(err){
    if (err) throw err
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

// Generate all keyboard keys values
const keys = '`1234567890-=qwertyuiop[]asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+QWERTYUIOPASDFGHJKL:"ZXCVBNM<>?'.split('')



app.whenReady().then(() => {
  createWindow()

  globalShortcut.register('OPTION+Q', () => {
    app.quit()
  })


  for (const key of keys) {
    globalShortcut.register(key, () => {
      playSound()
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

})