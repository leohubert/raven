# Provenance des assets du theme `y2k`

Releve tel que constate par les agents de sourcing, licence comprise.
La majorite de ces assets sont sous copyright ou sans licence declaree :
usage interne assume, a revoir avant toute distribution publique.

Ce fichier vit hors de `assets/themes/`, il n'est donc pas embarque dans le
bundle - `electrobun.config.ts` ne copie que `assets/themes`.

---

## Groupe `clippy`

# clippy group — sources

Two upstream sources cover most of this set:

- **clippy.js** (`https://github.com/clippyjs/clippy.js`) ships the original Microsoft Agent
  character data as one PNG sprite sheet + a base64 MP3 pack per character. Repo carries
  `MIT-LICENSE.txt` ("Copyright (c) 2012 Fireplace, Inc"), which covers the library; the README
  credits "Microsoft, for creating clippy :)". The character artwork and audio themselves are
  Microsoft's Office Assistant assets, so treat them as **MIT library / underlying character art
  still Microsoft-owned, trademarked**.
- **archive.org item `windows98microsoftplus-sounds`** for the Windows/Office system sounds.
  The item page states **no licence and no rights** — these are Microsoft system WAVs.

Per-file preparation is noted below. Nothing was repainted or redrawn; work was limited to
cropping one frame out of a sprite sheet, alpha-trimming, rasterising an SVG, and one flat-white
background removal (explicitly flagged).

---

## clippy-classic.png
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Clippy/map.png
- licence: repo MIT (`MIT-LICENSE.txt`, Fireplace Inc 2012); underlying Clippit/Office Assistant
  artwork is Microsoft-owned and trademarked — unclear for redistribution
- notes: transparent PNG, 94x86. Frame 66 of the 27x34 sprite grid (124x93 cells), alpha-trimmed.
  Classic upright Clippy on the lined notepad, facing forward. Hero image.

## clippy-eyebrows.png
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Clippy/map.png
- licence: same as above (repo MIT / Microsoft character art)
- notes: transparent PNG, 94x89. Frame 112, alpha-trimmed. Clippy leaning with both eyebrows
  arched high — the "raised eyebrows" pose.

## clippy-stretched.png
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Clippy/map.png
- licence: same as above (repo MIT / Microsoft character art)
- notes: transparent PNG, 98x82. Frame 33, alpha-trimmed. Clippy part-unwound into a long loop,
  eyes to one side. Variant pose, reads differently from the classic when rotating.

## clippy-atom.png
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Clippy/map.png
- licence: same as above (repo MIT / Microsoft character art)
- notes: transparent PNG, 94x75. Frame 44, alpha-trimmed. Clippy mid-morph into the "atom"
  shape from the GetTechy animation — near-radial, the best spinner in the set.

## clippy-fanart-hires.png
- url: https://commons.wikimedia.org/wiki/File:Clippy_fanart.png
  (file: https://upload.wikimedia.org/wikipedia/commons/0/03/Clippy_fanart.png)
- licence: **CC BY-SA 3.0** — the only cleanly-licensed Clippy image found. Commons credits
  artist "wunkypunk" via Newgrounds, and the file page carries a `Restrictions: fan-art` flag.
- notes: transparent PNG, 670x786 (source was 900x900 **opaque**). Flat white background was
  flood-filled to transparent and the result alpha-trimmed — the drawing itself is untouched.
  Crude hand-drawn style, not the authentic render, but by far the highest-resolution option.

## links-the-cat.png
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Links/map.png
- licence: repo MIT / Microsoft character art, trademarked
- notes: transparent PNG, 82x66. Frame 0, alpha-trimmed. Links the cat sitting, tail up.

## rocky-the-dog.png
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Rocky/map.png
- licence: repo MIT / Microsoft character art, trademarked
- notes: transparent PNG, 81x89. Frame 24, alpha-trimmed. Rocky sitting inside the yellow
  "idea" starburst — picked over the plain sitting frames because the burst gives it colour
  and a radial silhouette that survives rotation.

## merlin-the-wizard.png
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Merlin/map.png
- licence: repo MIT / Microsoft character art, trademarked
- notes: transparent PNG, 76x119. Frame 0 of the 128x128 grid, alpha-trimmed. Merlin standing
  in the blue star-and-moon robe. Strongest colour contrast of the character set.

## genius-einstein.png
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Genius/map.png
- licence: repo MIT / Microsoft character art, trademarked
- notes: transparent PNG, 46x80. Frame 0, alpha-trimmed. The Genius (Einstein) assistant.
  Weakest of the images — narrow silhouette and the face muddies at 96px.

## office-97-logo.png
- url: https://commons.wikimedia.org/wiki/File:Microsoft_Office_9x_logo.svg
  (file: https://upload.wikimedia.org/wikipedia/commons/b/bf/Microsoft_Office_9x_logo.svg)
- licence: Commons file page says **Public domain**, with `Restrictions: trademarked`
- notes: transparent PNG, 512x512, rasterised from the 188x187 SVG. The four-piece
  red/blue/yellow/green Office 9x puzzle square. Detached object, square, spins perfectly.

---

## office-ding.wav
- url: https://archive.org/download/windows98microsoftplus-sounds/w98sounds%2FDING.WAV
  (item: https://archive.org/details/windows98microsoftplus-sounds)
- licence: **unclear** — item page states no licence and no rights; Microsoft system sound
- notes: 16-bit PCM WAV, 0.916 s. The classic Windows/Office notification "ding".

## office-chord-error.wav
- url: https://archive.org/download/windows98microsoftplus-sounds/w98sounds%2FCHORD.WAV
- licence: **unclear** — no licence/rights stated on the item; Microsoft system sound
- notes: 16-bit PCM WAV, 1.099 s. The Windows error/exclamation chord Office used for alerts.

## office-chimes.wav
- url: https://archive.org/download/windows98microsoftplus-sounds/w98sounds%2FCHIMES.WAV
- licence: **unclear** — no licence/rights stated on the item; Microsoft system sound
- notes: 16-bit PCM WAV, 0.631 s. Three-note descending chime.

## assistant-appear-chime.mp3
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Merlin/sounds-mp3.js
- licence: repo MIT / underlying Microsoft Agent audio, trademarked
- notes: MP3, 1.097 s. Sound id 18, decoded from the base64 data-URI pack. `Merlin/agent.js`
  maps this id to the **`Show`** animation — i.e. the Office Assistant appearance chime.

## assistant-magic-sparkle.mp3
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Merlin/sounds-mp3.js
- licence: repo MIT / underlying Microsoft Agent audio, trademarked
- notes: MP3, 1.176 s. Sound id 26, mapped to `DoMagic2`. Loudest clip in the set.

## clippy-empty-trash.mp3
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Clippy/sounds-mp3.js
- licence: repo MIT / underlying Microsoft Agent audio, trademarked
- notes: MP3, 0.575 s. Sound id 3, mapped to `EmptyTrash`. Paper-crumple whoosh; the punchiest
  of Clippy's own sounds.

## clippy-alert.mp3
- url: https://raw.githubusercontent.com/clippyjs/clippy.js/master/agents/Clippy/sounds-mp3.js
- licence: repo MIT / underlying Microsoft Agent audio, trademarked
- notes: MP3, 0.601 s. Sound id 6, mapped to `Alert` / `Hearing_1`.

---

## Groupe `bsod`

# bsod — sources

8 images, 6 sounds. Every file was verified with `file`, `magick identify` (images) and
`ffprobe` (sounds) after download. Licences are reported exactly as the source page stated
them; where a page said nothing, it says "unclear".

General caveat: all of this depicts Microsoft user-interface elements. Wikimedia Commons
tags them as free because the individual elements are below the threshold of originality
(`PD-text`, `PD-shape`, `PD-ineligible`), not because Microsoft released them. Trademark
still applies to the Windows wordmark/logo visible in `safe-to-turn-off.png`.

---

## IMAGES

## bsod-xp.png
- url: https://upload.wikimedia.org/wikipedia/commons/a/a8/Windows_XP_BSOD.png
- page: https://commons.wikimedia.org/wiki/File:Windows_XP_BSOD.png
- licence: Wikimedia Commons states Public domain, tag `{{Pd-ineligible}}`
- notes: 640x480 png, 1-bit colormap. Windows XP stop screen, PAGE_FAULT_IN_NONPAGED_AREA / SPCMDCON.SYS. Hero image, full screenshot.

## bsod-win9x.png
- url: https://upload.wikimedia.org/wikipedia/commons/3/3b/Windows_9X_BSOD.png
- page: https://commons.wikimedia.org/wiki/File:Windows_9X_BSOD.png
- licence: Wikimedia Commons states Public domain, tag `{{freescreenshot|PD-ineligible}}`
- notes: 640x400 png, 2-bit colormap. Windows 9x/Me BSOD, "An error has occurred. To continue:" with the boxed `Windows` title. Hero image, full screenshot.

## bsod-win95.png
- url: https://upload.wikimedia.org/wikipedia/commons/a/a3/Windows_95_BSOD.png
- page: https://commons.wikimedia.org/wiki/File:Windows_95_BSOD.png
- licence: Wikimedia Commons states Public domain, tag `{{PD-text}}`
- notes: 640x480 png, 8-bit RGB. Windows 95 "A fatal exception 0E has occurred at 0028:C0030572 in VXD VFAT(01)". Hero image, full screenshot. Third blue screen — closest to the cut line if you want only two.

## safe-to-turn-off.png
- url: https://upload.wikimedia.org/wikipedia/commons/3/34/Windows95-4.0.189-Safe.png
- page: https://commons.wikimedia.org/wiki/File:Windows95-4.0.189-Safe.png
- licence: Wikimedia Commons states Public domain, tag `{{PD-text}}`
- notes: 640x400 png, 8-bit colormap. Black screen, purple/blue "Microsoft Windows 95" logotype, red text "You can now safely turn off your computer." English. Full screenshot but reads well because of the black ground.

## hourglass-cursor.png
- url: https://upload.wikimedia.org/wikipedia/commons/9/9f/Windows_95_BUSY_L_32x32-4.png
- page: https://commons.wikimedia.org/wiki/File:Windows_95_BUSY_L_32x32-4.png
- licence: Wikimedia Commons states Public domain, tag `{{PD-shape}}`
- notes: 320x320 png, RGBA transparent cut-out. The Windows 95 BUSY (hourglass) cursor, large variant, upscaled pixel art. Best spinning sprite in the set.

## arrow-cursor.png
- url: https://upload.wikimedia.org/wikipedia/commons/b/b7/Windows_95_ARROW_L_32x32-4.png
- page: https://commons.wikimedia.org/wiki/File:Windows_95_ARROW_L_32x32-4.png
- licence: Wikimedia Commons states Public domain, tag `{{PD-shape}}`
- notes: 320x320 png, RGBA transparent cut-out. Windows 95 standard arrow pointer, large variant. Bonus — not a crash icon, include only if you want a plain pointer in the mix.

## warning-triangle.png
- url: https://upload.wikimedia.org/wikipedia/commons/f/f8/Windows_95_%21.png
- page: https://commons.wikimedia.org/wiki/File:Windows_95_!.png
- licence: Wikimedia Commons states Public domain, tag `{{PD-shape}}`
- notes: 500x515 png, RGBA transparent cut-out. Yellow warning triangle with black exclamation mark and drop shadow, from Windows 95 dialogs.

## critical-error-x.png
- url: https://upload.wikimedia.org/wikipedia/commons/3/31/Windows_95_%C3%97.png
- page: https://commons.wikimedia.org/wiki/File:Windows_95_×.png
- licence: Wikimedia Commons states Public domain, tag `{{PD-shape}}`
- notes: 500x500 png, RGBA transparent cut-out. Red circle with white X — the Windows 95 critical-error dialog icon, with drop shadow.

---

## SOUNDS

All six are Microsoft system sounds. None of the archive.org items states a licence for
them, and they are Microsoft-copyrighted assets — treat as "unclear / Microsoft
copyrighted", not as free-to-redistribute.

## win95-chord.wav
- url: https://archive.org/download/windows-3.1-95-and-98/Windows%203.1%2095%20and%2098.zip -> `Windows95.zip` -> `CHORD.WAV`
- page: https://archive.org/details/windows-3.1-95-and-98
- licence: unclear — archive.org item states no licence; Microsoft system sound
- notes: 1.131s wav, 8-bit mono PCM 22050 Hz. The classic Windows chord (default Critical Stop in 95/98/ME/2000). Sound occupies 0.00–0.57s; the remaining 0.56s is silence (~50% of the file).

## win98-critical-stop.wav
- url: https://archive.org/download/windows-3.1-95-and-98/Windows%203.1%2095%20and%2098.zip -> `Windows98Sounds.zip` -> `Windows 98/Windows 98 critical stop.wav`
- page: https://archive.org/details/windows-3.1-95-and-98
- licence: unclear — archive.org item states no licence; Microsoft system sound
- notes: 2.763s wav, MS-ADPCM stereo 22050 Hz. The Windows 98 theme's Critical Stop — a slow swell, not a single hit. Audio spans 0.17–2.43s; loudest core is 0.95–2.05s.

## win98-shutdown.wav
- url: https://archive.org/download/windows-3.1-95-and-98/Windows%203.1%2095%20and%2098.zip -> `Windows98Sounds.zip` -> `Windows 98/Windows 98 exit windows.wav`
- page: https://archive.org/details/windows-3.1-95-and-98
- licence: unclear — archive.org item states no licence; Microsoft system sound
- notes: 5.962s wav, MS-ADPCM stereo 22050 Hz. The full Windows 98 shutdown jingle. Continuous music 0.19–5.58s with no quiet spot — there is no natural 1s hit; use the opening phrase 0.19–1.35s.

## winxp-critical-stop.wav
- url: https://archive.org/download/windows-xp-sounds_202604/Windows%20XP%20sounds.zip -> `Windows XP sounds/Windows XP Critical Stop.wav`
- page: https://archive.org/details/windows-xp-sounds_202604
- licence: unclear — archive.org item states no licence; Microsoft system sound
- notes: 0.892s wav, 16-bit mono PCM 22050 Hz. Windows XP critical error. Audio 0.00–0.73s, then 0.17s of silence. Already close to final clip length.

## winxp-ding.wav
- url: https://archive.org/download/windows-xp-sounds_202604/Windows%20XP%20sounds.zip -> `Windows XP sounds/Windows XP Ding.wav`
- page: https://archive.org/details/windows-xp-sounds_202604
- licence: unclear — archive.org item states no licence; Microsoft system sound
- notes: 0.387s wav, 16-bit mono PCM 22050 Hz. The XP "ding". Audio 0.00–0.27s. Shortest file in the set — usable untrimmed.

## winxp-shutdown.wav
- url: https://archive.org/download/windows-xp-sounds_202604/Windows%20XP%20sounds.zip -> `Windows XP sounds/Windows XP Shutdown.wav`
- page: https://archive.org/details/windows-xp-sounds_202604
- licence: unclear — archive.org item states no licence; Microsoft system sound
- notes: 3.204s wav, 16-bit stereo PCM 22050 Hz. The XP shutdown jingle. Body is 0.00–1.30s, then a long decaying reverb tail out to ~2.9s and 0.3s of true silence.

---

## Groupe `dialup`

# dialup — sources

7 images, 7 sounds. Every file verified with `file`, `magick identify` (images) and
`ffprobe` (sounds) after download.

Where a file says "processed", the processing was done here with ImageMagick and is
stated per file. Nothing else was retouched.

---

## IMAGES

## usrobotics-56k-modem.png
- url: https://commons.wikimedia.org/wiki/File:US_Robotics_56K_Sportster_Voice_telephone_modem,_front_(removed_background,_horizontal,_perspective).jpg
- file: https://upload.wikimedia.org/wikipedia/commons/8/8f/US_Robotics_56K_Sportster_Voice_telephone_modem%2C_front_%28removed_background%2C_horizontal%2C_perspective%29.jpg
- licence: CC BY 3.0 — "Creative Commons Attribution 3.0". Artist field: "US Robotics 56K Modem Front.JPG: Xiaowei / derivative work of 30 March 2024: Pittigrilli"
- notes: US Robotics Sportster Voice 56k Faxmodem, front view. Source was a 3155x1530 JPEG
  on a pure-white background. **Processed:** white background flood-filled to transparent
  (fuzz 12%) from the four corners and trimmed → 2971x1346 transparent PNG.
  Aspect is 2.2:1, so at 96px it renders as a ~96x43 sliver. Still reads as "modem".

## aol-logo-running-man.png
- url: https://commons.wikimedia.org/wiki/File:America_Online_logo.svg
- file: https://upload.wikimedia.org/wikipedia/commons/0/09/America_Online_logo.svg
- licence: page says "Public domain" / "Public domain", with Restrictions field: "trademarked".
  Artist field: "America Online, Inc." Credit: brandsoftheworld.com.
- notes: The classic blue AOL triangle with the running-man/eye mark over the
  "AMERICA Online" wordmark. **Processed:** SVG rasterised at 1024px wide with a
  transparent background → 1024x897 PNG. Hero image.

## aol-free-trial-cd.png
- url: https://commons.wikimedia.org/wiki/File:AOL_CD-ROM,_German,_650_hours_free_Internet-49221.jpg
- file: https://upload.wikimedia.org/wikipedia/commons/a/a7/AOL_CD-ROM%2C_German%2C_650_hours_free_Internet-49221.jpg
- licence: CC BY-SA 4.0. Artist: Raimond Spekking.
- notes: Red AOL 9.0 free-trial disc, "650 Stunden GRATIS Internet testen!", AOL logo at
  the bottom. German-market disc. Source 3489x3389 JPEG on a near-white (#f3f3f3) studio
  background. **Processed:** background flood-filled to transparent (fuzz 12%) from the
  corners, trimmed, resized to 1200x1186. Perfect circle — best spinning subject of the set.

## netscape-navigator-logo.png
- url: https://commons.wikimedia.org/wiki/File:Netscape_icon_2007.svg
- file: https://upload.wikimedia.org/wikipedia/commons/3/38/Netscape_icon_2007.svg
- licence: page says "Public domain" / "Public domain", Restrictions field: "trademarked".
  Artist field: "Netscape Communications Corp."
- notes: The Netscape "N" over the teal horizon disc. This is the round icon version, not
  the ship's-wheel. **Processed:** SVG rasterised to 512x512, transparent background.

## win98-dialup-networking-icon.png
- url: https://github.com/zhaotianff/Win98-Icons — raw file
  https://raw.githubusercontent.com/zhaotianff/Win98-Icons/master/icons/conn_dialup_alt.png
- licence: unclear. The GitHub repo carries an MIT licence file, but its README says
  "Microsoft Windows 98 png icons — from the internet, for communication and learning
  purposes". The artwork itself is Microsoft Windows 98 system iconography, so the MIT
  tag almost certainly does not cover it. Treat as Microsoft copyright / unclear.
- notes: The Windows 98 "Dial-Up Networking connection" icon — globe + yellow desk phone +
  red dotted link. Source is 32x32 pixel art. **Processed:** nearest-neighbour ("point")
  upscale 8x to 256x256 so that your 256→128 downscale stays an integer ratio and the
  pixels stay crisp. Do NOT resample this one with a smooth filter at a non-integer ratio.

## win98-modem-connection-icon.png
- url: https://raw.githubusercontent.com/zhaotianff/Win98-Icons/master/icons/conn_dialup.png
- licence: unclear — same as above (repo MIT, README "from the internet, for communication
  and learning purposes", artwork is Microsoft Windows 98).
- notes: Windows 98 "dial-up connection" icon — two beige PCs wired to a small yellow
  external modem. Source 32x32 pixel art, **processed:** 8x nearest-neighbour → 256x256.
  Slightly busier than the one above at 96px, but still legible.

## rotary-phone-off-hook.png
- url: https://openclipart.org/detail/318298/rotary-phone-off-the-hook
- file: https://openclipart.org/image/800px/318298
- licence: page states "Openclipart is 100% Public Domain" (Openclipart publishes under CC0).
- notes: Flat black silhouette of a rotary desk phone, handset off the hook, long coiled
  cord. 800x765, already transparent (grey+alpha PNG), unmodified. Nearly all black — will
  disappear against a very dark wallpaper.

---

## SOUNDS

## modem-handshake.ogg
- url: https://commons.wikimedia.org/wiki/File:Dial_up_modem_noises.ogg
- file: https://upload.wikimedia.org/wikipedia/commons/3/33/Dial_up_modem_noises.ogg
- licence: "I, the copyright holder of this work, release this work into the public domain.
  This applies worldwide." (Public domain)
- notes: 28.60s, Ogg Vorbis, 44.1kHz stereo. Full V.90 dial-out and handshake. Structure
  measured with silencedetect (-30dB/0.2s) and 0.25s volumedetect windows, cross-checked
  against a spectrogram:
    0.00–1.19  silence
    1.19–4.04  DTMF touch-tone dialling (discrete steps, 600–2000 Hz)
    4.04–6.67  silence (waiting for answer)
    6.67–9.14  answer tone / ANSam, sustained ~2.1 kHz
    9.14–10.04 near-silence
    10.04–14.9 V.8 negotiation — the structured "bee-doo" bursts
    14.9–26.54 the broadband screech (wall of noise, 0–3.5 kHz)
    26.54–28.60 silence (speaker muted = connected)
  **Loudest / most strident window: 23.5–26.5s** (mean -20.0 dB, peaks -7.6 dB at 23.50s
  and -7.8 dB at 25.25s). Best single second: **25.0–26.0s** (mean -19.9 dB, steady, pure
  screech, ends just before the 26.54s cut-off). Runner-up: 23.4–24.4s, which catches the
  single loudest peak plus a banded retrain texture.
  If you'd rather have the *recognisable pattern* than pure noise, use 11.0–12.0s.

## aol-youve-got-mail.wav
- url: https://archive.org/details/im_20191103 — file
  https://archive.org/download/im_20191103/You%27ve%20Got%20Mail.wav
- licence: unclear. No licence is stated on the item. Uploader description: "These are
  sound effects I ripped from an old version of AOL instant messenger way back when."
  The audio is AOL's (Elwood Edwards recording).
- notes: 0.975s, 8-bit mono PCM 11127 Hz — the authentic low-bitrate original.
  silencedetect at -35dB finds no silence: **the whole 0.00–0.97s is the phrase.**
  No trimming needed.

## aol-welcome.wav
- url: https://archive.org/download/im_20191103/Welcome.wav
- licence: unclear — same item, no licence stated, AOL-owned audio.
- notes: 0.634s, 8-bit mono PCM 22254 Hz. No silence at -35dB — **use 0.00–0.63s whole.**

## aol-goodbye.wav
- url: https://archive.org/download/im_20191103/Goodbye.wav
- licence: unclear — same item, no licence stated, AOL-owned audio.
- notes: 0.511s, 8-bit mono PCM 11127 Hz. No silence at -35dB — **use 0.00–0.51s whole.**

## phone-busy-signal.ogg
- url: https://commons.wikimedia.org/wiki/File:Old_North_American_busy_signal.ogg
- file: https://upload.wikimedia.org/wikipedia/commons/d/d5/Old_North_American_busy_signal.ogg
- licence: Public domain. Artist field: "Original uploader was Denelson83 at en.wikipedia".
- notes: 6.00s, Ogg Vorbis mono 44.1kHz. Perfectly regular 0.5s-on / 0.5s-off cadence
  throughout (silencedetect: tone 0.0–0.5, silent 0.5–1.0, repeating).
  **Punchy bit: 0.00–0.50s for a single beep, or 0.00–1.00s for one full beep-gap cycle.**

## phone-dtmf-dialing.ogg
- url: https://commons.wikimedia.org/wiki/File:DTMF_dialing.ogg
- file: https://upload.wikimedia.org/wikipedia/commons/1/1c/DTMF_dialing.ogg
- licence: Public domain. Artist field: "User:Jahoe".
- notes: 12.50s, Ogg Vorbis mono 8000 Hz. Eight ~1.0s touch tones separated by ~0.49s gaps.
  Tone windows: 0.50–1.50, 1.99–3.02, 3.50–4.50, 5.00–6.01, 6.48–7.51, 7.99–9.01,
  9.49–10.51, 10.99–12.01.
  **Punchy bit: 0.50–1.50s** (one clean whole tone), or 0.50–0.90s for a short blip.

## phone-dial-tone.ogg
- url: https://commons.wikimedia.org/wiki/File:US_dial_tone.ogg
- file: https://upload.wikimedia.org/wikipedia/commons/e/e5/US_dial_tone.ogg
- licence: CC0. Artist field: "Edokter".
- notes: 5.00s, Ogg Vorbis mono 8000 Hz. Continuous unmodulated US dial tone (350+440 Hz),
  no silence anywhere at -35dB. **Any window works; use 0.20–1.00s** (skip the first 0.2s
  in case of an encoder ramp). This is the flattest of the seven sounds — no transient,
  so it will read as a steady hum rather than a click.

---

## Groupe `msn`

# MSN group — asset sources

9 images, 5 sounds. Every file verified with `file`, `magick identify` (images) and
`ffprobe` (sounds). Sound "punchy range" measured with
`ffmpeg -af silencedetect=n=-35dB:d=0.03`.

---

## msn-nudge.wav
- url: https://archive.org/download/nudge_202411/nudge.wav
- item: https://archive.org/details/nudge_202411 ("MSN Messenger 7.0 sounds")
- licence: unclear — the archive.org item declares no licence and no rights field.
  Original sound asset is Microsoft's, uploaded by a user.
- notes: 0.891s total, 16-bit stereo 48kHz. Signal runs 0.000–0.821s, then a 0.07s
  tail of near-silence. **Punchy bit: 0.00–0.82s.** Essentially the whole file is
  the buzz. This is the real nudge/wizz.

## msn-new-message.wav
- url: https://archive.org/download/nudge_202411/newalert.wav
- item: https://archive.org/details/nudge_202411
- licence: unclear — no licence stated on the item.
- notes: 0.672s total, 8-bit mono 22.05kHz. **Punchy bit: 0.00–0.49s.** Last 0.18s
  is silence. This is `newalert.wav`, the incoming-message notification blip.

## msn-contact-online.wav
- url: https://archive.org/download/nudge_202411/online.wav
- item: https://archive.org/details/nudge_202411
- licence: unclear — no licence stated on the item.
- notes: 1.396s total, 8-bit mono 22.05kHz. **Punchy bit: 0.00–0.46s.** The
  remaining 0.93s (67% of the file) is silence — trim hard. This is MSN's
  `online.wav`, the rising chime played when a contact signs in.

## msn-ring.wav
- url: https://archive.org/download/nudge_202411/ring.wav
- item: https://archive.org/details/nudge_202411
- licence: unclear — no licence stated on the item.
- notes: 0.882s total, 8-bit mono 22.05kHz. **Punchy bit: 0.00–0.61s.** Last 0.27s
  is silence. MSN's voice-call ring / invite sound.

## msn-new-email.wav
- url: https://archive.org/download/nudge_202411/newemail.wav
- item: https://archive.org/details/nudge_202411
- licence: unclear — no licence stated on the item.
- notes: 1.652s total, 8-bit mono 22.05kHz. **Punchy bit: 0.04–0.66s.** The last
  0.99s (60% of the file) is silence. Hotmail new-mail chime.

---

## msn-buddy-green.png
- url: https://upload.wikimedia.org/wikipedia/commons/4/43/MSN_messenger_icon.png
- page: https://commons.wikimedia.org/wiki/File:MSN_messenger_icon.png
- licence: Public domain (as tagged on Wikimedia Commons). Underlying design is a
  Microsoft trademark.
- notes: 251x252 RGBA, transparent background. The classic MSN Messenger 7 icon —
  green buddy + blue buddy with the orange swoosh. Hero image, untouched original.

## msn-butterfly.png
- url: https://upload.wikimedia.org/wikipedia/commons/9/92/MSN_2000-2009.png
- page: https://commons.wikimedia.org/wiki/File:MSN_2000-2009.png
- licence: CC BY-SA 4.0 (as tagged on Wikimedia Commons). Underlying design is a
  Microsoft trademark.
- notes: 364x290 RGBA. DERIVED — I cropped the butterfly out of the full
  "msn" wordmark logo, erased the tail of the "n" and the ® marks, and keyed the
  white background to transparent. Tiny stair-step artefacts on the lower wing
  edges from that erase; invisible at 96px.

## msn-smiley.png
- url: https://raw.githubusercontent.com/rozniak/MSN-Emoticons/master/smile.svg
- repo: https://github.com/rozniak/MSN-Emoticons
- licence: unclear — the repo README says verbatim: "Since these are directly based
  on emoticons created by Microsoft Corporation I have not put a licence on this
  repository as I don't know what one would be appropriate (or what is allowed).
  Presumably fine for non-commercial/personal use I would imagine."
- notes: 512x512 RGBA, rendered from SVG with `rsvg-convert`. Vector recreation of
  the classic 19x19 MSN `:)` smiley, so it is genuinely sharp at this size.

## msn-smiley-wink.png
- url: https://raw.githubusercontent.com/rozniak/MSN-Emoticons/master/wink.svg
- licence: unclear — same repo statement as msn-smiley.png.
- notes: 512x512 RGBA, rendered from SVG. The `;)` wink emoticon.

## msn-smiley-tongue.png
- url: https://raw.githubusercontent.com/rozniak/MSN-Emoticons/master/tongue.svg
- licence: unclear — same repo statement as msn-smiley.png.
- notes: 512x512 RGBA, rendered from SVG. The `:P` tongue-out emoticon.

## msn-smiley-angry.png
- url: https://raw.githubusercontent.com/rozniak/MSN-Emoticons/master/angry.svg
- licence: unclear — same repo statement as msn-smiley.png.
- notes: 512x512 RGBA, rendered from SVG. The red angry face — the only
  non-yellow emoticon in the set, so the most visually distinct of the four.

## msn-messenger-window.png
- url: https://upload.wikimedia.org/wikipedia/commons/7/77/Escargot_Windows_Live_Messenger.png
- page: https://commons.wikimedia.org/wiki/File:Escargot_Windows_Live_Messenger.png
- licence: CC BY-SA 4.0 (as tagged on Wikimedia Commons).
- notes: 320x370. DERIVED — cropped the top 370px out of the original 320x694
  screenshot, because the full window is too tall to survive a square downscale.
  Shows the WLM title bar, menu, avatar and contact list. The only screenshot in
  the set. It is a rectangular UI grab, so it will be the mushiest asset here.

## icq-flower.png
- url: https://upload.wikimedia.org/wikipedia/commons/c/cc/Logo_ICQ.svg
- page: https://commons.wikimedia.org/wiki/File:Logo_ICQ.svg
- licence: Public domain (as tagged on Wikimedia Commons). ICQ is a trademark.
- notes: 744x744 RGBA, rendered from SVG with `rsvg-convert`. The classic ICQ green
  flower with the yellow centre and one red petal. Detached shape, spins well.

## aim-running-man.png
- url: https://upload.wikimedia.org/wikipedia/commons/5/5a/AIM_logo.svg
- page: https://commons.wikimedia.org/wiki/File:AIM_logo.svg
- licence: Public domain (as tagged on Wikimedia Commons). AIM is a trademark.
- notes: 737x886 RGBA. DERIVED — rendered the SVG at 1345px tall, cropped the
  running man out of the full "AOL Instant Messenger" lockup, and keyed out the
  blue triangle behind him. Clean silhouette on transparency.

---

## Groupe `nokia`

# nokia — sources

Licences are recorded exactly as the source page stated them. "unclear" means the page
said nothing; it is not a guess that the file is free.

## IMAGES (6)

## nokia-3310.png
- url: https://upload.wikimedia.org/wikipedia/commons/7/78/Nokia_3310_Blue_R7309170_%28retouch%29.png
- page: https://commons.wikimedia.org/wiki/File:Nokia_3310_Blue_R7309170_(retouch).png
- licence: "FAL — Free Art License" (as stated by the Commons file page)
- notes: transparent-background PNG cut-out, 948x2160 RGBA, verified alpha=0 at all corners.
  Classic dark-blue 3310, green LCD lit showing the menu. This is the hero handset image.

## nokia-connecting-people-hands.png
- url: https://www.freepnglogos.com/uploads/nokia-with-hands-connecting-people-png-22.png
- page: https://www.freepnglogos.com/images/nokia-logo-png-1490.html
- licence: unclear — the page carries no licence statement; the site only bills itself as
  "Free Transparent PNG Logos". The Nokia name, wordmark and hands logo are registered
  trademarks of Nokia Corporation.
- notes: transparent PNG, 3000x1503 RGBA. The two-hands "Connecting People" logo with the
  Nokia wordmark below. Hero logo image. Wide aspect — will letterbox inside a 128x128 box.

## nokia-bl5c-battery.jpg
- url: https://upload.wikimedia.org/wikipedia/commons/3/34/Nokia_X2-02_-_Li-Ion_battery_BL-5C-3264.jpg
- page: https://commons.wikimedia.org/wiki/File:Nokia_X2-02_-_Li-Ion_battery_BL-5C-3264.jpg
- licence: "CC BY-SA 4.0 — Creative Commons Attribution-Share Alike 4.0"
- notes: JPEG 4279x2805, no alpha. The classic Nokia BL-5C battery shot flat on a plain
  near-white studio background, so it crops/keys to a clean detached object. Reads as
  "NOKIA BL-5C" even small.

## sim-card-icon.png
- url: https://upload.wikimedia.org/wikipedia/commons/7/7b/Icons8_flat_sim_card.svg
- page: https://commons.wikimedia.org/wiki/File:Icons8_flat_sim_card.svg
- licence: "MIT — MIT license"
- notes: transparent PNG 512x512 RGBA, rasterised by me from the source SVG at 512px.
  Flat teal SIM card with an orange contact pad. Not period-accurate Nokia art — it is a
  modern flat icon — but it is a clean detached object that spins well.

## snake-lcd-sprites.png
- url: https://www.spriters-resource.com/media/assets/187/190587.png
- page: https://www.spriters-resource.com/mobile/snakenokia3310/asset/190587/
- licence: unclear — no licence statement; The Spriters Resource is a community archive of
  assets ripped from games. Snake II / Nokia assets remain © their respective authors.
- notes: the ORIGINAL file is 36x22 PNG (well under the 256px floor). I upscaled it 12x with
  nearest-neighbour (`magick -scale`) to 432x264, which is lossless for pixel art — no
  interpolation, every source pixel becomes a hard 12x12 block. Dark-green-on-light-green
  Snake II sprite sheet: the LCD digit font plus the snake/creature sprites. It is a
  rectangle, not a cut-out, but it is 2-colour high-contrast pixel art so it does not turn
  to mush when small.

## nokia-1011-antenna-phone.png
- url: https://assets.stickpng.com/images/6127c893aa481f0004ea72ac.png
- page: https://www.stickpng.com/img/objects/phone/vintage-nokia-phone
- licence: the page states verbatim: "License: Free for personal use only. Commercial usage:
  Not allowed. The products or characters depicted in these images are © by their respective
  authors."
- notes: transparent PNG 275x550 (long side above 256, but only just). Chunky early-90s
  Nokia brick with a stub antenna, branded "Telekom D1" over a NOKIA LCD bezel. Good
  "chunky phone antenna" object. NOT usable commercially per the licence above.

## SOUNDS (6)

## nokia-tune.ogg
- url: https://upload.wikimedia.org/wikipedia/commons/b/bd/Nokia_tune.ogg
- page: https://commons.wikimedia.org/wiki/File:Nokia_tune.ogg
- licence: "Public domain" — the page states: "This work has been released into the public
  domain by its author, Ender2101 at English Wikipedia. This applies worldwide."
- notes: 6.12s Ogg Vorbis. A piano rendition of bars 13-16 of Tárrega's "Gran Vals" — i.e.
  exactly the Nokia tune phrase, not a phone rip, so it sounds like a piano, not a bleeper.
  No leading silence. Audio runs 0.00-5.07s, then silence to the end.
  Note onsets: 0.13 / 0.34 / 0.60 / 1.05 / 1.71 / 1.96 / 2.38 s.
  PUNCHY BIT: the four-note hook is 0.10-1.70s. For a ~1s cut use 0.10-1.10s (three notes
  plus the attack of the held fourth).

## gran-vals-tarrega.ogg
- url: https://upload.wikimedia.org/wikipedia/commons/9/95/Francisco_T%C3%A1rrega_-_Gran_Vals.ogg
- page: https://commons.wikimedia.org/wiki/File:Francisco_T%C3%A1rrega_-_Gran_Vals.ogg
- licence: dual, as stated on the page — composition "public domain (the author died in
  1909)"; performance "made available under the Creative Commons CC0 1.0 Universal Public
  Domain Dedication". 2024 recording by Joni Ikäläinen.
- notes: 182.32s Ogg Vorbis, the WHOLE piece. 97% of it is not the hook.
  PUNCHY BIT: the Nokia phrase (bars 13-16) is at ~13.85-15.40s; it recurs at
  ~158.95-160.50s. I located these by chroma cross-correlation against nokia-tune.ogg
  (similarity 0.86 and 0.88, the two highest peaks in the whole file by a clear margin) and
  confirmed the rising D-E-F#-G# pitch sequence in that window — I did not verify by ear.

## nokia-sms-beep.mp3
- url: https://archive.org/download/oldnokiasmstonefreeringtonesdownload/Old%20Nokia%20Sms%20Tone%20Free%20Ringtones%20Download.mp3
- page: https://archive.org/details/oldnokiasmstonefreeringtonesdownload
- licence: unclear — the archive.org item declares no licence and no rights statement. It is
  a re-upload from a ringtone download site.
- notes: 29.84s MP3, and it is MOSTLY SILENCE/repetition. Structure: 1.74s of leading
  silence, then the beep phrase 1.74-3.40s, repeated four times (next starts at 6.34,
  11.15, 15.95), then 11.8s of dead air from 18.04s to the end.
  PUNCHY BIT: 1.74-3.35s is the full "beep-beep ... beep-beep". A single "beep-beep" pair is
  1.74-2.25s (0.51s) — that is the tightest usable cut.

## nokia-3310-playground-ringtone.mp3
- url: https://archive.org/download/nokia-3310-ringtone-playground/NOKIA%203310%20ringtone%20%20%20Playground.mp3
- page: https://archive.org/details/nokia-3310-ringtone-playground
- licence: unclear — the archive.org item declares no licence and no rights statement.
  A rip of the stock "Playground" monophonic ringtone from the Nokia 3310.
- notes: 13.82s MP3. Authentic bleepy monophonic 3310 voice. Structure: phrase A 0.00-1.73s,
  short gap, phrase B 2.20-3.89s, then 3.0s of silence, then the whole thing repeats at
  6.88s. No leading silence.
  PUNCHY BIT: 0.00-1.30s. The full opening phrase is 0.00-1.73s.

## nokia-tune-ringtone-2008.mp3
- url: https://archive.org/download/nokia-tune-ringtone-2008-360p-online-audio-converter.com/Nokia%20Tune%20Ringtone%20%282008%29%20%28360p%29%20%28online-audio-converter.com%29.mp3
- page: https://archive.org/details/nokia-tune-ringtone-2008-360p-online-audio-converter.com
- licence: unclear — no licence or rights statement. The identifier says it is YouTube audio
  put through an online converter, so it is a rip of a rip.
- notes: 37.01s MP3, continuous audio 0.40-36.35s. It is a COMPILATION: the Nokia tune motif
  appears four times, at ~1.95s, ~10.03s, ~17.88s and ~25.87s (found by chroma matching
  against nokia-tune.ogg, scores 0.84-0.87), i.e. roughly four 8s arrangements back to back.
  The first ~1.9s is a lead-in I could not identify.
  PUNCHY BIT: 1.95-3.05s. Included only because it is the one *phone-sounding* rendition of
  the group's priority tune that I could source; the licence is not clean.

## dtmf-keypad-tones.ogg
- url: https://upload.wikimedia.org/wikipedia/commons/9/94/DTMF_123456789%2A0%E2%8B%95ABCD.ogg
- page: https://commons.wikimedia.org/wiki/File:DTMF_123456789*0%E2%8B%95ABCD.ogg
- licence: "CC0 — Creative Commons Zero, Public Domain Dedication"
- notes: 4.39s Ogg Vorbis, mono. Generic telephone DTMF, not a Nokia recording: 16 tones
  (1-9, *, 0, #, A, B, C, D) played back to back, 0.50-3.90s, ~0.21s per tone, with 0.50s of
  leading and 0.49s of trailing silence.
  PUNCHY BIT: any single keypress, e.g. 0.50-0.72s ("1"). For a two-beep press take
  0.50-0.94s.

---

## Groupe `winamp`

# winamp group — asset sources

All files below were downloaded and verified (`file`, `magick identify`, `ffprobe`).

---

## IMAGES

## winamp-logo.png
- url: https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Winamp-logo.svg/960px-Winamp-logo.svg.png
- page: https://commons.wikimedia.org/wiki/File:Winamp-logo.svg
- licence: "Public domain" (Commons licence field); credit line reads "Own work based on: File:Winamp-logo.png". Winamp is a trademark of its owner; page does not address trademark.
- notes: 960x966 PNG, transparent background. The lightning-bolt-in-diamond mark. Rendered from the Commons SVG via the Wikimedia thumbnailer, then trimmed.

## llama.png
- url: https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Fluent_Emoji_flat_1f999.svg/960px-Fluent_Emoji_flat_1f999.svg.png
- page: https://commons.wikimedia.org/wiki/File:Fluent_Emoji_flat_1f999.svg
- licence: MIT license (Microsoft Fluent Emoji, https://github.com/microsoft/fluentui-emoji/)
- notes: 781x840 PNG, transparent background. Flat-illustration llama, side view. Chosen over llama photos because every free llama photo on Commons has a scenic background that turns to mush at 96px.

## cd-rainbow.png
- url: https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/OD_Compact_Disc_vector.svg/960px-OD_Compact_Disc_vector.svg.png
- page: https://commons.wikimedia.org/wiki/File:OD_Compact_Disc_vector.svg
- licence: "Public domain" (Commons licence field), own work by Commons user Amitie 10g / Davod
- notes: 960x960 PNG, transparent background. Data side of a disc with full rainbow sheen. Perfect circle — ideal spinning confetti.

## cd-r-verbatim.png
- url: https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Blank_Verbatim_CD-R_%28Front%29.jpg/960px-Blank_Verbatim_CD-R_%28Front%29.jpg
- page: https://commons.wikimedia.org/wiki/File:Blank_Verbatim_CD-R_(Front).jpg
- licence: CC0 / Creative Commons Zero, Public Domain Dedication (own work, Commons user DiscoA340)
- notes: 899x917 PNG. Photo of a real blank Verbatim 700MB/52x CD-R, label side. I removed the grey studio background myself with a corner flood-fill (`magick -fuzz 20% -draw "alpha 0,0 floodfill"`) and trimmed; result is a clean transparent circular cut-out, verified against a dark background with no halo.

## floppy-disk.png
- url: https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/3_5_floppy_diskette.svg/960px-3_5_floppy_diskette.svg.png
- page: https://commons.wikimedia.org/wiki/File:3_5_floppy_diskette.svg
- licence: "Public domain" (Commons licence field), own work by Commons user Nevit
- notes: 960x1008 PNG, transparent background. Front view of a 3.5" diskette, dark slate body with white label.

## discman.png
- url: https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Sony-Discman-D-E307CK.jpg/960px-Sony-Discman-D-E307CK.jpg
- page: https://commons.wikimedia.org/wiki/File:Sony-Discman-D-E307CK.jpg
- licence: CC BY-SA 4.0 (own work, Commons user Mikus) — attribution + share-alike required
- notes: 865x854 PNG. Sony Discman ESP "CAR READY" portable CD player, top view. I cut the white studio background myself with a corner flood-fill and trimmed; verified no white halo on a dark background.

## zip-disk.png
- url: https://upload.wikimedia.org/wikipedia/commons/a/a3/Iomega-100-MB-ZIP-disk.jpg
- page: https://commons.wikimedia.org/wiki/File:Iomega-100-MB-ZIP-disk.jpg
- licence: CC BY-SA 3.0 (author "KMJ"; page also lists GNU Free Documentation License) — attribution + share-alike required
- notes: 766x372 PNG. Iomega 100 MB Zip disk, three-quarter view. White background cut out by me with a corner flood-fill; verified clean.

## winamp-classic-player.png
- url: https://raw.githubusercontent.com/captbaritone/webamp/master/packages/webamp-demo/skins/base-2.91.wsz
- page: https://github.com/captbaritone/webamp
- licence: unclear. The webamp repository is MIT (Copyright (c) 2015 Jordan Eldredge) but base-2.91.wsz is the original Nullsoft Winamp 2.91 classic skin bundled into it; the skin artwork itself carries no stated licence and "Winamp" is a trademark. Treat as unclear / trademark.
- notes: 825x348 PNG (275x116 native, nearest-neighbour 3x). NOT a screenshot — I composited the real classic main window from the skin's own sprite sheets (MAIN.BMP + TITLEBAR.BMP + CBUTTONS.BMP + POSBAR.BMP + VOLUME.BMP + MONOSTER.BMP + SHUFREP.BMP + PLAYPAUS.BMP + NUMBERS.BMP) at the documented Winamp 2.x coordinates, so it shows the titlebar, transport buttons, EQ/PL toggles, sliders and a 03:42 readout. Rectangular (no transparency) — this is the one "player window" asset.

---

## SOUNDS

## llama-ass.mp3
- url: https://raw.githubusercontent.com/notpeter/winamp-demo/master/demo-original.mp3
- page: https://github.com/notpeter/winamp-demo
- licence: unclear. Repo has no LICENSE file. Original Winamp 1.91 demo.mp3 (1998-05-03), performed by JJ McKay aka DJ Mike Llama; Nullsoft/Winamp property.
- notes: 3.898s total, mono 22.05kHz. Dry voice-over, no music bed. "Winamp." = 0.28-0.82s. Silence 0.82-1.17s. "It really whips the llama's ass." = 1.17-3.60s (tail decays to silence by 3.66s). Sub-phrase "whips the llama's ass" alone ≈ 2.00-3.60s (1.60s); "the llama's ass" ≈ 2.23-3.60s (1.37s, fits the 1.5s budget). Leading 0.28s and trailing 0.24s are pure silence.

## llama-demo-full.mp3
- url: https://raw.githubusercontent.com/notpeter/winamp-demo/master/demo.mp3
- page: https://github.com/notpeter/winamp-demo
- licence: unclear. Same repo, no LICENSE file. Winamp 2.x "Llama Whippin' Intro", JJ McKay aka DJ Mike Llama.
- notes: 5.340s total, joint-stereo 22.05kHz. The version with the funk music bed. Audio runs 0.00-4.37s continuously (only silence is 4.37-4.71s and the very tail). Alternative take on the same line if the dry one reads too flat.

## windows-xp-startup.wav
- url: https://archive.org/download/windowsxpstartup_201910/Windows%20XP%20Startup.wav
- page: https://archive.org/details/windowsxpstartup_201910
- licence: unclear. Item has no licenseurl and no rights field. Microsoft Windows XP system sound.
- notes: 4.814s total, PCM 16-bit. The jingle occupies 0.00-3.51s; 3.51-4.81s is silence/reverb tail below -35dB. The recognisable opening hit is roughly 0.00-1.20s.

## windows-xp-hardware-insert.wav
- url: https://archive.org/download/windowsxpstartup_201910/Windows%20XP%20Hardware%20Insert.wav
- page: https://archive.org/details/windowsxpstartup_201910
- licence: unclear. Item has no licenseurl and no rights field. Microsoft Windows XP system sound.
- notes: 0.830s total, PCM 16-bit. Two-note rising "device plugged in" chime. Content 0.00-0.57s; 0.57-0.83s silence. Already inside the 0.4-1.5s budget with no trimming. This is the XP device-insert sound, NOT a CD drive recording — labelled honestly.

## cd-drive-operating.mp3
- url: https://archive.org/download/cd-drive-operating-1/cd-drive-operating.mp3
- page: https://archive.org/details/cd-drive-operating-1
- licence: unclear. Item description is only "CD drive operation sound effect"; no licenseurl, no rights, no creator field.
- notes: 2.000s total, mono 48kHz 128kbps. Drive mechanism noise. Silence 0.00-0.29s and 1.61-2.00s; the actual spin/seek is 0.29-1.61s (1.32s) — fits the budget as-is once the lead-in silence is trimmed.

## windows-tada-chime.wav
- url: https://archive.org/download/windowsxpstartup_201910/tada.wav
- page: https://archive.org/details/windowsxpstartup_201910
- licence: unclear. Item has no licenseurl and no rights field. Microsoft Windows "tada" system sound.
- notes: 1.939s total, PCM 16-bit. Content 0.00-1.30s, then 0.64s of silence. The "ta-da!" hit is ~0.00-0.90s. Stand-in for a task/burn-complete chime — it is the Windows tada.wav, not an actual CD-burn sound.
