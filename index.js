const TEST = require("node-global-key-listener")
var player = require('play-sound')(opts = {})

const v = new TEST.GlobalKeyboardListener();


const sounds = [
  'foo.m4a',
  'kraaa.m4a',
]

v.addListener(function (e, down) {
  if (e.state === "DOWN") {
    player.play(sounds[Math.floor(Math.random()*sounds.length)], function(err){
      if (err) throw err
    })
  }
});
