# Provenance des assets du theme `cinema-fr`

Releve tel que constate par les agents de sourcing, licence comprise.
La majorite de ces assets sont sous copyright ou sans licence declaree :
usage interne assume, a revoir avant toute distribution publique.

Ce fichier vit hors de `assets/themes/`, il n'est donc pas embarque dans le
bundle - `electrobun.config.ts` ne copie que `assets/themes`.

---

## Groupe `kaamelott`

# Kaamelott — raw assets

Group: `kaamelott` (French TV series by Alexandre Astier, 2005–2009).

All sounds come from the community soundboard repo `2ec0b4/kaamelott-soundboard`
(GitHub, served as direct `raw.githubusercontent.com` MP3s). The repo carries no
licence file for the audio; the clips are fan-ripped excerpts of a copyrighted
series. Licence is reported below as **unclear / fan upload / copyrighted** for
every one of them — that is what the source actually is, not an assumption.

Images are all Wikimedia Commons (real, cleanly-licensed files). Commons has no
in-character photography of the series, so the character images are free-licensed
photos of the **actors** (out of character), plus two/three free vector objects.
The Kaamelott Fandom wiki (which does hold in-character stills) is behind a
Cloudflare challenge and could not be downloaded — see the report.

Timestamps below were measured with
`ffmpeg -af silencedetect=n=-40dB:d=0.05` and `ffprobe`.

---

## SOUNDS

## cest-pas-faux-perceval.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/cest_pas_faux2.mp3
- licence: unclear / fan upload / copyrighted
- notes: Perceval — « Ouais, c'est pas faux ». Total 0.75s. Line runs 0.00–0.63s,
  trailing 0.12s of silence. No lead-in. Fits a keystroke as-is.

## cest-pas-faux-karadoc.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/cest_pas_faux1.mp3
- licence: unclear / fan upload / copyrighted
- notes: Karadoc — « C'est pas faux ». Total 0.96s. Line runs 0.00–0.91s,
  0.05s trailing silence. No lead-in.

## on-en-a-gros.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/on_en_a_gros.mp3
- licence: unclear / fan upload / copyrighted
- notes: Perceval — « ON EN A GROS ! ». Total 0.95s. Line runs 0.00–0.82s,
  0.12s trailing silence.

## le-gras-cest-la-vie.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/le_gras_cest_la_vie.mp3
- licence: unclear / fan upload / copyrighted
- notes: Karadoc — « Le gras, c'est la vie ». Total 1.06s, two phrases:
  « le gras » 0.00–0.44s, natural 0.18s beat, « c'est la vie » 0.63–1.06s.
  Keep the whole 1.06s — cutting the beat kills the line.

## jai-rien-compris.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/jai_rien_compris.mp3
- licence: unclear / fan upload / copyrighted
- notes: Perceval — « J'ai rien compris ! ». Total 0.48s, speech fills 0.00–0.48s,
  no silence at either end. Shortest clip in the set.

## non-sans-deconner-arthur.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/sans_deconner.mp3
- licence: unclear / fan upload / copyrighted
- notes: Arthur — « Non, sans déconner ? ». Total 0.71s, speech fills the whole
  file, no silence at either end.

## cest-qui-tous-ces-cons-leodagan.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/cest_qui_tout_ces_cons.mp3
- licence: unclear / fan upload / copyrighted
- notes: Léodagan — « C'est qui tous ces cons ? ». Total 1.00s, speech fills the
  whole file, no silence at either end.

## a-roulettes-perceval.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/a_roulettes.mp3
- licence: unclear / fan upload / copyrighted
- notes: Perceval — « À ROULETTES !!! ». Total 0.94s, speech fills the whole file,
  no silence at either end. Mono, 64 kbps (lowest-quality file of the set).

## cest-honteux-bohort.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/cest_honteux.mp3
- licence: unclear / fan upload / copyrighted
- notes: Bohort — « C'EST HONTEUX ! ». Total 0.71s, speech fills the whole file,
  no silence at either end.

## cest-de-la-merde-karadoc.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/cest-de-la-merde.mp3
- licence: unclear / fan upload / copyrighted
- notes: Karadoc — « C'est de la merde ». Total 0.74s, speech fills the whole
  file, no silence at either end.

## cest-beau-quand-meme-perceval.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/cest_beau_quand_meme.mp3
- licence: unclear / fan upload / copyrighted
- notes: Perceval — « C'est beau quand même ». Total 0.87s. Line runs 0.00–0.75s,
  then 0.11s of silence.

## je-ne-mange-pas-de-graines.mp3
- url: https://raw.githubusercontent.com/2ec0b4/kaamelott-soundboard/master/sounds/je_ne_mange_pas_de_graines.mp3
- licence: unclear / fan upload / copyrighted
- notes: Le Maître d'armes — « JE NE MANGE PAS DE GRAINES ! ». Total 3.03s, the
  ONLY clip longer than 1.5s. The punchline itself is the first block,
  0.00–1.28s; after it comes 0.23s silence, a second block 1.51–1.77s, 0.34s
  silence, a third block 2.11–2.85s, then 0.17s trailing silence. Trim to
  `-t 1.3` and the joke survives intact.

---

## IMAGES

## blason-kaamelott.png
- url: https://commons.wikimedia.org/wiki/File:Blason_Kaamelott.svg
  (fetched as PNG via `Special:FilePath/Blason_Kaamelott.svg?width=512`)
- licence: CC BY-SA 3.0 — Wikimedia Commons, author "Chatsam". Fan-drawn heraldic
  rendering of the Kaamelott coat of arms, not an official asset.
- notes: 960x1056 PNG, transparent background. Shield with the grail/chalice,
  the dragon head, the sword and the tower. Best spinning-confetti object in
  the set — high contrast, reads at 96px.

## kaamelott-logo.png
- url: https://commons.wikimedia.org/wiki/File:Kaamelott_unofficial_logo.svg
  (fetched as PNG via `Special:FilePath/...?width=512`)
- licence: CC0 — Wikimedia Commons, author "Helgismidh". Explicitly labelled an
  *unofficial* logo (the stylised Kaamelott "K").
- notes: 960x1280 PNG, transparent background. Orange "K" with a black outline.
  Clean silhouette object; instantly readable at 96px.

## graal.png
- url: https://commons.wikimedia.org/wiki/File:Jeweled-chalice_-_Lorc_-_game-icons.svg
- licence: CC BY 3.0 — author Lorc (game-icons.net), via Wikimedia Commons.
  Generic grail icon, not from the series.
- notes: 960x960 PNG, transparent background. Solid-black jewelled chalice
  silhouette — stands in for "le Graal" as an object. Pure black, so it will
  read as a dark shape on a light overlay.

## graal-aile.png
- url: https://commons.wikimedia.org/wiki/File:Holy-grail_-_Lorc_-_game-icons.svg
- licence: CC BY 3.0 — author Lorc (game-icons.net), via Wikimedia Commons.
  Generic grail icon, not from the series.
- notes: 960x960 PNG, transparent background. Winged grail silhouette.
  Alternative to `graal.png` — keep whichever spins better, they are redundant.

## perceval-franck-pitiot.jpg
- url: https://commons.wikimedia.org/wiki/File:Franck_Pitiot.jpg
- licence: CC BY-SA 3.0 — Wikimedia Commons, author "Boungawa". Personality-rights
  note on the Commons page.
- notes: 517x520 JPEG. Franck Pitiot = **Perceval**. Out of character (a
  convention photo). Cropped by me from the 742x717 original to a tight head
  shot — the face fills the frame.

## arthur-alexandre-astier.jpg
- url: https://commons.wikimedia.org/wiki/File:AAstierRegular.jpg
- licence: CC BY-SA 4.0 — Wikimedia Commons, author "AAstierOff" (Astier's own
  official account upload).
- notes: 520x520 JPEG, black & white. Alexandre Astier = **le Roi Arthur**. Out
  of character. Cropped by me from the 4842x4842 original (fetched at 960px) to
  a tight head shot.

## leodagan-lionnel-astier.jpg
- url: https://commons.wikimedia.org/wiki/File:Lionnel_astier.jpg
- licence: CC BY-SA 2.5 — Wikimedia Commons, author "Mangatome".
- notes: 420x420 JPEG. Lionnel Astier = **Léodagan**. Out of character (a book
  signing). Cropped by me from the 713x733 original to a tight head shot.
  Smallest kept image; still above the 256px floor.

## bohort-nicolas-gabion.jpg
- url: https://commons.wikimedia.org/wiki/File:Nicolas_Gabion_2014_Lyon.JPG
- licence: CC BY-SA 3.0 — Wikimedia Commons, credit required as
  "Xavier Caré / Wikimedia Commons".
- notes: 560x560 JPEG. Nicolas Gabion = **Bohort**. Out of character. Cropped by
  me from the 1155x1461 original (fetched at 960px). Three-quarter profile.

## guethenoc-brice-fournier.jpg
- url: https://commons.wikimedia.org/wiki/File:Kaamelott_20071019_Fnac_7_(cropped).jpg
- licence: CC BY-SA 3.0 (also GFDL / CC BY-SA 2.5 / 2.0 / 1.0) — Wikimedia
  Commons, author Georges Seguin (Okki). Personality-rights note on the page.
- notes: 780x780 JPEG. Brice Fournier = **Guethenoc** the peasant. Taken at the
  Kaamelott cast signing at Fnac Saint-Lazare, Paris, 19 Oct 2007 — so it is at
  least a genuine Kaamelott-event photo. Cropped by me from the 1296x1843
  original (fetched at 960px). Face fills the frame; he is looking down.

---

## Groupe `kaamelott-images2`

# Kaamelott — images (2nd pass)

Two families of assets:

1. **In-costume character crops** — tight head crops I cut myself out of the official
   *character posters* for the Kaamelott feature films, as hosted on TMDB.
   TMDB is only the host; it grants no licence. These are studio promotional posters
   and are **copyrighted** (© Kaamelott Premier Volet / SND / M6 Films / Alexandre Astier).
   The TMDB image pages show no licence statement at all — the images are community
   uploads of press material. Treat as **copyrighted promotional material, used here
   without a licence**.

2. **Objects** — Wikimedia Commons, licences copied verbatim from each file page.

---

## In-costume character crops (TMDB / film character posters)

Listing pages the paths were enumerated from:
- https://www.themoviedb.org/movie/577242-kaamelott-premier-volet/images/posters
- https://www.themoviedb.org/movie/1076897-kaamelott-deuxieme-volet-partie-1/images/posters

| file | source image | licence |
|---|---|---|
| `perceval-costume.jpg` | https://image.tmdb.org/t/p/original/bO0jxaJRMMlvZJX3DrZv4KDyg69.jpg | copyrighted promo poster, no licence stated on TMDB |
| `karadoc-costume.jpg` | https://image.tmdb.org/t/p/original/hyWI2QmilvpBa5yKDTFDucXFVXV.jpg | idem |
| `arthur-costume.jpg` | https://image.tmdb.org/t/p/original/tuvnkGxwoBX3xjk1TCad7v7MlT.jpg | idem |
| `leodagan-costume.jpg` | https://image.tmdb.org/t/p/original/tV4vop6zrMNL6XkGItW2G7yFgGu.jpg | idem |
| `bohort-costume.jpg` | https://image.tmdb.org/t/p/original/cL6X04cTnTPNAxGe7fWfZP5oOL4.jpg | idem |
| `merlin-costume.jpg` | https://image.tmdb.org/t/p/original/fjseSV9dW5rbczvSOkwY8LsaZNw.jpg | idem |
| `seli-costume.jpg` | https://image.tmdb.org/t/p/original/ipLtwGqrHzN4fJZn9EL1Noz0AyA.jpg | idem |
| `lancelot-costume.jpg` | https://image.tmdb.org/t/p/original/8KeTbsdKA0aLS5WyllLCzagskCh.jpg | idem |
| `loth-costume.jpg` | https://image.tmdb.org/t/p/original/s0bZEXuPBZXzlVzo8zcawXYtRM0.jpg | idem |
| `dame-du-lac-costume.jpg` | https://image.tmdb.org/t/p/original/2ahdvfUAJOEiPMR4n6XgMWNTIQ1.jpg | idem (*Deuxième Volet* poster) |

Notes:
- Every one of these is the *Premier Volet* (2021) single-character poster series, except
  `dame-du-lac-costume.jpg` which is from the *Deuxième Volet Partie 1* (2025) series.
  Each original poster carries the character name and a quote; I cropped a square
  head/bust region so no title text or actor credit survives in the crop.
- `lancelot-costume.jpg` doubles as a chainmail-coif asset — Lancelot's face is framed
  by his mail coif.
- Originals are 906×1290 (Dame du Lac 1000×1500); crops are 430–640 px square.

## Objects (Wikimedia Commons)

| file | source page | licence (as stated on the page) | notes |
|---|---|---|---|
| `excalibur-pierre.png` | https://commons.wikimedia.org/wiki/File:Sword-in-stone_-_Lorc_-_game-icons.svg | **CC BY 3.0**, author "Lorc" (game-icons.net) | sword in the stone, black glyph on transparent, rendered 960×960 from the SVG |
| `chope-karadoc.png` | https://commons.wikimedia.org/wiki/File:Beer-stein_-_Lorc_-_game-icons.svg | **CC BY 3.0**, author "Lorc" | foaming tankard, transparent |
| `corne-a-boire.png` | https://commons.wikimedia.org/wiki/File:Beer-horn_-_Delapouite_-_game-icons.svg | **CC BY 3.0**, author "Delapouite" | drinking horn, transparent |
| `couronne.png` | https://commons.wikimedia.org/wiki/File:Crown_-_Lorc_-_game-icons.svg | **CC BY 3.0**, author "Lorc" | crown, transparent |
| `table-ronde-icone.png` | https://commons.wikimedia.org/wiki/File:Round-table_-_Delapouite_-_game-icons.svg | **CC BY 3.0**, author "Delapouite" | round table with three seated figures, transparent |
| `table-ronde-winchester.png` | https://commons.wikimedia.org/wiki/File:King_Arthur%27s_Round_Table_at_Winchester_Castle,_Winchester,_Hampshire,_England.png | **CC BY-SA 4.0**, author "Rs-nourse" | photo of the real Winchester Round Table, already square and disc-shaped — the best-reading object at 96 px |

All five game-icons files also exist on Commons in a **white** variant
(`… - white - game-icons.svg`) if black silhouettes turn out to be invisible
against dark desktops.

## Rejected after rendering at 96 px

- `Winchester Round Table (Detail).jpg` — wide crop, becomes mush.
- `Coif MET DP2839.jpg` — it is an *embroidered linen* coif, not a chainmail coif;
  also has a colour-calibration bar in frame. Wrong object, dropped.
- All 21 TMDB cast **profile** photos — actor headshots out of costume, exactly the
  failure mode of the first pass. Only Joëlle Sevilla's profile was in costume, and the
  *Premier Volet* poster of her is better, so the profile was not kept.
- 101 TMDB season-1 episode stills — all 400×225, mostly dark two-shots in candlelit
  interiors. Unusable at 96 px.

---

## Groupe `oss117`

# oss117 — raw assets

9 images, 8 sounds. All files verified with `file`, `magick identify` and `ffprobe`.

Caveat on the sounds: I could not listen to them. The "which line" attribution below comes
from the uploader's own title/description plus the waveform structure I measured. Timestamp
ranges are measured (20 ms RMS envelope, segments = contiguous audio within 20 dB of peak).

---

## rire-dujardin.mp3
- url: https://tuna.voicemod.net/sound/7ccb0112-ef5f-406b-bb0f-ff0514574ed6
  (file: https://us-tuna-sounds-files.voicemod.net/7ccb0112-ef5f-406b-bb0f-ff0514574ed6-1654610533340.mp3)
- licence: unclear / fan upload / copyrighted (Voicemod Tuna user upload "OSS117 - T'es Mauvais Ahah" by eanderful)
- notes: 3.22s total. THE LAUGH. Structure: line "T'es mauvais Jack !" 0.04–1.24s;
  short dip 1.24–1.50s; braying laugh 1.50–3.16s (runs to end of file, no trailing silence).
  Individual bray onsets: 1.52, 1.68, 1.84, 2.08, 2.28, 2.44, 2.64, 2.80, 3.04.
  CUT SUGGESTIONS: two brays only = 1.50–1.92 (0.42s); punchy 5-bray laugh = 1.50–2.60 (1.10s);
  max within budget = 1.50–2.95 (1.45s). Do not start before 1.45 or you catch the tail of the line.

## tes-mauvais-jack.mp3
- url: https://tuna.voicemod.net/sound/e7f1f69b-62cd-4128-aa87-d6cc0edd76da
  (file: https://us-tuna-sounds-files.voicemod.net/e7f1f69b-62cd-4128-aa87-d6cc0edd76da-1776031695040.mp3)
- licence: unclear / fan upload / copyrighted
- notes: 6.38s total, the whole "T'es mauvais Jack" exchange. Long clip.
  Lead-in dialogue 0.02–3.40s; near-silence (room tone, ~-40 dB) 3.40–4.20s;
  the isolated line "T'es mauvais Jack !" 4.20–5.32s; then the laugh starts 5.60–6.32s and the
  file cuts off mid-laugh. BEST CUT: 4.20–5.32 (1.12s) for the clean line with silence either side.

## cest-pas-moi.mp3
- url: https://tuna.voicemod.net/sound/f185b90e-5306-4a46-9228-3835b104cc34
  (file: https://us-tuna-sounds-files.voicemod.net/f185b90e-5306-4a46-9228-3835b104cc34-1655408917808.mp3)
- licence: unclear / fan upload / copyrighted
- notes: 0.82s total. Line « C'est pas moi » runs 0.18–0.62s. Already inside budget as-is;
  trim to 0.15–0.70 (0.55s) to drop the lead-in and trailing silence.

## jai-vu-je-sais-qui-cest.mp3
- url: https://tuna.voicemod.net/sound/37df76ea-c337-475a-a5ec-1553dc7ea3f8
  (file: https://us-tuna-sounds-files.voicemod.net/37df76ea-c337-475a-a5ec-1553dc7ea3f8-1694376490648.mp3)
- licence: unclear / fan upload / copyrighted (uploader states: OSS 117 Rio ne répond plus)
- notes: 2.74s total. Line « J'ai vu, je sais qui c'est, mais je dirai rien. »
  Speech 0.20–0.58s then 0.74–2.46s; 0.26s trailing silence.
  Too long whole — take the tail 1.35–2.46 (1.11s) or the opening 0.20–1.45 (1.25s).

## cest-un-bordel.mp3
- url: https://tuna.voicemod.net/sound/680afdca-f05e-4607-b6fc-00fc007cb659
  (file: https://us-tuna-sounds-files.voicemod.net/680afdca-f05e-4607-b6fc-00fc007cb659-1715591314807.mp3)
- licence: unclear / fan upload / copyrighted
- notes: 2.04s total. Uploader title « C'est un bordel ! ».
  Two quiet blips 0.16–0.34 and 0.52–0.60, then the loud line 0.96–1.50s, then 0.5s silence.
  CUT: 0.94–1.54 (0.60s) — clean, punchy, whole line.

## vous-faites-du-sport.mp3
- url: https://tuna.voicemod.net/sound/8340887f-a72c-42cf-af72-4f2419d321a1
  (file: https://us-tuna-sounds-files.voicemod.net/8340887f-a72c-42cf-af72-4f2419d321a1-1666799441853.mp3)
- licence: unclear / fan upload / copyrighted
- notes: 2.40s total. Uploader title « VOUS FAITES DU SPORT ».
  Segments 0.10–0.68, 1.00–1.08, 1.40–2.02. Two separate utterances.
  CUT: 1.38–2.05 (0.67s) for the second half, or 0.08–0.70 (0.62s) for the first.

## comment-est-votre-blanquette.mp3
- url: https://tuna.voicemod.net/sound/a067f170-6414-4057-8c24-a76dc5057406
  (file: https://us-tuna-sounds-files.voicemod.net/a067f170-6414-4057-8c24-a76dc5057406-1666514854859.mp3)
- licence: unclear / fan upload / copyrighted
- notes: 4.32s total. Uploader title "OSS117 Extrait culte Comment est votre blanquette".
  It is a multi-line exchange, not a single line: segments 0.38–1.26, 1.50–2.18, 2.44–2.62,
  3.30–4.30 (the last runs to the end of the file). I could not listen, so I cannot tell you
  which segment carries « Comment est votre blanquette ? ». The 3.30–4.30 segment (1.0s) is the
  longest and last — most likely the punchline, but AUDITION BEFORE USING.

## bambino.mp3
- url: https://tuna.voicemod.net/sound/5c1c5a14-08a3-4454-8296-2d876a4a6db4
  (file: https://us-tuna-sounds-files.voicemod.net/5c1c5a14-08a3-4454-8296-2d876a4a6db4-1685807132342.mp3)
- licence: unclear / fan upload / copyrighted
- notes: 15.77s total. "Bambino" — the Dalida song Dujardin sings/mimes in Le Caire, nid d'espions.
  Continuous music from 0.02s to the end, no silences anywhere, so there is no natural cut point.
  This is NOT the OSS 117 orchestral theme by Ludovic Bource — I did not find that.
  Any 1s window works as a sting; pick by ear.

---

## oss117-fez-dujardin.jpg
- url: https://image.tmdb.org/t/p/original/hvbxK1qfLwO4qbj4tYv9RrGSJLT.jpg
  (page: https://www.themoviedb.org/movie/15152/images/backdrops)
- licence: unclear / copyrighted (film still, Gaumont — TMDB hosts promotional stills)
- notes: 460x460 crop by me from the 1920x1080 still. Dujardin in character, in profile,
  wearing the red fez, black tie. Head + fez fill the frame. Best in-character image of the set.

## oss117-sourire-narquois.jpg
- url: https://image.tmdb.org/t/p/original/65ZWXfAkHYmNC3uJRbJi5gdDGz2.jpg
  (page: https://www.themoviedb.org/movie/15588/images/backdrops)
- licence: unclear / copyrighted (film still, Rio ne répond plus)
- notes: 450x450 crop by me from the 1920x1080 still. The smug self-satisfied grin, three-quarter
  profile, face fills the frame. This is the "hero" expression.

## larmina-bejo.jpg
- url: https://image.tmdb.org/t/p/original/hvbxK1qfLwO4qbj4tYv9RrGSJLT.jpg
  (same still as oss117-fez-dujardin.jpg)
- licence: unclear / copyrighted (film still)
- notes: 340x340 crop by me. Bérénice Bejo as Larmina, green dress, face fills frame.

## affiche-le-caire.jpg
- url: https://image.tmdb.org/t/p/original/rJ5YrOLaq4mBDjSl4hzZJF7JfXi.jpg
  (page: https://www.themoviedb.org/movie/15152/images/posters)
- licence: unclear / copyrighted (theatrical poster, Gaumont)
- notes: 1400x2100. Clean French poster of Le Caire, nid d'espions — orange ground, OSS 117 logo,
  Dujardin in blue suit, no credit block. Tall aspect: the figure will be small at 96px.

## affiche-rio.jpg
- url: https://image.tmdb.org/t/p/original/m9hK0zZwabbZ7kxyfinIcHd1tQz.jpg
  (page: https://www.themoviedb.org/movie/15588/images/posters)
- licence: unclear / copyrighted (theatrical poster, Gaumont)
- notes: 1000x1500. French poster of Rio ne répond plus, white ground. Same tall-aspect caveat.

## logo-oss117.png
- url: https://commons.wikimedia.org/wiki/File:OSS_117.jpg
  (file: https://upload.wikimedia.org/wikipedia/commons/... via Special:FilePath)
- licence: CC BY-SA 4.0 (as stated on the Commons file page)
- notes: 907x303, transparent background (I cropped off the "as Hubert Bonisseur de La Bath"
  subtitle and keyed out the white). Orange "OSS" + black "117" wordmark. Good spinning object,
  but it is a wide lockup — will letterbox into a 128x128 square.

## fez.png
- url: https://commons.wikimedia.org/wiki/File:A_fez_and_a_%C3%A7ar%C4%B1k.svg
  (rendered PNG: https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/A_fez_and_a_%C3%A7ar%C4%B1k.svg/960px-A_fez_and_a_%C3%A7ar%C4%B1k.svg.png)
- licence: free / Wikimedia Commons (SVG clipart; see file page for exact CC terms)
- notes: 539x504, true transparent PNG. Red fez with black tassel, cropped away from the çarık
  shoe that shared the original SVG. Ideal spinning confetti.

## poule.png
- url: https://commons.wikimedia.org/wiki/File:Chicken_clipart_01.svg
  (rendered PNG: https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Chicken_clipart_01.svg/960px-Chicken_clipart_01.svg.png)
- licence: free / Wikimedia Commons (SVG clipart; see file page for exact CC terms)
- notes: 916x654, true transparent PNG. White hen, clean vector outline. For the poules gag.
  Ideal spinning confetti.

## dujardin-cannes-2011.jpg
- url: https://commons.wikimedia.org/wiki/File:Jean_Dujardin_Cannes_2011_(cropped).jpg
- licence: CC BY-SA 3.0 (as stated on the Commons file page)
- notes: 510x616. Real, cleanly-licensed photo — Dujardin in a dinner jacket and white bow tie
  on the Cannes red carpet, half-smirk. Not in character, but the wardrobe and expression read
  as OSS 117 and the face fills the frame. This is the only image here with a clean licence
  that also shows his face.

---

## Groupe `cite-de-la-peur`

# La Cité de la peur (1994, Les Nuls) — asset sources

Every file below was verified with `file`, plus `magick identify` (images) or
`ffprobe` (sounds). Nothing unverified is kept.

Timestamp windows for the sounds were measured with an RMS envelope
(8 kHz mono, 20 ms windows, bursts at > peak-16 dB) plus
`ffmpeg -af silencedetect`. **I could not listen to the audio**, so the windows
below are *speech bursts*, and the mapping of a burst to specific words is
inferred from the source page's own label, not verified by ear.

---

## IMAGES

## affiche-cite-de-la-peur.jpg
- url: https://image.tmdb.org/t/p/w500/1hy4BA7QTmJ1fKXst0dcu2kK8dj.jpg
  (from https://www.themoviedb.org/movie/15097-la-cite-de-la-peur/images/posters)
- licence: copyrighted / unclear — TMDB hosts distributor promotional material;
  rights belong to Telema / Studio Canal+. No free licence claimed on the page.
- notes: 500x707 JPEG. The classic "LE FILM DE LES NULS" poster.

## serge-karamazov.jpg
- url: https://image.tmdb.org/t/p/original/fyRFfXf3gJV81TR0E7ucpUwFPXl.jpg
  (cropped 580x560 from the 1920x1080 still)
- licence: copyrighted / unclear — promotional still hosted by TMDB.
- notes: 580x560 JPEG. Tight face crop, Alain Chabat as Serge Karamazov,
  glasses on, aiming his gun. Reads clearly at 96 px.

## odile-deray.jpg
- url: https://image.tmdb.org/t/p/original/4NmmmrR2mKHaLtjRQAj2SmyJ1kJ.jpg
  (cropped 560x600 from the 1920x1080 still)
- licence: copyrighted / unclear — promotional still hosted by TMDB.
- notes: 560x600 JPEG. Tight face crop, Chantal Lauby as Odile Deray with her
  straw hat.

## simon-jeremi.jpg
- url: https://image.tmdb.org/t/p/original/dplwDjAPnwxePDTEPJHuHY8Ff70.jpg
  (cropped 420x440 from the 1280x720 still)
- licence: copyrighted / unclear — promotional still hosted by TMDB.
- notes: 420x440 JPEG. Tight face crop, Dominique Farrugia as Simon Jérémi
  (glasses, white vest).

## serge-karamazov-affiche.jpg
- url: https://image.tmdb.org/t/p/original/jMT2nS6ou3xwzp1XX40v8rJKl7U.jpg
  (cropped 1200x1200 from the 3840x2160 poster artwork, resized to 600x600)
- licence: copyrighted / unclear — poster artwork hosted by TMDB.
- notes: 600x600 JPEG. The *painted* poster head of Karamazov. High contrast,
  the strongest of the set at sprite size.

## odile-deray-affiche.jpg
- url: https://image.tmdb.org/t/p/original/jMT2nS6ou3xwzp1XX40v8rJKl7U.jpg
  (cropped 1280x1280, resized to 600x600)
- licence: copyrighted / unclear — poster artwork hosted by TMDB.
- notes: 600x600 JPEG. Painted poster head of Odile Deray.

## simon-jeremi-affiche.jpg
- url: https://image.tmdb.org/t/p/original/jMT2nS6ou3xwzp1XX40v8rJKl7U.jpg
  (cropped 1040x1200, resized to 520x600)
- licence: copyrighted / unclear — poster artwork hosted by TMDB.
- notes: 520x600 JPEG. Painted poster head of Simon Jérémi, mouth wide open.

## bobine-de-film.png
- url: https://commons.wikimedia.org/wiki/File:Super-8-mm-film-on-a-spool-02.jpg
  (via https://thumb.wikimedia.org/.../960px-Super-8-mm-film-on-a-spool-02.jpg)
- licence: CC BY-SA 3.0 — CEphoto, Uwe Aranas. Attribution required.
- notes: 601x720 transparent PNG. I flood-filled the white studio background to
  alpha and cropped the drop shadow off. Spinning-confetti object.

## clap-de-cinema.png
- url: https://commons.wikimedia.org/wiki/File:Clapperboard_Pinhead_icon.svg
  (via https://thumb.wikimedia.org/.../960px-Clapperboard_Pinhead_icon.svg.png)
- licence: CC0 — OpenHistoricalMap contributors. Public-domain dedication.
- notes: 882x896 transparent PNG (greyscale + alpha), clean black clapperboard
  cut-out. Best object of the set.

## lunettes-de-soleil.png
- url: https://commons.wikimedia.org/wiki/File:Sunglasses-1_retouch.png
  (via https://thumb.wikimedia.org/.../960px-Sunglasses-1_retouch.png)
- licence: CC BY-SA 3.0 — LotusHead (Johannesburg). Attribution required.
- notes: 939x518 transparent PNG, already a cut-out on upload. Karamazov's
  trademark object.

---

## SOUNDS

## odile-deray-attachee-de-presse.mp3
- url: https://zonesons.com/citations/cpeur/Odile-Deray-lattachee-de-presse-et.mp3
  (page: https://zonesons.com/comedies-policieres/la-cite-de-la-peur-1994/61810)
- licence: copyrighted. The site states plainly: « Les œuvres, interprétations
  et enregistrements restent protégés par le droit d'auteur et les droits
  voisins. Les droits correspondants appartiennent à leurs titulaires
  respectifs. » No free licence.
- notes: 7.99 s, 128 kbps / 44.1 kHz stereo — by far the best-quality file here.
  Line: « Odile Deray, l'attachée de presse, et… ». Continuous speech from
  0.02 s to 7.02 s with no real gaps; the *name* « Odile Deray » is at the head,
  approx. **0.00–1.30 s** (energy dip at 1.26–1.38 s is the likeliest word
  boundary). Trailing burst 7.24–7.98 s. Cut at ~1.3 s and you get the name.

## scene-tcheky-karyo.mp3
- url: https://us-tuna-sounds-files.voicemod.net/f420e43a-1a7b-4fb2-a367-4dc4303b76e1-1670778446641.mp3
  (page: https://tuna.voicemod.net/sound/f420e43a-1a7b-4fb2-a367-4dc4303b76e1)
- licence: unclear / fan upload — Voicemod Tuna community upload by
  "BoubouTatsu", titled « Scène Cité de la peur Tchéky Karyo ». No licence.
- notes: **0.89 s total**, 128 kbps / 48 kHz. Speech runs **0.24–0.84 s**,
  0.24 s of lead-in silence. Already keystroke-length, no trimming needed.
  Uploader keywords are "6, 5, 4", so this is almost certainly the commissaire
  Bialès countdown line (« il dit 5, 4, 3… »), but I could not confirm the words
  by ear — treat the filename as the safe description.

## un-quoi-a-serial-killer.mp3
- url: https://us-tuna-sounds-files.voicemod.net/06c88048-b624-4284-8c4d-7ada56afb4e8-1717352394698.mp3
  (page: https://tuna.voicemod.net/sound/06c88048-b624-4284-8c4d-7ada56afb4e8)
- licence: unclear / fan upload — Voicemod Tuna community upload by
  "Jackjackdu31", titled « la cité de la peur un quoi a serial killer !! ».
- notes: 15.02 s, 128 kbps / 48 kHz. **Long lead-in of dialogue — this is the
  whole scene, not one line.** The exchange is « C'est forcément un… — Pardon ?
  — Serial killer. — Quoi ? — Serial killer ! ». Speech bursts:
  0.02–1.50, 2.16–2.64 (loudest, 0 dB), 3.72–3.90, 5.36–6.04, 6.26–6.38,
  7.20–7.68, 8.16–8.44, 9.68–10.12, **10.56–11.24 (-0.3 dB)**, 11.84–12.00,
  13.34–14.06, 14.54–14.70.
  Best single-keystroke candidates: **2.16–2.64 s** (0.48 s, loudest burst) or
  **10.56–11.24 s** (0.68 s). One of the two short shouted bursts is the
  punchline « serial killer ! ».

## prenez-un-chewing-gum-emile.mp3
- url: http://toma.d.free.fr/Cite/chewinggum.mp3
  (page: http://toma.d.free.fr/CitedelaPeur.htm, labelled « Prenez un
  chewing-gum Emile »)
- licence: unclear / fan upload / copyrighted — personal free.fr fan page, no
  licence statement, film extracts.
- notes: 3.90 s, 32 kbps / 11.025 kHz (low fidelity — audibly muffled).
  Speech bursts **0.48–1.06** and **1.42–3.86**. The line is the whole clip;
  a 0.4–1.5 s cut cannot contain « Prenez un chewing-gum Émile » in full —
  **the joke needs ~2.4 s**. Best sub-1.5 s option: 1.42–2.90 s.

## combien.mp3
- url: http://toma.d.free.fr/Cite/combien.mp3
  (page labelled « Combien !!! »)
- licence: unclear / fan upload / copyrighted — personal free.fr fan page.
- notes: 4.63 s, 32 kbps / 11.025 kHz. Three bursts:
  **1.10–1.56 s** (0.46 s, loudest), 1.76–2.30 s, **3.72–4.34 s** (0.62 s).
  Each burst is one « Combien ? ». Any of them is a clean 0.5 s keystroke —
  1.10–1.56 s is the pick.

## vous-connaissez-cannes.mp3
- url: http://toma.d.free.fr/Cite/cannes.mp3
  (page labelled « Vous connaissez Cannes ? »)
- licence: unclear / fan upload / copyrighted — personal free.fr fan page.
- notes: 5.30 s, 32 kbps / 11.025 kHz. Bursts 0.26–0.68, **1.26–2.64 s**
  (the question), **3.48–4.92 s** (loudest, the reply). The question at
  1.26–2.64 s is 1.38 s — just inside the 1.5 s budget.

## bien-joue-kara.mp3
- url: http://toma.d.free.fr/Cite/bienjoue.mp3
  (page labelled « Bien joué Kara ! »)
- licence: unclear / fan upload / copyrighted — personal free.fr fan page.
- notes: 5.15 s, 32 kbps / 11.025 kHz. Bursts **0.58–1.36 s** (0.78 s, loudest
  — this is « Bien joué Kara ! »), 1.54–3.06 s, 4.36–4.56 s.
  Cut 0.58–1.40 s. Clean fit.

## mais-heu.mp3
- url: http://toma.d.free.fr/Cite/maisheu.mp3
  (page labelled « Mais, heu ! »)
- licence: unclear / fan upload / copyrighted — personal free.fr fan page.
- notes: 3.12 s, 32 kbps / 11.025 kHz. One continuous burst **0.12–3.12 s**,
  no internal gaps; loudest 1.0 s window is **0.40–1.40 s**. Cut 0.40–1.40 s.

## jsuis-hyper-content.mp3
- url: http://toma.d.free.fr/Cite/content.mp3
  (page labelled « J'suis hyper content ! »)
- licence: unclear / fan upload / copyrighted — personal free.fr fan page.
- notes: 13.83 s, 32 kbps / 11.025 kHz. **Long — this is the whole exchange.**
  Bursts: 0.14–2.48, 2.64–2.82, 3.08–3.30, 3.98–7.22, 7.44–8.18, 8.34–8.54,
  8.88–13.32. Loudest 1.0 s window: **5.88–6.88 s**. Short usable fragments:
  **3.08–3.30 s**, **7.44–8.18 s**, **8.34–8.54 s**. Which one carries
  « j'suis hyper content » I could not confirm without listening.

## on-peut-tromper-mille-fois.mp3
- url: http://toma.d.free.fr/Cite/onpeuttromper.mp3
  (page labelled « On peut tromper un homme mille fois... »)
- licence: unclear / fan upload / copyrighted — personal free.fr fan page.
- notes: 18.67 s, 32 kbps / 11.025 kHz. **The full tirade.** The joke is the
  whole escalating exchange, so **it cannot be cut to 1.5 s without losing it**
  — keep it only if you want one shouted fragment as a stinger. Bursts:
  0.20–2.50, 3.26–4.02, 4.18–6.56, 6.78–7.76, 8.04–8.20, **8.74–9.28**,
  9.48–11.16 (loudest), 11.32–11.96, 12.44–18.66.
  Best sub-1.5 s stinger: **8.74–9.28 s** (0.54 s) or **11.32–11.96 s**.

## la-carioca.mp3
- url: http://toma.d.free.fr/Cite/Carioca.mp3
  (page labelled « LA CARIOCA par Chabat et Darmon en mp3 qualité CD »)
- licence: unclear / fan upload / copyrighted — personal free.fr fan page.
  The song is © its rightsholders (Philippe Chany / Studio Canal).
- notes: **3 min 27 s (207.30 s)**, 128 kbps / 44.1 kHz — the *full song*, not a
  sting. Music starts at **0.30 s** (0.3 s of head silence). Opening bars run
  0.30–3.94 s. **For a 1-second sting, cut 0.30–1.50 s** (the intro fanfare) —
  that is the instantly recognisable part.

---

## What I could NOT find

- « Et là, c'est le drame » — not found as a downloadable file anywhere I could
  reach. Myinstants has it (`/instant/fr-et-la-cest-le-drame-fr-48412`) but the
  whole site, media included, is behind Cloudflare and returns 403 to every
  request I made, including WebFetch. It is also absent from zonesons' full
  790-clip index for this film (I crawled all 80 listing pages and grepped).
- « Il est où le président ? » / « Ça sent la fumée » — likewise absent from the
  zonesons index. The closest hit was
  `citations/cpeur/La-fumee-pas-dans-la-figure.mp3`, which I could not download
  (see below).
- « Je suis Serge Karamazov » / « Bienvenue à Cannes » — both exist on
  zonesons (`A-lareoport-Votre-nom-Serge-Karamazov.mp3`,
  `Cannes-Appelezmoi-Serge-Regardez-la-route.mp3`, `Red-is-dead.mp3`,
  `Dansons-la-carioca!.mp3`, `Cest-affreux!.mp3`), but after my first successful
  download the site IP-blocked me: « Votre adresse IP a été temporairement
  bloqué au téléchargement ». Only the Odile Deray clip got through.
- Wikimedia Commons has no usable free photo of Dominique Farrugia
  (the only one is 166x190, below the 256 px floor), and no Palme d'Or /
  Cannes palm image I could find.

---

## Groupe `visiteurs`

# Les Visiteurs (1993) — sourced assets

8 images, 7 sounds. Every file was verified with `file`, `magick identify` (images)
and `ffprobe` (sounds) after download.

Caveat stated up front: I could not **listen** to any of the sound files. The line
attributed to each clip is the title given by the source soundboard, cross-checked
against the clip duration and its waveform. Content of the audio itself is
unverified by ear.

---

## SOUNDS

All seven come from the same source: the browser soundbox at
`https://soundbox24.com/fr/film/les-visiteurs.html` (French fan/commercial
soundboard, also shipped as an Android app `com.soundbox24.lesvisiteurs`).
Files are served directly from `https://soundbox24.com/app/themes/SB24Visiteurs/<name>.mp3`.
The site publishes no licence page, no terms, no attribution: these are extracts
ripped from the film.
**licence for all of them: unclear / fan soundboard site / copyrighted film audio.**

## okay.mp3
- url: https://soundbox24.com/app/themes/SB24Visiteurs/okay.mp3
- page: https://soundbox24.com/fr/film/les-visiteurs.html (button "Okay")
- licence: unclear / fan soundboard site / copyrighted film audio
- line: « OKAAAAY ! » (Jacquouille)
- notes: total 1.17s. Two bursts: 0.00–0.18s, then the long shout 0.74–1.17s
  (0.18–0.74s is silence at -30dB). The whole file is the gag; usable as-is, no
  trimming needed. If you want the shout alone, take 0.70–1.17s (0.47s).

## c-est-okay.mp3
- url: https://soundbox24.com/app/themes/SB24Visiteurs/c_est_okay.mp3
- licence: unclear / fan soundboard site / copyrighted film audio
- line: « C'est okay ! » (Jacquouille)
- notes: total 1.09s. "C'est" 0.00–0.31s, silence to 0.63s, "okay" 0.63–1.09s.
  Whole file already fits the 0.4–1.5s window.

## que-trepasse-si-je-faiblis.mp3
- url: https://soundbox24.com/app/themes/SB24Visiteurs/trepas_si_je_faiblis.mp3
- licence: unclear / fan soundboard site / copyrighted film audio
- line: « Que trépasse si je faiblis ! » (Godefroy)
- notes: total 1.92s, continuous speech from 0.00 to 1.92 — no silence anywhere at
  -30dB. Slightly over your 1.5s ceiling and it cannot be cut shorter without
  losing the line; the phrase is the joke. Either allow 1.9s for this one or drop it.

## binz.mp3
- url: https://soundbox24.com/app/themes/SB24Visiteurs/binz.mp3
- licence: unclear / fan soundboard site / copyrighted film audio
- line: « Mais qu'est-ce que c'est que ce binz ? » (Jacquouille)
- notes: total 1.95s, continuous speech start to end, no lead-in, no trailing
  silence. Over 1.5s; trimming the head would cut "Mais qu'est-ce que c'est" and
  leave a bare "…ce binz ?" which still reads, ~0.6s off the tail end.
  (A second take, `binz_1.mp3` 2.48s, also exists at the same source.)

## c-est-diablerie.mp3
- url: https://soundbox24.com/app/themes/SB24Visiteurs/c_est_diablerie.mp3
- licence: unclear / fan soundboard site / copyrighted film audio
- line: « C'est diablerie ! » (Jacquouille)
- notes: total 1.40s, continuous speech throughout, no silence. Fits as-is.

## c-est-dingue.mp3
- url: https://soundbox24.com/app/themes/SB24Visiteurs/dingue.mp3
- licence: unclear / fan soundboard site / copyrighted film audio
- line: « C'est dingue ! » (Jacquouille)
- notes: total 1.03s, speech starts at 0.00 and tapers to the end. Fits as-is.

## mortecouille.mp3
- url: https://soundbox24.com/app/themes/SB24Visiteurs/mortecouille_1.mp3
- licence: unclear / fan soundboard site / copyrighted film audio
- line: « Mortecouille ! » (Jacquouille's oath)
- notes: total 2.49s. One short silence 0.82–0.95s, so there are two segments:
  0.00–0.82s and 0.95–2.49s. Take 0.00–0.82s for a one-keystroke hit.
  The weakest of the seven — cut this one first.

---

## IMAGES

### Fan-wiki screen captures (in character)

Source: the French fan wiki `les-visiteurs-okay.fandom.com`. These are frame grabs
and press stills of the film uploaded by fans; the wiki states no licence for them.
**licence for all five below: unclear / fan upload / copyrighted film still.**
Note: the Fandom CDN transcodes on delivery, so the files arrive as WebP even
though the source filename ends in .jpg. Dimensions below are the real decoded ones.

## jacquouille.webp
- url: https://static.wikia.nocookie.net/les-visiteurs-okay/images/e/e9/Jacquouille.jpg/revision/latest?cb=20140830225318&path-prefix=fr
- page: https://les-visiteurs-okay.fandom.com/fr/wiki/Jacquouille
- licence: unclear / fan upload / copyrighted film still
- notes: 649x544 WebP. Jacquouille la Fripouille (Christian Clavier) laughing
  open-mouthed, rotten teeth visible, wild hair — the face fills the frame edge to
  edge, bright daylight background. This is the hero image, no crop needed.

## godefroy.webp
- url: https://static.wikia.nocookie.net/les-visiteurs-okay/images/9/9e/Godefroy.jpg/revision/latest?cb=20140925001014&path-prefix=fr
- page: https://les-visiteurs-okay.fandom.com/fr/wiki/Godefroy_de_Montmirail
- licence: unclear / fan upload / copyrighted film still
- notes: 409x612 WebP. Godefroy de Montmirail (Jean Reno) in the gold-and-steel
  nasal helm and mail coif, head-and-shoulders, face fills the frame. Centre-square
  crop will work cleanly.

## jacquart.webp
- url: https://static.wikia.nocookie.net/les-visiteurs-okay/images/9/91/Jacquart.jpg/revision/latest?cb=20140830010901&path-prefix=fr
- page: https://les-visiteurs-okay.fandom.com/fr/wiki/Jacquart
- licence: unclear / fan upload / copyrighted film still
- notes: 630x511 WebP. Christian Clavier as Jacques-Henri Jacquart (the modern
  descendant, camel blazer and purple tie), mid-sentence. Tight head-and-shoulders.

## beatrice.webp
- url: https://static.wikia.nocookie.net/les-visiteurs-okay/images/9/96/Fr%C3%A9n%C3%A9gonde_Val%C3%A9rie_Lemercier.jpg/revision/latest?cb=20141229175426&path-prefix=fr
- page: https://les-visiteurs-okay.fandom.com/fr/wiki/Frénégonde
- licence: unclear / fan upload / copyrighted film still
- notes: source 1000x1543; I cropped to 620x700 on the head (`-crop 620x700+200+90`)
  so the face and the horned medieval headdress fill the frame. Valérie Lemercier
  in costume — she plays both Frénégonde and Béatrice, this still is the medieval
  one, which reads more "Visiteurs" than a modern-dress shot.

## affiche-les-visiteurs.webp
- url: https://static.wikia.nocookie.net/les-visiteurs-okay/images/4/4f/Les_Visiteurs_Affiche_1.jpg/revision/latest?cb=20140901184411&path-prefix=fr
- page: https://les-visiteurs-okay.fandom.com/fr/wiki/Les_Visiteurs
- licence: unclear / fan upload / copyrighted poster artwork
- notes: 437x600 WebP, the original 1993 theatrical poster (Godefroy on foot,
  sword raised, castle behind, "1123 — 1993"). Honest warning: this is the weakest
  image for your use case. It is a detailed poster with small type and it will
  become a coloured smudge at 96px. Keep it only if you want one obvious
  "this is a film" sprite; the lettering will not survive.

## portrait-godefroy.webp
- url: https://static.wikia.nocookie.net/les-visiteurs-okay/images/a/ae/Portrait_de_Godefroy_de_Montmirail.jpg/revision/latest?cb=20140925204007&path-prefix=fr
- page: https://les-visiteurs-okay.fandom.com/fr/wiki/Godefroy_de_Montmirail
- licence: unclear / fan upload / copyrighted film prop artwork
- notes: 1020x1177 WebP. The painted portrait of Godefroy in its gilt frame — the
  prop from the château. Strong rectangular silhouette, high contrast, an ornate
  gold frame around a red-and-blue profile. This is the single best spinning-object
  image of the set.

### Freely-licensed medieval objects (Wikimedia Commons)

## heaume.jpg
- url: https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Heaume_-_Mus%C3%A9e_du_ch%C3%A2teau_de_Dinan.jpg/960px-Heaume_-_Mus%C3%A9e_du_ch%C3%A2teau_de_Dinan.jpg
- page: https://commons.wikimedia.org/wiki/File:Heaume_-_Mus%C3%A9e_du_ch%C3%A2teau_de_Dinan.jpg
- licence: **CC0 / public domain dedication** (page says "Creative Commons Zero,
  Public Domain Dedication"; author René Hourdry, own work). Clean, no attribution
  required.
- notes: 960x1069 JPEG, downloaded at the 960px thumbnail size (original is
  3476x3871). A medieval great helm on a stand, front three-quarter, filling the
  frame; brass browband, eye slits, breath holes. Ideal spinning confetti.
  Background is an illuminated-manuscript panel, warm and busy — if you need it
  cleaner, the helmet silhouette is easy to key out.

## epee.jpg
- url: https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Cawood_sword_-_hilt_-_YORYM_2007_3086.JPG/960px-Cawood_sword_-_hilt_-_YORYM_2007_3086.JPG
  (original: https://upload.wikimedia.org/wikipedia/commons/5/5c/Cawood_sword_-_hilt_-_YORYM_2007_3086.JPG)
- page: https://commons.wikimedia.org/wiki/File:Cawood_sword_-_hilt_-_YORYM_2007_3086.JPG
- licence: **CC BY-SA 4.0** — "Photographed by: York Museums Trust Staff", via the
  York Museums Trust GLAMwiki partnership. Attribution + share-alike required if
  you redistribute.
- notes: 960x720 JPEG. The hilt of the Cawood sword (12th c.) on a pure white
  background — curved crossguard, lobed pommel, part of the blade. Dark object on
  white, so it keys out trivially and the silhouette still reads as "sword" at
  96px. Second-best spinning object after the framed portrait.

---

## Groupe `mission-cleopatre`

# mission-cleopatre — sources

All film stills and all voice clips come from fan-made, unlicensed reuploads of a
copyrighted film (Astérix & Obélix : Mission Cléopâtre, 2002, Alain Chabat / Pathé).
No free-licence source exists for them. Licence is reported below exactly as found.

Only the object images (gourd, pyramid, sphinx, scroll) are cleanly licensed (Wikimedia Commons).

---

## imhotep-a-vous.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix035.mp3
- licence: unclear / fan upload / copyrighted — backend of the free Android app "La Soundbox Mission Cléopâtre" (fr.useless.asterix, Useless Industries); no licence stated anywhere
- notes: Otis (Édouard Baer) — « Imhotep à vous ! ». 1.00s total, line runs 0.10–0.92s. Already tight, almost no trimming needed.

## erimetetekee.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix046.mp3
- licence: unclear / fan upload / copyrighted (same app backend)
- notes: Amonbofis (Gérard Darmon) — « Érimétététéké ! ». 1.05s total, line runs 0.04–1.04s (fills the whole clip).

## double-esquive.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix092.mp3
- licence: unclear / fan upload / copyrighted (same app backend)
- notes: Numérobis (Jamel Debbouze) — « Double esquive ». 1.01s total, line runs 0.00–0.68s; ~0.3s of trailing ambience to cut.

## va-asterixme.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix053.mp3
- licence: unclear / fan upload / copyrighted (same app backend)
- notes: Numérobis — « Va Astérixme ! ». 1.36s total, line runs 0.04–1.30s.

## ca-va-imhotep.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix100.mp3
- licence: unclear / fan upload / copyrighted (same app backend)
- notes: « Ça va, ça va, Imhotep. » (the running gag greeting). 1.38s total, line runs 0.12–1.14s.

## cest-qui-le-lion.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix105.mp3
- licence: unclear / fan upload / copyrighted (same app backend)
- notes: Numérobis — « Et c'est qui le lion maintenant ? ». 1.42s total, line runs 0.10–1.28s. Cannot be cut much shorter without losing the joke.

## je-suis-libere.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix014.mp3
- licence: unclear / fan upload / copyrighted (same app backend)
- notes: Numérobis — « D'un coup là, je suis libéré là ! ». 1.24s total, speech spans the whole clip 0.02–1.24s.

## peu-importe-leurs-noms.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix072.mp3
- licence: unclear / fan upload / copyrighted (same app backend)
- notes: Caius Céplus (Dieudonné) — « Peu importe leurs noms ! ». 1.74s total, line runs 0.08–1.58s — slightly over 1.5s; trimming the first ~0.2s still keeps the line.

## ils-sont-fous-ces-romains.mp3
- url: https://useless-industries.fr/soundboxes/asterix/sounds/asterix076.mp3
- licence: unclear / fan upload / copyrighted (same app backend)
- notes: Obélix (Gérard Depardieu) — « Ils sont fous ces Romains… ». 2.29s total; the line itself runs 0.15–1.40s, then a silence and a bit of trailing ambience 1.90–2.15s. Cut at 0.15–1.40s.

---

## numerobis.webp
- url: https://raw.githubusercontent.com/CyrusWeir/Mission-Cleopatre---Groupe-3/HEAD/mission-cleopatre/src/Images/numerobis.jpg
- licence: unclear / fan upload / copyrighted — film screenshot in a student GitHub project, no licence file
- notes: Numérobis (Jamel Debbouze), face crop 256x256 from the 670x376 still.

## cleopatre.webp
- url: https://raw.githubusercontent.com/CyrusWeir/Mission-Cleopatre---Groupe-3/HEAD/mission-cleopatre/src/Images/cleopatre.jpg
- licence: unclear / fan upload / copyrighted (same repo)
- notes: Cléopâtre (Monica Bellucci) with the crown, face crop 300x300.

## amonbofis.webp
- url: https://raw.githubusercontent.com/CyrusWeir/Mission-Cleopatre---Groupe-3/HEAD/mission-cleopatre/src/Images/amonbeaufils.jpg
- licence: unclear / fan upload / copyrighted (same repo)
- notes: Amonbofis (Gérard Darmon), face crop 300x300.

## obelix.webp
- url: https://raw.githubusercontent.com/CyrusWeir/Mission-Cleopatre---Groupe-3/HEAD/mission-cleopatre/src/Images/obelix.jpg
- licence: unclear / fan upload / copyrighted (same repo)
- notes: Obélix (Gérard Depardieu) holding Idéfix, crop 256x256.

## panoramix.webp
- url: https://raw.githubusercontent.com/CyrusWeir/Mission-Cleopatre---Groupe-3/HEAD/mission-cleopatre/src/Images/panoramix.jpg
- licence: unclear / fan upload / copyrighted (same repo)
- notes: Panoramix (Claude Rich), face crop 280x280.

## otis.jpg
- url: https://raw.githubusercontent.com/SKupisz/pokemon-mission-cleopatre/HEAD/src/img/otis.jpg
- licence: unclear / fan upload / copyrighted — film screenshot in a hobby game repo, no licence file
- notes: Otis (Édouard Baer), face crop 340x340 from the 967x818 still.

## asterix.jpg
- url: https://raw.githubusercontent.com/SKupisz/pokemon-mission-cleopatre/HEAD/src/img/asterix.jpg
- licence: unclear / fan upload / copyrighted (same repo)
- notes: Astérix (Christian Clavier), face crop 420x420 from a 1024x768 lobby card; the "Misja Kleopatra" watermark sits outside the crop.

## potion-gourde.jpg
- url: https://commons.wikimedia.org/wiki/File:Gourde_calebasse,_PPO471.jpg
- licence: CC0 (as stated on the Commons file page; Petit Palais, object by Jean Carriès)
- notes: gourd flask on a plain background — stands in for the potion magique gourd. 512x512 crop.

## pyramide.jpg
- url: https://commons.wikimedia.org/wiki/File:Great_Pyramid_of_Giza.jpg
- licence: CC BY-SA 3.0, by kallerna
- notes: full pyramid silhouette, 512x512 crop.

## sphinx.jpg
- url: https://commons.wikimedia.org/wiki/File:Egypt.Giza.Sphinx.01.jpg
- licence: CC BY-SA 3.0, by en:User:Hajor
- notes: Great Sphinx with pyramid behind, 440x440 crop.

## papyrus-scroll.png
- url: https://commons.wikimedia.org/wiki/File:Sealed_Scroll.svg
- licence: CC0, by No-IP-Art
- notes: rolled/sealed scroll, SVG rendered to 960x960 PNG **with transparent background** — the best spinning-confetti asset of the set.

---

## Groupe `brice-de-nice`

# brice-de-nice — sources

All files in this directory were downloaded and verified (`file`, `magick identify`, `ffprobe`).

**Licence reality check.** *Brice de Nice* (2005, Studio 37 / TF1 Films Production / Gaumont) is a
copyrighted film. Nothing in-character — no still, no poster, no line of dialogue — is available
under a free licence. Every in-character asset below is marked honestly as copyrighted. The only
cleanly-licensed files here are the Wikimedia Commons ones (Jean Dujardin out of character, and the
generic props: surfboard, sunglasses, wave, yellow oilskin jacket).

**Timestamp caveat for the sounds.** I have no speech-to-text available in this environment, so I
could not listen to or transcribe the clips. Every zonesons clip is a fixed ~5 s window cut around
the line, with film score / room ambience running underneath — `silencedetect -30dB` finds no
silence at all in any of them, so there is no clean silence-delimited speech boundary to report.
The ranges below are **estimated** from a 400–3500 Hz speech-band RMS envelope (50 ms frames): I
report the loudest 0.8 s window and, where the envelope has clearly isolated bursts, the burst
boundaries. Treat them as a starting point for the ffmpeg trim, not as verified speech boundaries.
The clips where the envelope is clean (isolated burst surrounded by quiet) are flagged HIGH
confidence; the dense ones are flagged LOW.

---

## IMAGES

### brice-visage.jpg
- url: https://media.themoviedb.org/t/p/original/xaPWkjxc0ccgvST0nohjWW6tf21.jpg
  (page: https://www.themoviedb.org/movie/17350-brice-de-nice/images/backdrops)
- licence: unclear / copyrighted — promotional film still uploaded by the TMDB community
- notes: 430x430. Hero image. Tight crop on Brice's face (blond hair, grin, yellow BRICE t-shirt
  collar visible) from a 1920x1080 promotional still. Face fills the frame.

### brice-bras-leves.jpg
- url: https://media.themoviedb.org/t/p/original/auImYvCwRNaSIf5LUY1tDYvU4xx.jpg
- licence: unclear / copyrighted — promotional film artwork uploaded by the TMDB community
- notes: 1150x1780. Brice arms-up in the yellow BRICE t-shirt and black baggy trousers, isolated on
  a flat saturated-yellow ground — effectively a cut-out. Best spinning sprite of the set.

### brice-planche-jaune.jpg
- url: https://media.themoviedb.org/t/p/original/vD0Bm2809tkp1KCApADSOfjxTFr.jpg
- licence: unclear / copyrighted — promotional film still uploaded by the TMDB community
- notes: 1200x950. Brice carrying his big yellow surfboard on the beach. Crop is tight on
  head + board; the yellow dominates the frame.

### brice-planche-blanche.jpg
- url: https://media.themoviedb.org/t/p/original/z9mp3czUzSWw8PteuGdfsC4Ke4b.jpg
- licence: unclear / copyrighted — promotional film artwork uploaded by the TMDB community
- notes: 980x1830. Brice in the yellow BRICE t-shirt holding the white/yellow yin-yang surfboard,
  on the yellow sunburst key art background.

### brice-affiche.jpg
- url: https://media.themoviedb.org/t/p/original/eak0GxOsRmvEbr53yf7jbM8SD8u.jpg
  (page: https://www.themoviedb.org/movie/17350-brice-de-nice/images/posters)
- licence: unclear / copyrighted — film poster, uploaded by the TMDB community
- notes: 2000x3000. The film poster: black "BRICE de Nice" logotype on yellow sunburst. At 128x128
  the figure goes small but the black-on-yellow logotype still reads.

### jean-dujardin.jpg
- url: https://commons.wikimedia.org/wiki/File:Jean_Dujardin_2009.jpg
  (file: https://upload.wikimedia.org/wikipedia/commons/b/ba/Jean_Dujardin_2009.jpg)
- licence: CC BY-SA 4.0 — author: Nicolas Richoffer
- notes: 1020x1150, cropped to head-and-shoulders from the 1280x1924 thumbnail. Out of character
  (2009 portrait, blue shirt, no yellow) — the clean-licence fallback face.

### surf-jaune.jpg
- url: https://commons.wikimedia.org/wiki/File:Yellow_surfboard_in_Golden_Beach.jpg
- licence: CC BY-SA 4.0 — author: Peachyeung316
- notes: 900x420, cropped to the board. Yellow surfboard lying on sand, red fin. Object sprite.

### lunettes-soleil.png
- url: https://commons.wikimedia.org/wiki/File:Sunglasses-1_retouch.png
  (file: https://upload.wikimedia.org/wikipedia/commons/f/f9/Sunglasses-1_retouch.png)
- licence: CC BY-SA 3.0 — author: LotusHead (Johannesburg)
- notes: 985x568, genuine transparent-background PNG cut-out (alpha channel present, mean alpha
  0.40). Aviator sunglasses. The best object sprite of the set.

### veste-ciree-jaune.jpg
- url: https://commons.wikimedia.org/wiki/File:Veste_ROSBRAS_cir%C3%A9_jaune_traditionnel_breton_par_Guy_Cotten.jpg
- licence: CC BY-SA 4.0 — author: Arthur Crbz
- notes: 700x900, cropped to the garment. A yellow oilskin jacket on a mannequin — stands in for
  "a yellow jacket as an object". Very loud yellow.

### vague.jpg
- url: https://commons.wikimedia.org/wiki/File:Breaking_wave_July_2007-1.jpg
- licence: CC BY 2.5 — author: Alvesgaspar
- notes: 700x500, cropped to the breaking crest. Weakest image of the set: no yellow, and at 96px
  it reads as a blue-green smear. Cut this one first.

---

## SOUNDS

All thirteen come from zonesons.com, section
https://zonesons.com/films-de-comedie/brice-de-nice-2005/ (also reachable as
https://zonesons.com/repliques-cultes-de-comedie/phrases-cultes-de-brice-de-nice-2005).
Direct file pattern: `https://zonesons.com/citations/brice/<Nom-De-La-Replique>.mp3`
(the `<audio src>` on the page is base64-encoded; the site also hotlink-blocks, a
`Sec-Fetch-Dest: audio` + `Range:` + same-origin `Referer` request is required).

licence for all of them: **copyrighted** — zonesons' own legal page states the dialogue,
performances and recordings "restent protégés par le droit d'auteur et les droits voisins",
that rights stay with the rightsholders, and that hosting an extract transfers no rights.
So: copyrighted film audio, hosted as short quotation extracts by a French fan/quote site.

### je-tai-casse.mp3  — « Je t'ai cassé ! »   ← THE priority line
- url: https://zonesons.com/citations/brice/Je-tai-casse.mp3
- licence: copyrighted (see above)
- notes: 5.25 s total. Estimated line 1.30–2.50 s (loudest 0.8 s window 1.35–2.15 s);
  MEDIUM confidence — isolated bursts at 1.35–1.65, 1.70–1.95, 2.10–2.45 s, and the clip goes
  quiet after ~3.0 s, so the tail 3.0–5.25 s is dead weight. Suggested trim: `-ss 1.30 -t 1.25`.

### je-tai-casse-alt.mp3 — « Je t'ai cassé ! » (second take on the site, "Je-tai-casse-1")
- url: https://zonesons.com/citations/brice/Je-tai-casse-1.mp3
- licence: copyrighted
- notes: 5.72 s total. Estimated line 1.55–2.35 s. LOW confidence — dense music bed throughout,
  no clean boundaries. Backup for the file above.

### casse.mp3 — « Cassé ! »
- url: https://zonesons.com/citations/brice/Casse%21.mp3
- licence: copyrighted
- notes: 4.68 s total. Estimated 0.95–1.75 s. LOW confidence — the whole clip is uniformly loud
  (music under the whole extract), so the word is not separable by energy.

### casse-casse.mp3 — « Cassé ! Cassé ! »
- url: https://zonesons.com/citations/brice/Casse%21-Casse%21.mp3
- licence: copyrighted
- notes: 6.74 s total. Estimated 0.85–1.90 s (loudest 0.8 s window 0.85–1.65 s). MEDIUM confidence
  — clear burst at the start, then near-silence 2.6–4.4 s. Lead-in of ~0.8 s before the burst.

### casse-contre-casse.mp3 — « Casse contre casse ! Ouais ! Casse contre casse ! »
- url: https://zonesons.com/citations/brice/Casse-contre-casse%21-Ouais%21-Casse-contre-casse%21.mp3
- licence: copyrighted
- notes: 6.97 s total, uniformly loud, LOW confidence, loudest 0.8 s window 1.95–2.75 s.
  PROBLEM: this is a three-part exchange; it cannot be cut to 1.5 s without losing the joke.
  Keep only if you want a longer sting, otherwise drop.

### tu-mas-casse.mp3 — « Tu m'as cassé »
- url: https://zonesons.com/citations/brice/Tu-mas-casse.mp3
- licence: copyrighted
- notes: 4.81 s total. Estimated 0.80–1.60 s. LOW confidence — dense.

### ouais.mp3 — « Ouais ! »
- url: https://zonesons.com/citations/brice/Ouais%21.mp3
- licence: copyrighted
- notes: 4.75 s total. Line 3.10–3.90 s. **HIGH confidence** — cleanest clip of the set: a single
  isolated burst surrounded by near-silence, ~3.0 s of dead lead-in and ~0.85 s of dead tail.
  Suggested trim: `-ss 3.05 -t 0.90`.

### attends-attends.mp3 — « Attends, attends »
- url: https://zonesons.com/citations/brice/Attends-attends.mp3
- licence: copyrighted
- notes: 5.17 s total. Two bursts: 0.15–0.55 s and 1.15–1.95 s. MEDIUM confidence — likely the two
  "attends". Suggested trim: `-ss 1.15 -t 0.85` for the single word, or 0.10–2.00 for both
  (1.9 s — slightly over your budget).

### ca-ca-farte.mp3 — « Ça, ça farte » (the film's other catchphrase)
- url: https://zonesons.com/citations/brice/Ca-ca-farte.mp3
- licence: copyrighted
- notes: 5.04 s total. Estimated 2.20–3.40 s (loudest 0.8 s window 2.50–3.30 s). MEDIUM confidence
  — quiet for the first ~1.2 s, so there is a real lead-in to cut.

### je-mappelle-brice-je-viens-de-nice.mp3 — « Je m'appelle Brice, je viens de Nice »
- url: https://zonesons.com/citations/brice/Je-mappelle-Brice-je-viens-de-Nice.mp3
- licence: copyrighted
- notes: 5.20 s total. Estimated 0.90–1.70 s. LOW confidence — dense. PROBLEM: the full line is a
  two-clause rhyme and almost certainly runs longer than 1.5 s; cutting it in half loses the rhyme.

### surfe.mp3 — « Surfe »
- url: https://zonesons.com/citations/brice/Surfe.mp3
- licence: copyrighted
- notes: 4.62 s total. Line 3.00–3.35 s (loudest 0.8 s window 2.70–3.50 s). **HIGH confidence** —
  isolated burst with ~1.6 s of silence before it. Suggested trim: `-ss 2.95 -t 0.55`.

### tchou.mp3 — « Tchou » (Brice's mouth-noise tic)
- url: https://zonesons.com/citations/brice/Tchou.mp3
- licence: copyrighted
- notes: 4.86 s total. Estimated 0.65–1.45 s. LOW confidence — uniformly loud.

### bonne-vague.mp3 — « Bonne vague ! »
- url: https://zonesons.com/citations/brice/Bonne-vague%21.mp3
- licence: copyrighted
- notes: 3.92 s total (shortest of the set). Bursts at 2.05–3.05 s and 3.35–3.55 s.
  MEDIUM confidence. Suggested trim: `-ss 2.05 -t 1.00`.

---

## What I could not get

- **myinstants.com** (your suggested first stop) is Cloudflare-blocked from this machine: every
  request — search page, instant page, and the `/media/sounds/*.mp3` files — returns a 403
  "Sorry, you have been blocked" interstitial, with or without a browser User-Agent, and four
  public CORS proxies also failed on the media host. I could read the *listings* through a
  text-reader proxy and confirmed it holds `casse.mp3`, `chtecasse.mp3`, `brice.mp3`,
  `brice-screm.mp3`, `bricedenice02.mp3` and `musique-de-la-coollatitude.mp3`, but none of the
  audio bytes were reachable. zonesons.com replaced it as the source.
- **« T'es jaune ! » / « Le jaune, c'est ma couleur »** — not in zonesons' 996-quote Brice
  catalogue. The closest entries are « C'est pas jaune ! », « Avec tes nuits jaunes… » and
  « Ya une Yellow ce soir ? Une quoi ? Yellow. Jaune. », all of which are multi-speaker
  exchanges too long to cut to 1.5 s. Not downloaded.
- **The Brice de Nice theme-song sting** ("Le casse de Brice") — only available as full-track
  downloads on grey-area MP3 sites or as karaoke backing tracks. Skipped deliberately.
- **A transparent-background cut-out of Brice himself** — does not exist on any source serving a
  direct file. `brice-bras-leves.jpg` (figure isolated on flat yellow) is the closest substitute;
  it will key out trivially if you want real transparency.
- **The "cassé" meme card** — searched, nothing on a direct-file host.
- **Promenade des Anglais** — Wikimedia has good CC BY-SA photos, but every one is a wide
  cityscape that becomes mush at 96px, so I did not keep one.
