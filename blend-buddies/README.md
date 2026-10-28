# Blend Buddies 🦄🍀

A talking phonics flash card game. Each level shows a blend (like **sh**), then four
words that use it (ship, shoe, sheep, shell). The child taps **▶ Play**, the game
asks them to say the word, and it listens through the microphone.

- **Right answer:** a dancing unicorn, a jigging leprechaun or shooting stars, plus confetti.
- **Wrong answer:** "Let's sound it out!" The word splits into sound tiles
  (sh · i · p), the game says each sound, blends them, then listens again.
  After three tries it says the word and moves on.
- **Every card in a level right:** heart rain, with the unicorn, leprechaun and shooting stars together.

## Two tracks

| Track | Age | How it plays | Levels |
|---|---|---|---|
| Little Stars | 3 | A picture is shown, child says what it is | 8: sh, ch, th, wh, bl, fr, st, sn |
| Super Readers | 6 | Only the word is shown, child reads it; the picture appears as a hint after a miss | 12: sh, ch, cl, gr, tr, sp, fl, th, str, thr, scr, spl |

Levels unlock one after another. Stars: ⭐⭐⭐ every word right first try,
⭐⭐ every word right with some sounding out, ⭐ finished with a miss.
Progress is saved in the browser.

## Running it

Open `index.html` in Chrome, Edge or Safari. Listening needs the page served over
`https://` or `http://localhost`, for example:

```sh
cd blend-buddies && python3 -m http.server 8000
# then open http://localhost:8000
```

Browsers without speech recognition (such as Firefox), or a blocked microphone,
switch to grown-up mode: tap **✓ Said it right** or **🧩 Sound it out** after the
child answers. The ⚙️ menu turns the mic on or off, unlocks every level, mutes
sound effects and resets progress.

Words live in `data.js`, so new levels are easy to add.
