// Word lists for Blend Buddies.
//
// Each level teaches one blend and tests it with four words.
//   blend : the letters shown on the intro card
//   sound : what the voice says for the blend on its own
//   words : [word, emoji, parts, alts?]
//     parts : how the word is split when sounding it out. Each chunk is
//             "text" or "text=spoken", where spoken is a hint for the
//             speech voice (e.g. "i=ih" so it says the short i sound).
//     alts  : other spellings the speech recogniser may return that should
//             still count as correct (homophones, digits, etc).

const TRACKS = {
  3: {
    name: "Little Stars",
    tagline: "Ages 3+ · look at the picture and say it!",
    mascot: "🦄",
    showPicture: true,
    levels: [
      { blend: "sh", sound: "shhh", words: [
        ["ship", "🚢", "sh|i=ih|p"],
        ["shoe", "👟", "sh|oe=oo", ["shoo", "shoes"]],
        ["sheep", "🐑", "sh|ee|p"],
        ["shell", "🐚", "sh|e=eh|ll"],
      ]},
      { blend: "ch", sound: "chuh", words: [
        ["chick", "🐥", "ch|i=ih|ck"],
        ["cheese", "🧀", "ch|ee|se=zzz"],
        ["chair", "🪑", "ch|air"],
        ["cherry", "🍒", "ch|e=eh|rr|y=ee"],
      ]},
      { blend: "th", sound: "thuh", words: [
        ["thumb", "👍", "th|u=uh|mb=mmm"],
        ["three", "3️⃣", "thr=thruh|ee", ["3"]],
        ["thunder", "⛈️", "th|u=uh|n|der"],
        ["think", "🤔", "th|i=ih|nk=nk"],
      ]},
      { blend: "wh", sound: "wuh", words: [
        ["whale", "🐳", "wh|a=ay|le=l", ["wail", "whales"]],
        ["wheel", "🛞", "wh|ee|l", ["we'll", "wheels"]],
        ["white", "🤍", "wh|i=eye|te=t", ["wight"]],
        ["whisper", "🤫", "wh|i=ih|s|per"],
      ]},
      { blend: "bl", sound: "bluh", words: [
        ["blue", "🔵", "bl|ue=oo", ["blew"]],
        ["block", "🧱", "bl|o=aw|ck", ["blocks"]],
        ["blow", "🌬️", "bl|ow=oh"],
        ["blueberry", "🫐", "bl|ue=oo|ber|ry=ee", ["blueberries"]],
      ]},
      { blend: "fr", sound: "fruh", words: [
        ["frog", "🐸", "fr|o=aw|g"],
        ["fries", "🍟", "fr|ie=eye|s=zzz", ["fry", "fried"]],
        ["fruit", "🍉", "fr|ui=oo|t"],
        ["frown", "☹️", "fr|ow|n"],
      ]},
      { blend: "st", sound: "stuh", words: [
        ["star", "⭐", "st|ar"],
        ["stop", "🛑", "st|o=aw|p"],
        ["stone", "🪨", "st|o=oh|ne=n"],
        ["steam", "♨️", "st|ea=ee|m"],
      ]},
      { blend: "sn", sound: "snuh", words: [
        ["snake", "🐍", "sn|a=ay|ke=k"],
        ["snail", "🐌", "sn|ai=ay|l"],
        ["snow", "❄️", "sn|ow=oh"],
        ["snowman", "⛄", "sn|ow=oh|m|a=ah|n"],
      ]},
    ],
  },

  6: {
    name: "Super Readers",
    tagline: "Ages 6+ · read the word out loud!",
    mascot: "🚀",
    showPicture: false,
    levels: [
      { blend: "sh", sound: "shhh", words: [
        ["shark", "🦈", "sh|ar|k"],
        ["shadow", "👥", "sh|a=ah|d|ow=oh"],
        ["shelf", "📚", "sh|e=eh|l|f"],
        ["shampoo", "🧴", "sh|am|p|oo"],
      ]},
      { blend: "ch", sound: "chuh", words: [
        ["chicken", "🐔", "ch|i=ih|ck|en"],
        ["chocolate", "🍫", "ch|oc=awk|o=uh|late=lit"],
        ["champion", "🏆", "ch|am|pi=pee|on=un"],
        ["cheetah", "🐆", "ch|ee|t|ah=uh"],
      ]},
      { blend: "cl", sound: "cluh", words: [
        ["clock", "🕐", "cl|o=aw|ck"],
        ["cloud", "☁️", "cl|ou=ow|d"],
        ["clown", "🤡", "cl|ow|n"],
        ["clap", "👏", "cl|a=ah|p"],
      ]},
      { blend: "gr", sound: "gruh", words: [
        ["grape", "🍇", "gr|a=ay|pe=p", ["grapes"]],
        ["grass", "🌱", "gr|a=ah|ss"],
        ["green", "💚", "gr|ee|n"],
        ["grumpy", "😠", "gr|u=uh|m|p|y=ee"],
      ]},
      { blend: "tr", sound: "truh", words: [
        ["train", "🚂", "tr|ai=ay|n"],
        ["truck", "🚚", "tr|u=uh|ck"],
        ["tree", "🌳", "tr|ee"],
        ["trumpet", "🎺", "tr|u=uh|m|p|et=it"],
      ]},
      { blend: "sp", sound: "spuh", words: [
        ["spider", "🕷️", "sp|i=eye|der"],
        ["spoon", "🥄", "sp|oo|n"],
        ["space", "🚀", "sp|a=ay|ce=sss"],
        ["sparkle", "✨", "sp|ar|k|le=ul"],
      ]},
      { blend: "fl", sound: "fluh", words: [
        ["flower", "🌸", "fl|ow|er"],
        ["flag", "🚩", "fl|a=ah|g"],
        ["flute", "🪈", "fl|u=oo|te=t"],
        ["flamingo", "🦩", "fl|a=uh|min|go"],
      ]},
      { blend: "th", sound: "thuh", words: [
        ["thunder", "⛈️", "th|u=uh|n|der"],
        ["thirsty", "🥤", "th|ir=er|s|ty=tee"],
        ["thermometer", "🌡️", "th|er|mom|e=uh|ter"],
        ["thumbtack", "📌", "th|u=uh|mb=m|t|a=ah|ck"],
      ]},
      { blend: "str", sound: "struh", words: [
        ["street", "🛣️", "str|ee|t"],
        ["string", "🧶", "str|i=ih|ng"],
        ["strawberry", "🍓", "str|aw|ber|ry=ee", ["strawberries"]],
        ["strong", "💪", "str|o=aw|ng"],
      ]},
      { blend: "thr", sound: "thruh", words: [
        ["throne", "👑", "thr|o=oh|ne=n", ["thrown"]],
        ["throw", "🥏", "thr|ow=oh"],
        ["throat", "🗣️", "thr|oa=oh|t"],
        ["thread", "🧵", "thr|ea=eh|d"],
      ]},
      { blend: "scr", sound: "scruh", words: [
        ["scream", "😱", "scr|ea=ee|m"],
        ["screen", "🖥️", "scr|ee|n"],
        ["screw", "🔩", "scr|ew=oo"],
        ["scroll", "📜", "scr|o=oh|ll"],
      ]},
      { blend: "spl", sound: "spluh", words: [
        ["splash", "💦", "spl|a=ah|sh"],
        ["split", "🍌", "spl|i=ih|t"],
        ["splinter", "🪵", "spl|i=ih|n|ter"],
        ["splendid", "🌟", "spl|e=eh|n|did"],
      ]},
    ],
  },
};

// How the voice should say common letter chunks when sounding out.
const CHUNK_SOUNDS = {
  b: "buh", c: "kuh", ck: "kuh", k: "kuh", d: "duh", f: "fff", g: "guh",
  h: "huh", j: "juh", l: "luh", ll: "luh", m: "mmm", n: "nnn", p: "puh",
  r: "ruh", rr: "ruh", s: "sss", ss: "sss", t: "tuh", v: "vuh", w: "wuh",
  y: "yuh", z: "zzz", ng: "ng", sh: "shhh",
  a: "ah", e: "eh", i: "ih", o: "aw", u: "uh",
  ee: "ee", ea: "ee", ai: "ay", oo: "oo", ar: "ar", er: "er", ow: "ow",
};
