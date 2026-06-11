# GenZ-No-Lazy

A simple static web app for a ten-day Cantonese coda training course. The course keeps the scope deliberately narrow: learn the coda distinctions, especially `-n/-ng` and `-t/-k`, to sound closer to older Hong Kong speakers.

## How to run

Open `index.html` in a modern browser. For recording practice, serving the folder on localhost is more reliable:

```sh
python3 -m http.server 8001
```

Recommended browser: Chrome or Safari.

The app uses browser APIs only:

- Local Jyutping mp3 samples in `audio/jyutping/`, with browser TTS fallback.
- Browser recording: `MediaRecorder` / `getUserMedia`.
- Progress storage: `localStorage`.

No build step is required.

## How to edit lessons

Edit `data.js`.

Main data types:

```js
{ type: "perc", title: "分類練習", instruction: "...", data: "盟新很巾" }
{ type: "prod", title: "跟讀錄音", instruction: "...", data: "真奔陳頻" }
{ type: "quiz", title: "選擇題", instruction: "...", data: "親分!登" }
{ type: "type", title: "打字練習", instruction: "...", hint: "2.1", data: "我係一隻[橙]色嘅草[蜢]。" }
```

Quiz answers use `!` before the correct answer.

Typing answers use `[square brackets]`.

If you add new words, also add their Jyutping in `lexicon`. The app infers the coda from the final Jyutping syllable. Add matching mp3 files to `audio/jyutping/` if you want sample playback for new syllables.

## Audio samples

Sample playback is local, not hotlinked. Files in `audio/jyutping/` are copied from the Words.hk static Jyutping mp3 endpoint for the syllables used by this course.

## Picture hints

Picture hints live in `pics/` and are loaded from the `hint` id on typing modules. Keep them as compressed `.jpg` files, ideally under 200 KB each.

## Notes

Browser recording support varies by device and browser. The app provides a manual completion button for shadowing practice so a learner is not blocked if recording is unavailable.
