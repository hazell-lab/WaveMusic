/* makes the placeholder cover art, so the project never relies on outside images.
   it reads the palettes from js/data.js and writes one svg per album, artist,
   playlist, mix and single.

   run it with:  node docs/build-art.js */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(ROOT, "js", "data.js");
const OUT_DIRS = {
  album: path.join(ROOT, "assets", "albums"),
  artist: path.join(ROOT, "assets", "artists"),
  playlist: path.join(ROOT, "assets", "playlists"),
  image: path.join(ROOT, "assets", "images")
};

// read the palette block out of data.js
function readPalettes() {
  const text = fs.readFileSync(DATA_FILE, "utf8");
  const start = text.indexOf("const PALETTES");
  if (start === -1) throw new Error("could not find the PALETTES block in js/data.js");
  const bodyStart = text.indexOf("{", start);
  const end = text.indexOf("};", bodyStart);
  const objectText = text.slice(bodyStart, end + 1);

  const raw = new Function("return " + objectText + ";")();

  const table = {};
  Object.keys(raw).forEach((key) => {
    const colours = String(raw[key])
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (colours.length >= 2) table[key] = colours;
  });
  return table;
}

const PALETTES = readPalettes();

// same text always gives the same number
function seedOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// make a colour see-through, like "#7c5cff80"
function alpha(hex, a) {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");
  return hex + v;
}

// waveform bars along the bottom
function bars(seed) {
  let out = "";
  const count = 42;
  const w = 260 / count;
  for (let i = 0; i < count; i++) {
    const n = ((seed >>> (i % 24)) ^ (i * 2654435761)) >>> 0;
    const h = 9 + (n % 60);
    const x = 30 + i * w;
    const y = 224 + (60 - h);
    out +=
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(w * 0.55).toFixed(2)}" ` +
      `height="${h}" rx="2.4" fill="#ffffff" opacity="0.22"/>`;
  }
  return `<g>${out}</g>`;
}

// rings
function circles(seed, c1, c2) {
  const parts = [];
  const count = 3 + (seed % 3);
  for (let i = 0; i < count; i++) {
    const cx = 70 + (((seed >> (i * 3)) % 220) | 0);
    const cy = 120 + (((seed >> (i * 5)) % 160) | 0);
    const r = 40 + ((seed >> (i * 2)) % 90);
    const stroke = i % 2 === 0 ? "#ffffff" : c1;
    const dash = i % 2 === 0 ? "" : ' stroke-dasharray="11 9"';
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${alpha(
        stroke,
        i % 2 === 0 ? 0.24 : 0.45
      )}" stroke-width="${i % 2 === 0 ? 2 : 5}"${dash}/>`
    );
  }
  parts.push(
    `<circle cx="200" cy="182" r="34" fill="${alpha(c2, 0.85)}"/>`,
    `<circle cx="200" cy="182" r="12" fill="#ffffff" opacity="0.9"/>`
  );
  return `<g>${parts.join("")}</g>`;
}

// diagonal stripes
function stripes(seed, c1, c2) {
  const parts = [];
  for (let i = -2; i < 10; i++) {
    const x = i * 62 + (seed % 24);
    const sw = 12 + ((seed >> (i + 3)) % 26);
    const col = i % 3 === 0 ? c2 : "#ffffff";
    parts.push(
      `<rect x="${x}" y="-260" width="${sw}" height="900" fill="${col}" opacity="${
        i % 3 === 0 ? 0.4 : 0.13
      }" transform="rotate(24 256 256)"/>`
    );
  }
  parts.push(`<circle cx="176" cy="196" r="76" fill="#ffffff" opacity="0.1"/>`);
  return `<g>${parts.join("")}</g>`;
}

// rounded squares
function squares(seed, c1, c2) {
  const parts = [];
  for (let i = 4; i >= 0; i--) {
    const size = 226 - i * 40;
    const x = 66 + i * 16 + (seed % 14);
    const y = 78 + i * 22;
    const col = i % 2 === 0 ? "#ffffff" : c1;
    parts.push(
      `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${
        18 + i * 4
      }" fill="${col}" opacity="${i % 2 === 0 ? 0.13 : 0.34}" 
        transform="rotate(${(seed % 18) - 9} 256 256)"/>`
    );
  }
  parts.push(`<circle cx="150" cy="300" r="30" fill="${alpha(c2, 0.9)}"/>`);
  return `<g>${parts.join("")}</g>`;
}

// soft blobs
function blobs(seed, c1, c2) {
  return `<g>
    <ellipse cx="150" cy="140" rx="185" ry="150" fill="#ffffff" opacity="0.12"/>
    <ellipse cx="392" cy="352" rx="170" ry="145" fill="${alpha(c2, 0.85)}"/>
    <ellipse cx="392" cy="352" rx="80" ry="70" fill="#ffffff" opacity="0.14"/>
    <circle cx="352" cy="140" r="58" fill="${alpha(c1, 0.6)}"/>
    <ellipse cx="120" cy="372" rx="120" ry="86" fill="#000000" opacity="0.14"/>
  </g>`;
}

// stacked waves
function waves(seed, c1, c2) {
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const y = 232 + i * 40;
    const amp = 30 - i * 6;
    const d = `M -20 ${y} C 80 ${y - amp}, 160 ${y + amp}, 256 ${y} S 432 ${
      y - amp
    }, 560 ${y}`;
    parts.push(
      `<path d="${d}" fill="none" stroke="${
        i === 1 ? c2 : "#ffffff"
      }" stroke-width="${8 - i * 2}" opacity="${0.5 - i * 0.1}" stroke-linecap="round"/>`
    );
  }
  parts.push(
    `<circle cx="256" cy="176" r="98" fill="none" stroke="${alpha(
      "#ffffff",
      0.22
    )}" stroke-width="16"/>`,
    `<circle cx="256" cy="176" r="46" fill="${alpha(c1, 0.75)}"/>`
  );
  return `<g>${parts.join("")}</g>`;
}

const STYLES = { circles, stripes, squares, blobs, waves };
const STYLE_NAMES = ["circles", "stripes", "squares", "blobs", "waves"];

// one cover, as svg text
function buildCover(key, text, uid) {
  const palette = PALETTES[key] || ["#7c5cff", "#2a1a6e", "#ff5ca8"];
  const c1 = palette[0];
  const c2 = palette[1];
  const c3 = palette[2] || palette[0];

  const seed = seedOf(key + text);
  const family = STYLE_NAMES[seed % STYLE_NAMES.length];
  const angle = 18 + (seed % 130);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="${text}">
  <defs>
    <linearGradient id="bg${uid}" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="0.55" stop-color="${c2}"/>
      <stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow${uid}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="0.7" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg${uid})"/>
  <circle cx="392" cy="104" r="230" fill="url(#glow${uid})"/>
  ${STYLES[family](seed, c1, c2)}
  ${bars(seed)}
  <rect y="286" width="512" height="226" fill="#000000" opacity="0.24"/>
  <text x="30" y="352" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="36" font-weight="800" letter-spacing="1" fill="#ffffff">${text}</text>
  <text x="30" y="307" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="16" font-weight="600" letter-spacing="5" fill="#ffffff" opacity="0.72">WAVEMUSIC</text>
  <rect x="30" y="376" width="52" height="5" rx="2.5" fill="#ffffff" opacity="0.85"/>
  <rect x="30" y="452" width="452" height="4" rx="2" fill="#ffffff" opacity="0.16"/>
</svg>
`;
}

// a wide artist banner (1600 x 700). no text is baked in, because the artist
// page already prints the name on top of it.
function buildHero(key, text, uid) {
  const palette = PALETTES[key] || ["#7c5cff", "#2a1a6e", "#ff5ca8"];
  const c1 = palette[0];
  const c2 = palette[1];
  const c3 = palette[2] || palette[0];

  const seed = seedOf(key + text);
  const family = STYLE_NAMES[seed % STYLE_NAMES.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 700" width="1600" height="700" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${text}">
  <defs>
    <linearGradient id="bg${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c2}"/>
      <stop offset="0.6" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow${uid}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="0.7" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="700" fill="url(#bg${uid})"/>
  <circle cx="1240" cy="150" r="520" fill="url(#glow${uid})"/>
  <g transform="translate(860 -110) scale(1.55)">${STYLES[family](seed, c1, c2)}</g>
  <g transform="translate(-40 210) scale(3.3 1.6)" opacity="0.8">${bars(seed)}</g>
</svg>
`;
}

// every svg file we want to make
function makeJobs() {
  const jobs = [];

  // albums
  const albums = [
    { key: "neonSkies", title: "Neon Skies", slug: "neon-skies" },
    { key: "cityLights", title: "City Lights", slug: "city-lights" },
    { key: "nightDrive", title: "Night Drive", slug: "night-drive" },
    { key: "paperMoons", title: "Paper Moons", slug: "paper-moons" },
    { key: "coastalBlues", title: "Coastal Blues", slug: "coastal-blues" },
    { key: "slowMotion", title: "Slow Motion", slug: "slow-motion" },
    { key: "solarFlare", title: "Solar Flare", slug: "solar-flare" },
    { key: "velvetRoom", title: "Velvet Room", slug: "velvet-room" },
    { key: "quietHours", title: "Quiet Hours", slug: "quiet-hours" },
    { key: "staticBloom", title: "Static Bloom", slug: "static-bloom" }
  ];
  albums.forEach((a, i) => {
    jobs.push({
      dir: path.join(OUT_DIRS.album, a.slug),
      file: "cover.svg",
      key: a.key,
      text: a.title,
      uid: "a" + i
    });
  });

  // artists: a round cover and a wide hero
  const artists = [
    ["novaLane", "Nova Lane", "nova-lane"],
    ["ethanCole", "Ethan Cole", "ethan-cole"],
    ["lunaGrey", "Luna Grey", "luna-grey"],
    ["kaiRivers", "Kai Rivers", "kai-rivers"],
    ["miraSol", "Mira Sol", "mira-sol"],
    ["thePaperHearts", "The Paper Hearts", "the-paper-hearts"],
    ["dreVale", "Dre Vale", "dre-vale"],
    ["arianaWilde", "Ariana Wilde", "ariana-wilde"],
    ["solReed", "Sol Reed", "sol-reed"],
    ["ivyMonroe", "Ivy Monroe", "ivy-monroe"],
    ["noahBennett", "Noah Bennett", "noah-bennett"],
    ["zaidAmir", "Zaid Amir", "zaid-amir"]
  ];
  artists.forEach(([key, name, slug], i) => {
    const dir = path.join(OUT_DIRS.artist, slug);
    jobs.push({ dir, file: "cover.svg", key, text: name, uid: "r" + i });
    jobs.push({ dir, file: "hero.svg", key, text: name, uid: "h" + i, hero: true });
  });

  // playlists
  const playlists = [
    ["chillVibes", "Chill Vibes", "chill-vibes"],
    ["lateNightCoding", "Late Night Coding", "late-night-coding"],
    ["workoutMix", "Workout Mix", "workout-mix"],
    ["studySession", "Study Session", "study-session"],
    ["roadTrip", "Road Trip", "road-trip"],
    ["focusMode", "Focus Mode", "focus-mode"],
    ["gymEnergy", "Gym Energy", "gym-energy"],
    ["rainyNight", "Rainy Night", "rainy-night"],
    ["codingSession", "Coding Session", "coding-session"]
  ];
  playlists.forEach(([key, name, slug], i) => {
    jobs.push({
      dir: path.join(OUT_DIRS.playlist, slug),
      file: "cover.svg",
      key,
      text: name,
      uid: "p" + i
    });
  });

  // made for you mixes
  const mixes = [
    ["dailyMix01", "Daily Mix 01", "daily-mix-01"],
    ["dailyMix02", "Daily Mix 02", "daily-mix-02"],
    ["chillMix", "Chill Mix", "chill-mix"],
    ["focusMix", "Focus Mix", "focus-mix"],
    ["discoverMix", "Discover Mix", "discover-mix"],
    ["throwbackMix", "Throwback Mix", "throwback-mix"]
  ];
  mixes.forEach(([key, name, slug], i) => {
    jobs.push({
      dir: path.join(OUT_DIRS.playlist, slug),
      file: "cover.svg",
      key,
      text: name,
      uid: "m" + i
    });
  });

  // singles
  const singles = [
    ["afterglow", "Afterglow", "afterglow"],
    ["glassWaves", "Glass Waves", "glass-waves"],
    ["honeyStatic", "Honey Static", "honey-static"],
    ["northbound", "Northbound", "northbound"],
    ["paperPlanes", "Paper Planes", "paper-planes"],
    ["wildflower", "Wildflower", "wildflower"]
  ];
  singles.forEach(([key, name, slug], i) => {
    jobs.push({
      dir: path.join(OUT_DIRS.album, slug),
      file: "cover.svg",
      key,
      text: name,
      uid: "s" + i
    });
  });

  // profile avatar, app icon and the fallback cover
  jobs.push({ dir: OUT_DIRS.image, file: "avatar.svg", key: "profile", text: "HAZIM AQIL", uid: "u1" });
  jobs.push({ dir: OUT_DIRS.image, file: "default-cover.svg", key: "waves", text: "WAVEMUSIC", uid: "u2" });
  jobs.push({ dir: OUT_DIRS.image, file: "app-icon.svg", key: "brand", text: "WAVE", uid: "u3" });

  return jobs;
}

// write them all out
function run() {
  const jobs = makeJobs();
  let written = 0;

  jobs.forEach((job) => {
    fs.mkdirSync(job.dir, { recursive: true });
    const svg = job.hero ? buildHero(job.key, job.text, job.uid) : buildCover(job.key, job.text, job.uid);
    fs.writeFileSync(path.join(job.dir, job.file), svg, "utf8");
    written++;
  });

  console.log("WaveMusic artwork generated");
  console.log("  palettes found in js/data.js : " + Object.keys(PALETTES).length);
  console.log("  svg files written           : " + written);
  console.log("  output folders              : assets/albums, assets/artists, assets/playlists, assets/images");
}

run();
