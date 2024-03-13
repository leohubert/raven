"use strict";const u=require("electron"),C=require("fs"),N=require("child_process"),V=require("os"),v=require("path");function W(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var S={},Q=function(n){return n.map(function(r){return r&&typeof r=="object"?r.op.replace(/(.)/g,"\\$1"):/["\s]/.test(r)&&!/'/.test(r)?"'"+r.replace(/(['\\])/g,"\\$1")+"'":/["'\s]/.test(r)?'"'+r.replace(/(["\\$`!])/g,"\\$1")+'"':String(r).replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}])/g,"$1\\$2")}).join(" ")},D="(?:"+["\\|\\|","\\&\\&",";;","\\|\\&","\\<\\(","\\<\\<\\<",">>",">\\&","<\\&","[&;()|<>]"].join("|")+")",B=new RegExp("^"+D+"$"),P="|&;()<> \\t",L='"((\\\\"|[^"])*?)"',U="'((\\\\'|[^'])*?)'",F=/^#$/,j="'",R='"',O="$",y="",G=4294967296;for(var T=0;T<4;T++)y+=(G*Math.random()).toString(16);var J=new RegExp("^"+y);function z(e,n){for(var r=n.lastIndex,t=[],i;i=n.exec(e);)t.push(i),n.lastIndex===i.index&&(n.lastIndex+=1);return n.lastIndex=r,t}function H(e,n,r){var t=typeof e=="function"?e(r):e[r];return typeof t>"u"&&r!=""?t="":typeof t>"u"&&(t="$"),typeof t=="object"?n+y+JSON.stringify(t)+y:n+t}function K(e,n,r){r||(r={});var t=r.escape||"\\",i="(\\"+t+`['"`+P+`]|[^\\s'"`+P+"])+",l=new RegExp(["("+D+")","("+i+"|"+L+"|"+U+")+"].join("|"),"g"),f=z(e,l);if(f.length===0)return[];n||(n={});var d=!1;return f.map(function(p){var o=p[0];if(!o||d)return;if(B.test(o))return{op:o};var g=!1,w=!1,c="",E=!1,s;function q(){s+=1;var h,m,b=o.charAt(s);if(b==="{"){if(s+=1,o.charAt(s)==="}")throw new Error("Bad substitution: "+o.slice(s-2,s+1));if(h=o.indexOf("}",s),h<0)throw new Error("Bad substitution: "+o.slice(s));m=o.slice(s,h),s=h}else if(/[*@#?$!_-]/.test(b))m=b,s+=1;else{var $=o.slice(s);h=$.match(/[^\w\d_]/),h?(m=$.slice(0,h.index),s+=h.index-1):(m=$,s=o.length)}return H(n,"",m)}for(s=0;s<o.length;s++){var a=o.charAt(s);if(E=E||!g&&(a==="*"||a==="?"),w)c+=a,w=!1;else if(g)a===g?g=!1:g==j?c+=a:a===t?(s+=1,a=o.charAt(s),a===R||a===t||a===O?c+=a:c+=t+a):a===O?c+=q():c+=a;else if(a===R||a===j)g=a;else{if(B.test(a))return{op:o};if(F.test(a)){d=!0;var A={comment:e.slice(p.index+s+1)};return c.length?[c,A]:[A]}else a===t?w=!0:a===O?c+=q():c+=a}}return E?{op:"glob",pattern:c}:c}).reduce(function(p,o){return typeof o>"u"?p:p.concat(o)},[])}var Z=function(n,r,t){var i=K(n,r,t);return typeof r!="function"?i:i.reduce(function(l,f){if(typeof f=="object")return l.concat(f);var d=f.split(RegExp("("+y+".*?"+y+")","g"));return d.length===1?l.concat(d[0]):l.concat(d.filter(Boolean).map(function(p){return J.test(p)?JSON.parse(p.split(y)[1]):p}))},[])};S.quote=Q;S.parse=Z;var X=N.execSync,Y=V.platform(),ee=S.quote,re=function(){var e=Array.isArray(arguments[0])?arguments[0]:Array.prototype.slice.apply(arguments),n=null;return e.some(function(r){if(te(ne(r)))return n=r,!0}),n};function te(e){try{return X(ee(e.split(" ")),{stdio:"ignore"}),!0}catch{return!1}}function ne(e){return/^win/.test(Y)?"where "+e:"command -v "+e}var ae=re,se=N.spawn,oe=["mplayer","afplay","mpg123","mpg321","play","omxplayer","aplay","cmdmp3","cvlc","powershell"];function ie(e){e=e||{},this.players=e.players||oe,this.player=e.player||ae(this.players),this.urlRegex=/^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/i,this.play=function(n,r,t){if(t=t||function(){},t=typeof r=="function"?r:t,r=typeof r=="object"?r:{},r.stdio="ignore",this.player=="mplayer"&&this.urlRegex.test(n),!n)return t(new Error("No audio file specified"));if(!this.player)return t(new Error("Couldn't find a suitable audio player"));var i=Array.isArray(r[this.player])?r[this.player].concat(n):[n],l=se(this.player,i,r);return l?(l.on("close",function(f){t(f&&!f.killed?f:null)}),l):(t(new Error("Unable to spawn process with "+this.player)),null)},this.test=function(n){this.play("./assets/test.mp3",n)}}var le=function(e){return new ie(e)};const ue=W(le),fe=ue(),M=v.resolve(__dirname,"../../"),ce=u.app.isPackaged?v.resolve(__dirname,"../../"):"";console.log(v.join(M,"assets/leo/sounds/foo.m4a"));const pe="`1234567890-=qwertyuiop[]asdfghjkl;'zxcvbnm,./~!@#$%^&*()_QWERTYUIOPASDFGHJKL:\"ZXCVBNM<>?".split("");async function _(e,n,r){return new Promise((t,i)=>{const l=v.join(e,"assets",n,r);C.readdir(l,(f,d)=>{f&&i(f);const p=d.map(o=>v.join(l,o));t(p)})})}const de=async e=>{const n=[];for(const r of e){const t=await _(M,r,"sounds"),i=await _(ce,r,"images");n.push({person:r,sounds:t,images:i})}return n},he=["leo","gael","guillaume","manu","seb","grace","nikan"];let x=[];de(he).then(e=>x=e).catch(e=>console.error(e));let k=null;function ye(){let e;do e=x[Math.floor(Math.random()*x.length)];while(e===k);return k=e,e}function ge(e){return e.sounds[Math.floor(Math.random()*e.sounds.length)]}function ve(e){const n=ye(),r=ge(n);let t=u.screen.getCursorScreenPoint();e.forEach(i=>{let l=i.getBounds();l.x<=t.x&&t.x<=l.x+l.width&&l.y<=t.y&&t.y<=l.y+l.height&&i.webContents.send("sound",n.images)}),fe.play(r,function(i){i&&(u.dialog.showErrorBox("Error","Error playing sound"),u.app.quit())})}const I=()=>{let e=[],n=u.screen.getAllDisplays();for(const r of n){const t=new u.BrowserWindow({x:r.bounds.x,y:r.bounds.y,width:r.bounds.width,height:r.bounds.height,transparent:!0,frame:!1,hasShadow:!1,titleBarStyle:"hidden",titleBarOverlay:!0,alwaysOnTop:!0,skipTaskbar:!0,enableLargerThanScreen:!0,webPreferences:{preload:v.join(__dirname,"preload.js"),nodeIntegration:!0}});t.setHiddenInMissionControl(!0),t.setWindowButtonVisibility(!1),t.setAlwaysOnTop(!0,"screen-saver"),t.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0}),t.setIgnoreMouseEvents(!0),t.loadURL("http://localhost:5173"),e.push(t)}return e};u.app.whenReady().then(async()=>{const e=I();u.globalShortcut.register("OPTION+Q",()=>{u.app.quit()}),u.globalShortcut.register("OPTION+V",()=>{u.dialog.showErrorBox("Version","Version: "+u.app.getVersion())}),u.globalShortcut.register("OPTION+D",()=>{e.forEach(n=>{n.webContents.openDevTools()})});for(const n of pe)try{u.globalShortcut.register(n,()=>{try{ve(e)}catch(r){u.dialog.showErrorBox("Error",r.message),u.app.quit()}})}catch(r){console.log("Error registering key",n,r.message)}u.app.on("activate",()=>{u.BrowserWindow.getAllWindows().length===0&&I()})});