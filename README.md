# Cantonese Coda Trainer

A simple static web app for a ten-day Cantonese coda training course.

## How to run

Open `index.html` in a modern browser.

Recommended browser: Chrome or Safari.

The app uses browser APIs only:

- Browser TTS: `speechSynthesis`, with `zh-HK` requested.
- Browser ASR: `SpeechRecognition` / `webkitSpeechRecognition`, with `yue-Hant-HK` requested (Cantonese only).
- Progress storage: `localStorage`.

No server is required.

## How to edit lessons

Edit `data.js`.

Main data types:

```js
{ type: "perc", title: "分類練習", instruction: "...", data: "盟新很巾" }
{ type: "prod", title: "朗讀練習", instruction: "...", data: "真奔陳頻" }
{ type: "quiz", title: "選擇題", instruction: "...", data: "親分!登" }
{ type: "type", title: "打字練習", instruction: "...", hint: "2.1", data: "我係一隻[橙]色嘅草[蜢]。" }
```

Quiz answers use `!` before the correct answer.

Typing answers use `[square brackets]`.

If you add new words, also add their Jyutping in `lexicon`. The app infers the coda from the final Jyutping syllable.

## Picture hints

The current app shows a text placeholder such as `Picture hint: 2.1`.

To add images, place files in an `images/` or `hints/` folder and update the `renderTypePractice` function in `app.js` to load the image path.

## Notes

Browser Cantonese TTS and ASR quality varies by device and browser. The app provides a manual completion button for production practice so a learner is not blocked if ASR is unavailable.
