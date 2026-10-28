/* Blend Buddies: talking phonics flash cards. */
(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- Saved progress ---------- */
  const KEY = "blend-buddies-v1";
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  })();
  const progress = {
    stars: { 3: {}, 6: {} }, // stars[age][levelIndex] = 1..3
    mic: true,
    unlockAll: false,
    sfx: true,
    ...saved,
  };
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* private mode */ }
  }
  const starsFor = (age, i) => progress.stars[age][i] || 0;
  const isUnlocked = (age, i) => progress.unlockAll || i === 0 || starsFor(age, i - 1) > 0;
  const totalStars = () =>
    Object.values(progress.stars).reduce((n, lv) => n + Object.values(lv).reduce((a, b) => a + b, 0), 0);

  /* ---------- Talking ---------- */
  const synth = window.speechSynthesis;
  let voice = null;
  function chooseVoice() {
    if (!synth) return;
    const voices = synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
    const prefs = [/samantha/i, /google us english/i, /aria/i, /jenny/i, /zira/i, /karen/i, /en[-_]us/i];
    for (const p of prefs) {
      const v = voices.find((x) => p.test(x.name) || p.test(x.lang));
      if (v) { voice = v; return; }
    }
    voice = voices[0] || null;
  }
  if (synth) {
    chooseVoice();
    synth.onvoiceschanged = chooseVoice;
  }

  function say(text, { rate = 0.9, pitch = 1.2 } = {}) {
    return new Promise((resolve) => {
      if (!synth) return resolve();
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : "en-US";
      u.rate = rate;
      u.pitch = pitch;
      // Some browsers never fire onend, so fall back to a timer.
      const fallback = setTimeout(resolve, 1200 + text.length * 110 / rate);
      u.onend = u.onerror = () => { clearTimeout(fallback); resolve(); };
      synth.speak(u);
    });
  }

  /* ---------- Listening ---------- */
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let activeRec = null;

  // Resolves with { status: "match" | "miss" | "silent" | "denied" | "error", heard }
  function listen(matches, ms = 7000) {
    return new Promise((resolve) => {
      let rec;
      try { rec = new Recognition(); } catch { return resolve({ status: "error", heard: "" }); }
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 5;
      activeRec = rec;

      let finals = "", interim = "", done = false;
      const heard = () => (finals + " " + interim).trim();
      const finish = (status) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        activeRec = null;
        try { rec.abort(); } catch { /* already stopped */ }
        resolve({ status, heard: heard() });
      };
      const timer = setTimeout(() => finish(heard() ? "miss" : "silent"), ms);

      rec.onresult = (e) => {
        interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          for (let j = 0; j < r.length; j++) {
            if (matches(r[j].transcript)) return finish("match");
          }
          if (r.isFinal) finals += " " + r[0].transcript;
          else interim += " " + r[0].transcript;
        }
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") finish("denied");
        else if (e.error === "no-speech") finish(heard() ? "miss" : "silent");
        else if (e.error !== "aborted") finish(heard() ? "miss" : "error");
      };
      rec.onend = () => finish(heard() ? "miss" : "silent");
      try { rec.start(); } catch { finish("error"); }
    });
  }
  function stopListening() {
    if (activeRec) try { activeRec.abort(); } catch { /* ignore */ }
  }

  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // Did the child say the word? Little ones get a bit more slack, but the
  // word must still start with the blend so "chip" never counts for "ship".
  function heardWord(transcript, card) {
    const tokens = transcript.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean)
      .map((t) => t.replace(/'/g, ""));
    const accept = [card.word, ...card.alts].map((w) => w.replace(/'/g, ""));
    const candidates = [...tokens];
    for (let i = 0; i < tokens.length - 1; i++) candidates.push(tokens[i] + tokens[i + 1]); // "snow man"
    const n = card.word.length;
    const slack = state.age === 3 ? (n >= 4 ? 1 : 0) + (n >= 7 ? 1 : 0) : (n >= 7 ? 1 : 0);
    return candidates.some((t) => {
      if (accept.includes(t) || accept.includes(t.replace(/e?s$/, ""))) return true;
      return t.startsWith(card.blend) && lev(t, card.word) <= slack;
    });
  }

  /* ---------- Sound effects ---------- */
  let audio = null;
  function tone(freq, start, dur, type = "sine", vol = 0.18) {
    if (!progress.sfx) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime + start;
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    } catch { /* no audio */ }
  }
  const sfx = {
    ding: () => [784, 988, 1319].forEach((f, i) => tone(f, i * 0.09, 0.35, "triangle")),
    boop: () => { tone(392, 0, 0.18, "sine", 0.12); tone(330, 0.15, 0.25, "sine", 0.12); },
    pop: () => tone(660, 0, 0.12, "triangle", 0.12),
    fanfare: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.14, 0.4, "triangle", 0.16)),
  };

  /* ---------- Celebrations ---------- */
  const fx = $("#fx");
  const COLORS = ["#ff6fae", "#8b5cf6", "#38bdf8", "#22c55e", "#fbbf24", "#fb923c"];
  function spawn(html, cls, style, life) {
    const el = document.createElement("div");
    el.className = cls;
    el.innerHTML = html;
    Object.assign(el.style, style);
    fx.appendChild(el);
    setTimeout(() => el.remove(), life);
    return el;
  }

  function confetti(n = 60) {
    for (let i = 0; i < n; i++) {
      const dur = 1.8 + Math.random() * 1.6;
      const el = spawn("", "confetti", {
        left: Math.random() * 100 + "vw",
        background: pick(COLORS),
        animationDuration: dur + "s",
        animationDelay: Math.random() * 0.4 + "s",
      }, (dur + 0.5) * 1000);
      el.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
      el.style.setProperty("--rot", (Math.random() * 1080 - 540) + "deg");
    }
  }

  function shootingStars(n = 7) {
    for (let i = 0; i < n; i++) {
      const dur = 1.2 + Math.random() * 0.8;
      spawn(pick(["⭐", "🌟", "💫"]), "shooting-star", {
        left: -20 - Math.random() * 20 + "vw",
        top: Math.random() * 45 + "vh",
        animationDuration: dur + "s",
        animationDelay: i * 0.25 + "s",
      }, (dur + i * 0.25 + 0.3) * 1000);
    }
    for (let i = 0; i < 18; i++) {
      spawn("✨", "twinkle", {
        left: Math.random() * 95 + "vw",
        top: Math.random() * 80 + "vh",
        animationDelay: Math.random() * 1.6 + "s",
      }, 3200);
    }
  }

  function heartRain(n = 70) {
    for (let i = 0; i < n; i++) {
      const dur = 3 + Math.random() * 2.5;
      const el = spawn(pick(["❤️", "💖", "💗", "💕", "💜", "🩷"]), "heart", {
        left: Math.random() * 100 + "vw",
        fontSize: 22 + Math.random() * 30 + "px",
        animationDuration: dur + "s",
        animationDelay: Math.random() * 2.5 + "s",
      }, (dur + 3) * 1000);
      el.style.setProperty("--sway", (Math.random() * 80 - 40) + "px");
    }
  }

  function unicornDance(left = "50%") {
    const el = spawn(`
      <div class="stage">
        <div class="rainbow"></div>
        <div class="sparkle-orbit"><b>✨</b><b>💖</b><b>⭐</b></div>
        <span class="unicorn">🦄</span>
      </div>`, "dancer", { left, marginLeft: "-80px" }, 3100);
    return el;
  }

  const LEPRECHAUN_SVG = `
    <svg class="leprechaun" viewBox="0 0 120 170" aria-hidden="true">
      <g class="leg leg-l"><rect x="46" y="120" width="10" height="32" rx="4" fill="#1b5e20"/><ellipse cx="45" cy="154" rx="13" ry="6" fill="#3e2723"/><rect x="40" y="150" width="8" height="4" fill="#ffd54f"/></g>
      <g class="leg leg-r"><rect x="64" y="120" width="10" height="32" rx="4" fill="#1b5e20"/><ellipse cx="75" cy="154" rx="13" ry="6" fill="#3e2723"/><rect x="72" y="150" width="8" height="4" fill="#ffd54f"/></g>
      <path d="M36 82 Q60 72 84 82 L90 126 Q60 134 30 126 Z" fill="#2e7d32"/>
      <rect x="33" y="108" width="54" height="8" fill="#3e2723"/>
      <rect x="54" y="105.5" width="12" height="13" rx="2" fill="none" stroke="#ffd54f" stroke-width="3"/>
      <g class="arm arm-l"><path d="M40 88 L18 66" stroke="#2e7d32" stroke-width="11" stroke-linecap="round"/><circle cx="16" cy="63" r="7" fill="#ffcc9a"/></g>
      <g class="arm arm-r"><path d="M80 88 L102 66" stroke="#2e7d32" stroke-width="11" stroke-linecap="round"/><circle cx="104" cy="63" r="7" fill="#ffcc9a"/></g>
      <circle cx="60" cy="58" r="21" fill="#ffcc9a"/>
      <path d="M38 58 Q60 106 82 58 Q72 74 60 74 Q48 74 38 58 Z" fill="#ff7043"/>
      <circle cx="52" cy="54" r="3" fill="#3b2a5c"/><circle cx="68" cy="54" r="3" fill="#3b2a5c"/>
      <circle cx="46" cy="61" r="4" fill="#ff9e9e" opacity=".7"/><circle cx="74" cy="61" r="4" fill="#ff9e9e" opacity=".7"/>
      <path d="M53 65 Q60 71 67 65" stroke="#3b2a5c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="40" y="10" width="40" height="30" rx="3" fill="#2e7d32"/>
      <rect x="40" y="30" width="40" height="7" fill="#3e2723"/>
      <rect x="55" y="29" width="10" height="9" fill="none" stroke="#ffd54f" stroke-width="2.5"/>
      <rect x="30" y="37" width="60" height="7" rx="3.5" fill="#1b5e20"/>
      <text x="72" y="24" font-size="12">🍀</text>
    </svg>`;

  function leprechaunDance(left = "50%") {
    const el = spawn(`<div class="stage">${LEPRECHAUN_SVG}</div>`, "dancer", { left, marginLeft: "-75px" }, 3100);
    const stage = el.firstElementChild;
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const c = document.createElement("span");
        c.className = "coin";
        c.textContent = pick(["🪙", "🍀", "🪙"]);
        c.style.left = 40 + Math.random() * 60 + "px";
        c.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
        stage.appendChild(c);
        setTimeout(() => c.remove(), 1100);
      }, 300 + i * 220);
    }
    return el;
  }

  function banner(text) {
    const b = $("#banner");
    b.textContent = text;
    b.classList.remove("show");
    void b.offsetWidth;
    b.classList.add("show");
  }

  const cheers = ["Yay!", "Super!", "Woo-hoo!", "Amazing!", "You did it!", "Awesome!", "Great job!"];
  function celebrateCard() {
    sfx.ding();
    confetti(40);
    const show = pick([unicornDance, leprechaunDance, shootingStars]);
    show();
    banner(pick(cheers));
  }
  function celebrateSection() {
    sfx.fanfare();
    heartRain();
    shootingStars(9);
    setTimeout(() => unicornDance("28%"), 200);
    setTimeout(() => leprechaunDance("72%"), 600);
    setTimeout(() => confetti(80), 900);
    banner("Perfect! 💖");
  }

  /* ---------- Game state ---------- */
  const state = {
    age: 3,
    levelIndex: 0,
    cards: [],
    cardIndex: 0,
    attempts: 0,
    results: [], // per card: "first" | "helped" | "missed"
    busy: false,
    run: 0, // bumps whenever we leave a card, cancelling any running flow
  };
  const track = () => TRACKS[state.age];
  const level = () => track().levels[state.levelIndex];
  const card = () => state.cards[state.cardIndex];
  const canListen = () => !!Recognition && progress.mic;

  function buildCards(lv) {
    return lv.words.map(([word, emoji, parts, alts = []]) => ({
      word, emoji, alts, blend: lv.blend,
      parts: parts.split("|").map((chunk, i) => {
        const [text, spoken] = chunk.split("=");
        return { text, spoken: spoken || (i === 0 && text === lv.blend ? lv.sound : CHUNK_SOUNDS[text] || text) };
      }),
    }));
  }

  /* ---------- Screens ---------- */
  function show(id) {
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    $("#btn-home").hidden = id === "screen-home";
    window.scrollTo(0, 0);
  }

  function leavePlay() {
    state.run++;
    state.busy = false;
    stopListening();
    if (synth) synth.cancel();
  }

  function renderHome() {
    leavePlay();
    $("#star-total").textContent = totalStars();
    for (const age of [3, 6]) {
      const lv = TRACKS[age].levels;
      const done = lv.filter((_, i) => starsFor(age, i) > 0).length;
      $(`[data-progress="${age}"]`).textContent = done ? `${done} / ${lv.length} levels done` : `${lv.length} levels`;
    }
    const note = $("#mic-note");
    if (!Recognition) {
      note.hidden = false;
      note.textContent = "This browser can't listen, so a grown-up taps ✓ when the word is right. (Chrome, Edge or Safari can listen.)";
    } else note.hidden = true;
    show("screen-home");
  }

  function renderMap(age) {
    leavePlay();
    state.age = age;
    const t = track();
    $("#map-title").textContent = `${t.mascot} ${t.name}`;
    $("#map-tagline").textContent = t.tagline;
    const path = $("#level-path");
    path.innerHTML = "";
    const firstOpen = t.levels.findIndex((_, i) => isUnlocked(age, i) && !starsFor(age, i));
    t.levels.forEach((lv, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      const open = isUnlocked(age, i);
      const s = starsFor(age, i);
      btn.className = "level-btn" + (open ? "" : " locked") + (i === firstOpen ? " current" : "");
      btn.innerHTML = `<span class="lvl-blend">${open ? lv.blend : "🔒"}</span>
        <span>Level ${i + 1}<span class="lvl-stars">${"⭐".repeat(s)}${"☆".repeat(3 - s)}</span></span>`;
      btn.onclick = () => {
        if (!open) { sfx.boop(); say("Finish the level before this one to open it!"); return; }
        startLevel(i);
      };
      li.appendChild(btn);
      path.appendChild(li);
    });
    show("screen-map");
  }

  async function startLevel(i) {
    leavePlay();
    state.levelIndex = i;
    state.cards = buildCards(level());
    state.cardIndex = 0;
    state.results = [];
    $("#screen-play").classList.toggle("age3", state.age === 3);
    $("#level-label").textContent = `${track().name} · Level ${i + 1}`;
    renderDots();
    $("#intro").hidden = false;
    $("#word").hidden = true;
    const lv = level();
    $("#intro-blend").textContent = lv.blend;
    $("#intro-examples").textContent = state.cards.map((c) => c.emoji).join(" ");
    show("screen-play");
    restartAnim($("#intro"));
    sayBlend();
  }

  function sayBlend() {
    const lv = level();
    return say(`This is ${lv.blend.split("").join(" ")}. It says, ${lv.sound}. ${lv.sound}! Like ${state.cards[0].word}.`);
  }

  function renderDots() {
    $("#dots").innerHTML = state.cards.map((_, i) => {
      const r = state.results[i];
      const cls = r ? (r === "missed" ? "miss" : "ok") : i === state.cardIndex && !$("#word").hidden ? "now" : "";
      return `<i class="${cls}"></i>`;
    }).join("");
  }

  function restartAnim(el) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }

  function showCard() {
    state.run++;
    state.attempts = 0;
    state.busy = false;
    const c = card();
    $("#intro").hidden = true;
    const wordEl = $("#word");
    wordEl.hidden = false;
    restartAnim(wordEl);

    const pic = $("#pic");
    pic.textContent = c.emoji;
    pic.classList.toggle("hidden-pic", !track().showPicture);
    pic.classList.remove("reveal");

    const rest = c.word.slice(c.blend.length);
    $("#word-text").innerHTML = `<span class="b">${c.blend}</span>${rest}`;
    $("#word-text").hidden = false;
    $("#sound-out").hidden = true;
    setBubble(state.age === 3 ? "What is this? Tap Play!" : "Can you read this word? Tap Play!");
    $("#mic").hidden = true;
    $("#btn-play").disabled = false;
    $("#btn-play").textContent = "▶ Play";
    renderDots();
  }

  function setBubble(text, mood = "") {
    const b = $("#bubble");
    b.textContent = text;
    b.className = "bubble " + mood;
  }

  function revealPicture() {
    const pic = $("#pic");
    if (pic.classList.contains("hidden-pic")) {
      pic.classList.remove("hidden-pic");
      pic.classList.add("reveal");
    }
  }

  /* ---------- Card flow ---------- */
  async function play() {
    if (state.busy) return;
    state.busy = true;
    const run = state.run;
    const alive = () => run === state.run;
    const c = card();
    $("#btn-play").disabled = true;

    const prompt = state.attempts === 0
      ? (state.age === 3 ? `What is this? It starts with ${c.parts[0].spoken}.` : "Read this word out loud!")
      : "Your turn! Say the word.";
    setBubble(state.attempts === 0 ? "👂 Listen..." : "Your turn!");
    await say(prompt);
    if (!alive()) return;

    if (!canListen()) {
      setBubble("Say it out loud! Grown-up, tap ✓ or 🧩 below.");
      state.busy = false;
      $("#btn-play").disabled = false;
      $("#btn-play").textContent = "▶ Play again";
      return;
    }

    $("#mic").hidden = false;
    setBubble("🎤 I'm listening... say it now!");
    const result = await listen((t) => heardWord(t, c), state.attempts === 0 ? 6000 : 9000);
    $("#mic").hidden = true;
    if (!alive()) return;
    state.busy = false;

    if (result.status === "match") return correct();
    if (result.status === "denied") {
      progress.mic = false;
      save();
      setBubble("Mic is blocked, so a grown-up can tap ✓ or 🧩 below.", "oops");
      $("#btn-play").disabled = false;
      return;
    }
    if (result.status === "silent" || result.status === "error") {
      sfx.pop();
      setBubble("I didn't hear you! Tap Play and say it nice and loud. 📣", "oops");
      await say("I didn't hear you! Tap play and say it nice and loud.");
      if (alive()) $("#btn-play").disabled = false;
      return;
    }
    wrong(result.heard);
  }

  async function correct() {
    const run = ++state.run;
    state.busy = true;
    stopListening();
    $("#mic").hidden = true;
    $("#btn-play").disabled = true;
    state.results[state.cardIndex] = state.attempts === 0 ? "first" : "helped";
    renderDots();
    revealPicture();
    setBubble(`🎉 Yes! "${card().word}"!`, "good");
    celebrateCard();
    await say(`${pick(cheers)} ${card().word}!`, { pitch: 1.35 });
    await wait(1400);
    if (run !== state.run) return;
    nextCard();
  }

  async function wrong(heard) {
    const run = ++state.run;
    const alive = () => run === state.run;
    state.busy = true;
    state.attempts++;
    sfx.boop();
    $("#btn-play").disabled = true;

    if (state.attempts >= 3) {
      state.results[state.cardIndex] = "missed";
      renderDots();
      revealPicture();
      setBubble(`Good try! This word is "${card().word}". 💪`, "oops");
      await say(`Good try! This word is ${card().word}. ${card().word}. We'll get it next time!`);
      await wait(800);
      if (alive()) nextCard();
      return;
    }

    const heardBit = heard ? ` I heard "${heard.split(/\s+/).slice(-2).join(" ")}".` : "";
    setBubble(`Almost!${heardBit} Let's sound it out! 🧩`, "oops");
    await say("Almost! Let's sound it out together.");
    if (!alive()) return;
    await soundOut(alive);
    if (!alive()) return;
    state.busy = false;
    $("#btn-play").disabled = false;
    $("#btn-play").textContent = "🎤 My turn!";
    if (state.age === 6 && state.attempts >= 2) revealPicture();
    if (canListen()) play();
    else setBubble("Now you try! Grown-up, tap ✓ when it's right.");
  }

  async function soundOut(alive = () => true) {
    const c = card();
    const box = $("#sound-out");
    box.innerHTML = "";
    const tiles = c.parts.map((p, i) => {
      const b = document.createElement("button");
      b.textContent = p.text;
      if (i === 0) b.className = "b";
      b.onclick = () => { sfx.pop(); say(p.spoken, { rate: 0.7 }); };
      box.appendChild(b);
      return b;
    });
    $("#word-text").hidden = true;
    box.hidden = false;
    setBubble("Say each sound with me... 🧩");

    for (let i = 0; i < c.parts.length; i++) {
      if (!alive()) return;
      tiles.forEach((t, j) => t.classList.toggle("lit", j === i));
      sfx.pop();
      await say(c.parts[i].spoken, { rate: 0.65 });
      await wait(250);
    }
    if (!alive()) return;
    tiles.forEach((t) => t.classList.add("lit"));
    await say(c.word, { rate: 0.55 });
    await wait(200);
    if (!alive()) return;
    tiles.forEach((t) => t.classList.remove("lit"));
    await say(`${c.word}!`);
  }

  function nextCard() {
    state.cardIndex++;
    if (state.cardIndex >= state.cards.length) return finishLevel();
    showCard();
  }

  function finishLevel() {
    leavePlay();
    const r = state.results;
    const allRight = r.every((x) => x !== "missed");
    const firstTry = r.filter((x) => x === "first").length;
    const stars = allRight ? (firstTry === r.length ? 3 : 2) : 1;
    const prev = starsFor(state.age, state.levelIndex);
    progress.stars[state.age][state.levelIndex] = Math.max(prev, stars);
    save();
    $("#star-total").textContent = totalStars();

    const t = track();
    const isLast = state.levelIndex === t.levels.length - 1;
    $("#results-emoji").textContent = allRight ? pick(["🦄", "🌈", "🏆", "🍀"]) : "🌟";
    $("#results-title").textContent = allRight ? `You read all the ${level().blend} words!` : "Great practice!";
    $("#results-stars").innerHTML = [1, 2, 3].map((n) => `<span class="${n <= stars ? "" : "off"}">⭐</span>`).join("");
    $("#results-words").innerHTML = state.cards.map((c, i) =>
      `<li class="${r[i] === "missed" ? "miss" : ""}">${c.emoji} ${c.word} ${r[i] === "missed" ? "🔁" : "✅"}</li>`).join("");

    let msg = allRight ? "Every card done right!" : "Play again to get every word!";
    if (isLast) msg += state.age === 3 ? " You finished Little Stars! Ready for Super Readers? 🚀" : " You finished every level! You're a Super Reader! 🏆";
    $("#results-msg").textContent = msg;

    const next = $("#btn-next");
    if (isLast) next.textContent = state.age === 3 ? "Super Readers 🚀" : "All levels 🗺️";
    else next.textContent = "Next level ➜";

    show("screen-results");
    if (allRight) {
      celebrateSection();
      say(`Perfect! You got every ${level().blend.split("").join(" ")} word! Hooray!`, { pitch: 1.35 });
    } else {
      confetti(50);
      sfx.ding();
      say("Great practice! Let's try again to get them all.");
    }
  }

  /* ---------- Wiring ---------- */
  $$(".age-card").forEach((b) => (b.onclick = () => { sfx.pop(); renderMap(+b.dataset.age); }));
  $("#btn-home").onclick = renderHome;
  $("#btn-hear-blend").onclick = sayBlend;
  $("#btn-start-words").onclick = () => { if (synth) synth.cancel(); sfx.pop(); showCard(); };
  $("#btn-play").onclick = () => { stopListening(); state.busy = false; play(); };
  $("#btn-hear-word").onclick = () => say(card().word, { rate: 0.75 });
  $("#btn-judge-yes").onclick = () => correct();
  $("#btn-judge-help").onclick = () => { stopListening(); wrong(""); };
  $("#btn-replay").onclick = () => startLevel(state.levelIndex);
  $("#btn-next").onclick = () => {
    const t = track();
    if (state.levelIndex < t.levels.length - 1) startLevel(state.levelIndex + 1);
    else renderMap(6); // Little Stars graduates to Super Readers
  };

  // Grown-up settings
  const dlg = $("#settings");
  $("#btn-settings").onclick = () => {
    $("#opt-mic").checked = progress.mic;
    $("#opt-mic").disabled = !Recognition;
    $("#opt-unlock").checked = progress.unlockAll;
    $("#opt-sfx").checked = progress.sfx;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  };
  $("#opt-mic").onchange = (e) => { progress.mic = e.target.checked; save(); };
  $("#opt-sfx").onchange = (e) => { progress.sfx = e.target.checked; save(); };
  $("#opt-unlock").onchange = (e) => {
    progress.unlockAll = e.target.checked;
    save();
    if ($("#screen-map").classList.contains("active")) renderMap(state.age);
  };
  $("#btn-reset").onclick = () => {
    if (!confirm("Erase all stars and start over?")) return;
    progress.stars = { 3: {}, 6: {} };
    save();
    dlg.close();
    renderHome();
  };

  // Drifting background friends
  const sky = $("#sky");
  ["☁️", "✨", "☁️", "🌈", "☁️", "⭐"].forEach((e, i) => {
    const s = document.createElement("span");
    s.textContent = e;
    s.style.top = 6 + i * 15 + "%";
    s.style.animationDuration = 28 + i * 7 + "s";
    s.style.animationDelay = -i * 9 + "s";
    sky.appendChild(s);
  });

  // Test hook so the matcher can be checked from the console.
  window.BlendBuddies = { heardWord, buildCards, state, celebrateCard, celebrateSection };

  renderHome();
})();
