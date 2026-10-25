# WaveMusic

A **complete music streaming frontend** built with plain **HTML5, CSS3 and vanilla JavaScript** — no React, no Vue, no Bootstrap, no Tailwind, no build step, no npm install.

It is an **original design** inspired by the *feel* of modern music apps (dark theme, rounded cards, fixed bottom player, soft gradients) but it copies **no** branding, logos, layouts or assets. Every artist, album, song, playlist and piece of artwork in this project is **fictional and generated for this repo**.

Open `index.html` in a browser (or use VS Code Live Server) and you get a working music app: home feed, search, library, playlists, albums, artist pages, a queue, a Now Playing overlay and a fully working bottom player — including a **demo mode** that keeps everything interactive even before you add a single mp3 file.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Folder structure](#2-folder-structure)
3. [How to run it](#3-how-to-run-it)
4. [Features](#4-features)
5. [Adding your own audio files](#5-adding-your-own-audio-files)
6. [Replacing the album artwork](#6-replacing-the-album-artwork)
7. [Customising the songs, artists and playlists](#7-customising-the-songs-artists-and-playlists)
8. [Changing the look (colours, fonts, branding)](#8-changing-the-look)
9. [How the code is organised](#9-how-the-code-is-organised)
10. [Responsive design notes](#10-responsive-design-notes)
11. [Accessibility & performance](#11-accessibility--performance)
12. [Optional developer tools](#12-optional-developer-tools)
13. [Copyright & originality](#13-copyright--originality)
14. [Future improvements](#14-future-improvements)
15. [Credits](#15-credits)

---

## 1. Project overview

| | |
|---|---|
| **Name** | WaveMusic |
| **Type** | Frontend portfolio project (static site) |
| **Stack** | HTML5 · CSS3 · vanilla JavaScript (ES5/ES6, no frameworks) |
| **Build step** | None. Open the file and it runs. |
| **Dependencies** | None. No CDN, no npm packages, no external fonts required. |
| **Works offline** | Yes — including the artwork, which is generated SVG stored in the repo. |
| **Author** | Muhamad Hazim Aqil — Diploma in Software Engineering, German-Malaysian Institute |

---

## 2. Folder structure

```
wavemusic/
├── index.html                  # The whole app shell (sidebar, header, player, overlays)
├── README.md                   # This file
│
├── css/
│   └── style.css               # All styling: variables, layout, components, responsive
│
├── js/
│   ├── data.js                 # ⭐ ALL the content: songs, artists, albums, playlists, palettes
│   ├── app.js                  # ⭐ The app: views, router, player logic, event handling
│   ├── art.js                  # Cover-art helpers + the broken-image fallback
│   └── icons.js                # The SVG icon sprite (59 hand-written icons)
│
├── assets/
│   ├── images/
│   │   ├── avatar.svg          # Profile picture placeholder
│   │   ├── default-cover.svg   # Fallback "nothing playing" artwork
│   │   └── app-icon.svg        # Favicon / app icon
│   │
│   ├── albums/                 # One folder per album, each with cover.svg
│   │   ├── neon-skies/cover.svg
│   │   ├── city-lights/cover.svg
│   │   ├── night-drive/cover.svg
│   │   ├── paper-moons/cover.svg
│   │   ├── coastal-blues/cover.svg
│   │   ├── slow-motion/cover.svg
│   │   ├── solar-flare/cover.svg
│   │   ├── velvet-room/cover.svg
│   │   ├── quiet-hours/cover.svg
│   │   ├── static-bloom/cover.svg
│   │   └── <single>/cover.svg  # 6 single covers live here too
│   │
│   ├── artists/                # One folder per artist: cover.svg + hero.svg
│   │   ├── nova-lane/cover.svg
│   │   ├── nova-lane/hero.svg
│   │   └── ... (12 artists)
│   │
│   ├── playlists/              # Playlist + mix covers
│   │   ├── chill-vibes/cover.svg
│   │   └── ... (15 playlists/mixes)
│   │
│   └── audio/                  # MP3 Files
│       └── README.txt
│
└── docs/                       # Optional tools — the website does not need these
    ├── build-art.js            # Regenerates all 58 placeholder covers
    └── verify-logic.js         # Runs the real app code in Node and asserts 90 behaviours
```

Total: **8 hand-written files** (1 HTML, 1 CSS, 4 JS, README, audio note) + **58 generated covers**.

---

## 3. How to run it

### Option A — just open it (fastest)

Double-click `index.html`. That is it. The app works from `file://`.

> Note: when you open the page directly from disk, some browsers block `localStorage`. That only affects remembering your likes/volume between visits — everything else works normally.

### Option B — VS Code Live Server (recommended)

1. Install **Visual Studio Code**.
2. Install the extension **Live Server** (by Ritwick Dey).
3. Open the `wavemusic` folder in VS Code: `File → Open Folder…`
4. Right-click `index.html` → **Open with Live Server**.
5. Your browser opens `http://127.0.0.1:5500/index.html` and reloads automatically when you save a file.

### Option C — any static server

```bash
# Python (already installed on most machines)
python -m http.server 8000

# or Node
npx serve .
```

Then visit `http://localhost:8000`.

---

## 4. Features

**Layout**
- Left sidebar navigation with original branding, active-state highlighting and a scrollable "Your Playlists" list.
- Sticky top header with back / forward, search, notifications, profile avatar and a profile dropdown (Profile · Settings · Upgrade · Log out).
- Fixed bottom music player in three sections (now-playing · transport + progress · queue & volume).
- Now Playing overlay with large artwork (full-screen on mobile) and a slide-in queue panel.

**Pages / views**
- **Home** — dynamic greeting ("Good morning / afternoon / evening"), Recently Played row, Made For You mixes, Popular Albums grid and a Trending Songs table.
- **Search** — big search box, 12 gradient category cards, and live filtering across songs, artists, albums, playlists and genres as you type.
- **Category** — genre page with its own hero, play/shuffle and the matching songs and albums.
- **Library** — tabs for Playlists / Artists / Albums with saved content.
- **Liked Songs** — your saved tracks with total duration.
- **Recently Played** — the albums you opened, newest first.
- **Playlist / Mix** — large cover, description, creator, song count, total duration, Play / Shuffle / Save / Share and a full track table (`# · Title · Album · Date Added · Duration`).
- **Album** — artwork, artist, year, genre, count, total duration, credits and "more by this artist".
- **Artist** — big hero image, verified badge, monthly listeners, Follow button, Popular Songs, Albums, Singles, Fans Also Like and an About block.

**Player**
- Play, pause, next, previous, shuffle, repeat (off → all → one).
- Draggable progress bar (pointer + keyboard), live current-time / duration.
- Volume slider, mute/unmute, queue panel, device button.
- Clicking any row in a track list starts playback from that point in the list.
- Media Session metadata (so your OS / lock screen shows the track).
- Everything persists: likes, volume, shuffle, repeat and history live in `localStorage`.

**Extras**
- Keyboard shortcuts: `Space` play/pause, `/` focus search, `Shift + →` next, `Shift + ←` previous, `Esc` close overlays.
- Toast notifications, hover animations, page-transition animation, `prefers-reduced-motion` support.
- Demo mode: if an audio file is missing the UI still plays (a timer drives the playhead) and a small **Demo** badge appears in the player.

---

## 5. Adding your own audio files

The app looks for one file per song, named after the song's **id**:

```
assets/audio/1.mp3      →  song id 1  "Midnight Drive"
assets/audio/2.mp3      →  song id 2  "Neon Skies"
assets/audio/3.mp3      →  song id 3  "Paper Satellites"
...
assets/audio/64.mp3     →  song id 64 "Wildfire"
```

### Steps

1. Get some royalty-free music (see the suggestions below). Do **not** commit copyrighted songs.
2. Rename each file to the matching song id: `1.mp3`, `2.mp3`, `3.mp3`, …
3. Drop them into the `assets/audio/` folder.
4. Reload the page and press play. The **Demo** badge disappears as soon as a real file loads.

You do **not** have to add all 64. If a file is missing, that song simply plays in demo mode — the rest of the app is unaffected. Songs 1–12 are the ones featured on the home page.

### Where the path comes from

In `js/data.js` each song is created by a small factory:

```js
function song(id, title, artist, album, coverKey, duration, year, genre, plays) {
  return {
    id,
    title,
    artist,
    album,
    cover: coverKey,
    audio: "assets/audio/" + id + ".mp3",   // the audio file path rule
    duration,
    year,
    genre,
    plays
  };
}
```

Change that one line if you prefer a different naming scheme, e.g. `"assets/audio/" + id + ".ogg"` or `"assets/audio/song" + id + ".mp3"`.

### Prefer different file names per song?

Open `js/data.js`, find the song, and set `audio` manually after the array is built — for example, right below the `SONGS` array:

```js
getSong(1).audio = "assets/audio/midnight-drive.mp3";
```

### Free music sources

- **Free Music Archive** — https://freemusicarchive.org
- **Incompetech (Kevin MacLeod)** — https://incompetech.com/music/royalty-free/
- **Pixabay Music** — https://pixabay.com/music/
- **YouTube Audio Library** — https://studio.youtube.com (Audio Library tab)

Check each track's licence before you publish your portfolio.

---

## 6. Replacing the album artwork

Every cover currently comes from a generated **SVG** file. The paths are built in `js/data.js`:

```js
function albumCover(slug)    { return "assets/albums/"    + slug + "/cover.svg"; }
function artistCover(slug)   { return "assets/artists/"   + slug + "/cover.svg"; }
function artistHero(slug)    { return "assets/artists/"   + slug + "/hero.svg";  }
function playlistCover(slug) { return "assets/playlists/" + slug + "/cover.svg"; }
```

`slug` is the item's folder name (for albums it is also the album's `id`, e.g. `neon-skies`).

### Easiest method — same file name

Put your image in the same folder as the placeholder and give it the **same name**:

```
assets/albums/neon-skies/cover.svg   ← delete or keep this
assets/albums/neon-skies/cover.jpg   ← your artwork
```

Then change the extension in just the helpers above (`cover.svg` → `cover.jpg`). One edit switches every album at once, because they all use the same helper.

### Per-item method

Prefer a different name per album? Change the helper to take a full path, or edit the one line per item:

```js
{ id: "neon-skies", title: "Neon Skies", artist: "nova-lane", year: 2024, … }
```

and set the cover explicitly where the app builds it, or simply rename your files to `cover.jpg` inside each album folder.

### Recommended image sizes

| Where it appears | Size | Ratio |
|---|---|---|
| Album / playlist cover, player thumbnail, row thumbnail | 640 × 640 px | 1:1 |
| Artist portrait (round) | 640 × 640 px | 1:1 |
| Artist hero banner | 1600 × 700 px | ~2.3:1 |
| Profile avatar | 256 × 256 px | 1:1 |

Keep each file under ~250 KB (export JPG at quality 80, or WebP) so the page stays fast.

### If an image is missing

Nothing breaks. `js/art.js` listens for the image `error` event and swaps in a generated gradient placeholder, so you never see a broken-image icon:

```js
function onCoverError(img, text) { … img.src = placeholderDataUri(text); }
```

### Regenerating the placeholders

If you change a palette in `js/data.js` and want the placeholder covers to match:

```bash
node docs/build-art.js
```

This rewrites all 58 SVG files (artist `hero.svg` banners are drawn wide, 1600 × 700, with no text baked in). (Requires Node.js. The app itself never needs Node.)

---

## 7. Customising the songs, artists and playlists

**Everything lives in `js/data.js`.** You do not need to touch `app.js` to change content.

### Add a song

```js
song(65, "New Song Title", "nova-lane", "neon-skies", "neon-skies", "3:24", 2025, "Dream Pop", "120,400"),
```

| Argument | Meaning |
|---|---|
| `65` | unique id — also the audio file name (`assets/audio/65.mp3`) |
| `"New Song Title"` | title shown everywhere |
| `"nova-lane"` | artist id (must exist in `ARTISTS`) |
| `"neon-skies"` | album id, or `null` for a single |
| `"neon-skies"` | cover folder name (used for the artwork + gradient) |
| `"3:24"` | duration shown in lists (the real length comes from the mp3) |
| `2025` | release year |
| `"Dream Pop"` | genre — this is what the Search categories match on |
| `"120,400"` | play count, shown in the "Plays" column |

Then add the id to the album so it appears on the album page:

```js
{ id: "neon-skies", …, tracks: [1, 2, 3, 4, 5, 65] }
```

### Add an artist

```js
{ id: "your-artist", name: "Your Artist", monthly: "1,204,880", verified: true, genre: "Alt Pop" },
```

Add a cover and hero image at `assets/artists/your-artist/cover.svg` and `hero.svg`.

### Add a playlist

```js
{
  id: "my-playlist", title: "My Playlist", slug: "my-playlist",
  owner: "You", description: "What this playlist is about.",
  tracks: [1, 6, 22, 37]
}
```

`slug` is the artwork folder: `assets/playlists/my-playlist/cover.svg`.

### Colours

`PALETTES` at the top of `js/data.js` drives both the generated artwork and the gradient shown behind each cover:

```js
neonSkies: "#7c5cff | #2a1a6e | #ff5ca8",   // primary | deep shadow | highlight
```

`paletteForCover()` converts a folder slug (`neon-skies`) into the matching palette key (`neonSkies`), so naming them consistently is all you have to remember.

---

## 8. Changing the look

### Colours, spacing, motion — `css/style.css`

Everything is a CSS variable in the `:root` block at the top:

```css
:root {
  --bg-app: #08080a;
  --bg-main: #0f0f13;
  --bg-card: #17171d;
  --text-primary: #ffffff;
  --text-secondary: #a9a9b8;
  --accent: #25d8a4;          /* mint  — primary accent  */
  --accent-2: #7c5cff;        /* violet                  */
  --accent-3: #ff5ca8;        /* pink                    */

  --sidebar-w: 268px;
  --player-h: 92px;
  --r-lg: 20px;
  --dur: 240ms;
  --font-sans: "Inter", "Segoe UI", system-ui, sans-serif;
}
```

Want a purple app instead of mint? Change `--accent` to e.g. `#a78bfa`. Everything (buttons, sliders, active nav, progress bar, glow) follows automatically.

### Brand name

It appears in three places:
- `index.html` — the `<title>` and the `.brand-name` span in the sidebar.
- `js/app.js` — nothing to change (the app reads all its labels from `data.js`).
- `js/data.js` — the `PALETTES.brand` colour and the "WAVEMUSIC" text baked into generated covers (re-run `node docs/build-art.js` after changing it).

### Fonts

The design uses a modern **system font stack** so the project works fully offline. If you want the Inter webfont, uncomment the two Google Fonts lines in the `<head>` of `index.html`.

### Your own icons

Replace or add icons in the `ICON_SPRITE` object in `js/icons.js`. Anywhere in the app you can then write `<i data-icon="your-icon"></i>`, or call `icon("your-icon")` inside a template string.

---

## 9. How the code is organised

```
index.html        →  the never-changing shell:
                     sidebar · topbar · <main id="view"> · player · Now Playing · queue · mobile nav
js/data.js        →  content + helpers (getSong, songsOfAlbum, totalDurationText, …)
js/icons.js       →  icon sprite + icon() / upgradeIcons()
js/art.js         →  coverArt(), gradientFor(), onCoverError()
js/app.js         →  state → router → views → builders → player → events → init
```

`js/app.js` is split into 11 numbered sections with a header comment for each:

```
 1. STATE + SMALL HELPERS      - the app's memory, time and number formatting
 2. PERSISTENCE (localStorage) - remembers likes, volume, shuffle, repeat, history
 3. AUDIO ENGINE               - the <audio> element and "demo mode"
 4. PLAYER CONTROLS            - play, pause, next, prev, shuffle, repeat
 5. PLAYER UI                  - progress bar, volume, Now Playing overlay
 6. QUEUE PANEL
 7. REUSABLE HTML BUILDERS     - mediaCard(), buildTrackTable(), detailHero(), …
 8. VIEWS                      - one function per page, each returns an HTML string
 9. ROUTER                     - showing views, history stack, active nav state
10. GLOBAL EVENT HANDLING      - ONE click listener for the whole app
11. STARTUP                    - what happens on page load
```

### The two ideas that make the code short

**1. Views are just strings.** Every page is a function that *returns* HTML:

```js
function viewAlbum(albumId) {
  const album = getAlbum(albumId);
  if (!album) return notFound("album");

  const ids = songsOfAlbum(albumId).map((s) => s.id);

  return "<section>" +
      detailHero({ … }) +
      buildTrackTable(ids, { context: album.title, show: { index: true, title: true, … } }) +
    "</section>";
}
```

The router drops that string into `<main id="view">` and calls `upgradeIcons()` to swap the `<i data-icon>` placeholders for real SVG.

**2. One click listener for everything.** Buttons carry a `data-action` attribute and a single document-level listener decides what to do:

```html
<button data-action="play-collection" data-ids="1,2,3" data-label="Chill Vibes">Play</button>
```

```js
document.addEventListener("click", function (event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  handleAction(el.dataset.action, el, event);
});
```

That is why re-rendering a page never leaks event listeners — there are none to leak.

### Demo mode (why it works without mp3 files)

```js
audio.play().then(…)          // a real file loaded
            .catch(…)         // no file → enterDemoPlayback()
```

In demo mode a 250 ms timer advances `state.demoSeconds`, so the progress bar, timers, next/prev, repeat and the Now Playing overlay all behave exactly as they would with real audio.

---

## 10. Responsive design notes

| Breakpoint | What changes |
|---|---|
| **> 1120px** | Full desktop layout: fixed sidebar, 3-column player, volume slider visible. |
| **≤ 1120px** | Sidebar becomes an off-canvas drawer (hamburger + backdrop); player becomes 2 columns; device button hidden. |
| **≤ 900px** | Bottom navigation appears; the player turns into a mini bar (progress row hidden, tap the artwork for the full player); hero artwork stacks; Plays/Date columns hide. |
| **≤ 640px** | Search box in the header hides on the Search page (the big box is there); player keeps only artwork + transport + queue; single-column track tables; Now Playing becomes a full-screen sheet. |
| **≤ 400px** | Card and row sizes shrink further; mobile nav labels get smaller. |

Guarantees: `overflow-x: hidden` on `body`, `min-width: 0` on every flex/grid child, `aspect-ratio` on art so nothing jumps, `env(safe-area-inset-bottom)` so the mobile nav clears the home indicator on modern phones.

---

## 11. Accessibility & performance

**Accessibility**
- Semantic landmarks (`aside`, `header`, `main`, `footer`, `nav`) with `aria-label`s.
- Real `<button>` elements everywhere, with `title`/`aria-label` on icon-only buttons.
- The progress bars are `role="slider"` with `tabindex="0"` and Left/Right arrow seeking.
- Visible `:focus-visible` outline in the accent colour.
- Toasts use `role="status" aria-live="polite"`; overlays use `aria-hidden` and are closed with `Esc`.
- `prefers-reduced-motion: reduce` disables animations and transitions.

**Performance**
- No frameworks, no CDN, no network requests: one HTML, one CSS, four small JS files.
- All artwork is local SVG (tiny, crisp at any size) with `loading="lazy"` on list images.
- Icon markup is injected once as an SVG `<symbol>` sprite and reused with `<use>`.
- CSS transitions only (no JS animation loops) except the demo-mode timer.

---

## 12. Optional developer tools

These are **not needed** to run the website. They are in `docs/` so the app folder stays clean. Both require [Node.js](https://nodejs.org).

```bash
# Re-generate all 58 placeholder covers from the palettes in js/data.js
node docs/build-art.js

# Run 90 automated checks against the real app code in a headless DOM
node docs/verify-logic.js
```

`verify-logic.js` loads `js/icons.js`, `js/art.js`, `js/data.js` and `js/app.js` into a small DOM shim and checks that every view renders, the router works, the player state machine behaves, the data is consistent and every referenced artwork file exists on disk. Expected last line:

```
90 passed / 0 failed / 90 total
```

---

## 13. Copyright & originality

- **No** Spotify, Apple Music or any other brand's logo, name, icon or trade dress is used.
- **No** copyrighted album art, artist photos or song files are included.
- All 12 artists, 10 albums, 6 singles, 64 songs, 9 playlists, 6 mixes and 12 categories are **invented for this project**.
- The WaveMusic mark, colour palette, icon set and all 58 covers are original, generated in this repository by `docs/build-art.js`.
- The layout is a common, functional music-app pattern (sidebar + content + bottom player). It is not a pixel copy of any product.

If you publish this, replace the placeholder profile (Alex Rivera) and add your own name to the footer/README.

---

## 14. Future improvements

Ideas if you want to keep extending this project:

- [ ] **Real backend / API** — swap `js/data.js` for `fetch()` calls to a JSON file or an API such as the iTunes Search API or MusicBrainz.
- [ ] **Real login** — replace the frontend-only profile dropdown with auth.
- [ ] **Drag to reorder the queue** with the HTML5 Drag and Drop API.
- [ ] **Persist the queue** in `localStorage` so a reload resumes your session.
- [ ] **Crossfade** between tracks with the Web Audio API `GainNode`.
- [ ] **Lyrics view** with timed highlighting.
- [ ] **Waveform seek bar** drawn on a `<canvas>`.
- [ ] **Search debouncing** and a loading skeleton for slower APIs.
- [ ] **Service worker** for offline caching (making it a PWA).
- [ ] **Light theme** toggle by swapping the `:root` variables.
- [ ] **Vitest / Playwright** test suite built on top of `docs/verify-logic.js`.
- [ ] **Deploy** to GitHub Pages or Netlify (nothing to configure — it is static).

---

## 15. Credits

- Design, code and all generated artwork: original work for this project.
- Icons: hand-written SVG paths in `js/icons.js` (no third-party icon font required). Lucide-style 24px line icons were the visual reference.
- Fonts: the system font stack by default; Inter is an optional Google Font.

**Licence:** free to use as a learning resource and in your portfolio. Please do not re-publish it as a paid template, and do not add copyrighted music or artwork to it.
