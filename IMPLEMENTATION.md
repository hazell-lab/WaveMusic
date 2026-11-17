# WaveMusic 2.0: implementation notes

This file covers how the WaveMusic 2.0 redesign was done: what the old app was like, what changed and why, how it was tested, and what is still limited. For running and using the app, see [README.md](README.md).

---

## 1. Assessment of the previous version

The 1.x app worked and used real data. Its 63 songs played real 30-second Apple previews with real artwork. But most of the app lived in a few large files, and several features only pretended to work.

| Area | What was there |
|---|---|
| Code layout | `js/app.js` (1,895 lines) held routing, rendering, the player, the queue, the library and every event handler. `css/style.css` was a single 2,728-line file. `js/data.js` (589 lines) and `js/icons.js` / `js/art.js` sat beside it. |
| State | Global mutable variables, with the whole view re-rendered after most changes. The queue and the playback position were not saved. |
| Fake features | A profile menu with a made-up user, a notifications panel, a "devices" picker, made-up release dates and credits, and likes that were seeded with 12 songs on first visit. There was also an offline "demo mode" that moved a progress bar on a timer without any audio. |
| Audio | One `<audio>` element, which was right. But a slow `play()` promise from an earlier track could still change the state, and a failed preview could stop playback with no clear way forward. |
| Tests | `docs/verify-logic.js`, a hand-written harness with 95 checks that ran the old code in a fake DOM. It passed before the rewrite. Because it was tied to the old globals, it was replaced by real unit tests. |
| Look | A dark theme with rounded cards, soft gradients and a sidebar-plus-bottom-bar layout, close to the general look of the big streaming apps. |

Kept from 1.x: the catalogue (the same 63 songs, Apple track ids, albums and artists), the iTunes lookup approach and its cache key (`wavemusic.apple.v1`, so existing caches still work), the hash URLs (`#album/<id>`, `#artist/<id>` and so on, so old links still open), Media Session support, real likes from earlier visits, and the MIT licence.

---

## 2. Design: "Immersive Audio Experience"

The goal was a look led by artwork that doesn't read as a Spotify or Apple Music clone and avoids generic dashboard styling.

- **Editorial type.** Large serif titles (the system's Iowan, Palatino or Georgia), a sans for reading text and a monospaced font for small labels, times and counts. No web fonts are downloaded.
- **Palette.** Warm near-black "ink" backgrounds, warm off-white "paper" text and a single amber signal colour (`#ffab40`) for the active state, progress and the main play button. A soft tint taken from the current album's palette fades behind the player. It animates through `@property --tint` and is turned off when reduced motion is set.
- **Artwork carries the colour.** Album covers are large and square, and sit on thin rules instead of inside cards. Collection and mix covers are generated as record-groove SVGs with the title set in serif, so they look like they belong to the app rather than to stock photography.
- **The player as an object.** On desktop the right-hand "deck" holds the large artwork, title, a status lamp (idle, loading, playing, paused, error), a long seek bar, the transport with a 64 px play button, volume and the up-next queue. It is always visible, so playing music never covers the content.
- **Layout by width.**
  - At 1100 px and wider: content plus the deck column (360 px, or 340 px below 1320 px).
  - From 720 to 1099 px: one column. A mini player opens a sheet, which is a two-column layout on landscape tablets.
  - Below 720 px: a shorter masthead, a bottom tab bar (Listen, Browse, Library), a 64 px mini player and a full-screen sheet.
- **Restrained motion.** A short fade and rise when a page changes, artwork fading in as it loads, an equaliser on the playing row and a spinner while loading. That is all, and all of it is turned off under `prefers-reduced-motion`.
- **Avoided on purpose:** glassmorphism, glows, large gradients, rounded cards everywhere, and fake social features.

---

## 3. Features

See [README.md › Features](README.md#features) for the full list. In short: a complete player, a queue you can edit, likes, follows, your own playlists, history, search with filters, ten kinds of page and keyboard shortcuts. All of it works on real data. No button is a placeholder.

Removed because they were fake: the profile menu, notifications, devices, demo mode, made-up dates and credits, and the seeded likes. Old likes are migrated only if they differ from that seeded list, so real likes are kept and the fake ones are dropped.

---

## 4. Architecture

```
main.js ──► router ──► views/*        (render html strings for a route)
   │                      │
   │                      └─► ui/track-list, ui/artwork, views/parts
   │
   ├─► player/player.js ──► audio-engine ──► <audio>
   │        │                 queue (pure)
   │        └──────────────► media-session
   ├─► ui/player-ui.js   (deck, mini player, sheet; subscribes to player state)
   ├─► library/library.js ──► library-ops (pure)
   ├─► data/apple.js     (catalogue loading state)
   └─► ui/overlays, ui/keyboard
```

- **Stores.** `core/store.js` is a small observable with `get`, `set` and `subscribe`. There are three stores: the player state, the library and the catalogue status. The views and the player UI subscribe to them. Nothing else holds state that changes.
- **Pure logic is kept apart from the DOM.** The queue (`player/queue.js`), library operations (`library/library-ops.js`), search and formatting are pure functions with no DOM, so they can be tested directly in Node.
- **Audio engine and player controller.** `audio-engine.js` only knows about one `<audio>` element. It turns its events into a small set of statuses and protects every load with a token. `player.js` handles the queue, repeat, shuffle, skipping failed tracks, saving the session and Media Session. Tests swap in a fake audio element.
- **Rendering.** Views return HTML strings built with an `html` tagged template. It escapes every value unless the value is marked `raw`, so user text such as playlist names can never inject markup. A route change renders the view once. Smaller changes, like the playing row, like buttons and unavailable tracks, are patched in place by `track-list.js` helpers, so the page isn't rebuilt.
- **One click handler.** `main.js` has one delegated listener and an `ACTIONS` map keyed by `data-action`. Elements are never wired one by one, so there is no listener cleanup to get wrong when views are replaced.
- **Progress without re-rendering.** `player-ui.js` runs a `requestAnimationFrame` loop only while audio is playing and the tab is visible. The loop writes the seek value, the `--fill` custom property, the time text and the mini progress bar directly.
- **Routing.** `router.js` parses `#name/arg`, falls back to Listen (with a toast) for unknown routes and moves focus to the new page's heading. When the same page re-renders, for example after a library change, it keeps the scroll position and puts focus back on the same control.

---

## 5. Key decisions

| Decision | Reason |
|---|---|
| Stay on vanilla ES modules, no framework or bundler | The brief said not to migrate frameworks or add dependencies. Native modules let the same files run in the browser and in Node tests. |
| One `<audio>` element plus load tokens | Two tracks can never play at once, and slow promises from an old track can't change the current one. |
| Restore the session paused | Browsers block autoplay without a user gesture. Resuming paused at the saved position is honest and dependable. |
| Skip failed tracks, but stop after one full pass | A single dead preview shouldn't end the listening session, but a dead network shouldn't cause an endless skip loop either. |
| Shuffle keeps the original order | Turning shuffle off returns you to the album or list order, with the current song still playing. |
| Remove fake features instead of polishing them | The brief forbids made-up data and buttons that don't work. |
| Artist pages use album art with a caption | The API has no artist photos. Inventing one would be fake, so the page says which album the image is from. |
| A native `<dialog>` and `inert` | Focus trapping, Esc and background blocking come from the platform instead of custom code. |
| Container query units for the tile play button | The button lines up with the bottom of the square artwork at any tile width, without JavaScript. |

---

## 6. Tests

`npm test` runs 50 tests with `node --test`. All 50 pass on Node 24.15.0. The tests use:

- `tests/helpers.js`: `FakeAudio`, an `EventTarget` whose `play()` can resolve, reject with `NotAllowedError`, hang or fail with a media error; an in-memory storage backend; a silent Media Session; and a seeded random function so shuffle tests are repeatable.
- Coverage by file: queue (10), audio engine (9), player (14), library (7), search and catalogue consistency (7), Apple loader (3). See the [README table](README.md#tests) for what each covers.

Also run:
- `node --check` on all 37 JavaScript files under `js/`, `scripts/` and `tests/`: no syntax errors.
- A search for `TODO`, `FIXME` and `XXX` in `js/`, `css/`, `scripts/`, `tests/` and `index.html`: none found.

Not covered by automated tests: DOM rendering and CSS. These were checked by hand in a browser (see section 8).

---

## 7. Build

`npm run build` copies the static app into `dist/` and checks 100 local references: module imports, stylesheet and script links, image paths and the cover of every collection. Last result: 49 files, 249 KB, all references found. `dist/` was then served with `npm run preview` and loaded in the browser with no console errors, no broken images and real audio playing.

`npm run zip` writes a zip file using only Node's built-in zlib. A test archive was checked with Python's `zipfile.testzip()`: no CRC errors, and no `.git`, `.claude`, `dist` or `node_modules` entries.

---

## 8. Browser QA

Done by hand in the Chromium-based browser built into the Claude desktop app, against the dev server and, for the screenshots, the `dist/` build. Phone and tablet sizes used viewport emulation, not real devices.

**Checked at desktop size** (the controls at the pane's own desktop width; page width and routes again at 1440 × 900 and 1280 × 800)
- No sideways scrolling at 1440 or 1280 on Listen, Browse, a genre page, an album, an artist, Library, Liked, Recently played and a collection.
- The catalogue loaded with all 63 previews returned (`missing: 0`), and real audio played.
- Each control was used and its result checked in the page state:
  - next, previous, and previous restarting after 3 seconds;
  - pause and resume, and seeking to a chosen time;
  - volume, mute and unmute;
  - shuffle on and off, and repeat off → all → one → off;
  - a track ending and moving on to the next.
- An invalid audio URL was forced. The error state and toast appeared, and the player moved on to the next track.
- Media Session metadata (title, artist, album, artwork) and `playbackState` were set.
- Track menu, with the keyboard: Arrow Down and Enter opened and used it, Esc closed it, and focus went back to the button. "Add to queue" and "Play next" put the track in the right place.
- Queue: move up, move down and remove changed the up-next order and count. Clear emptied up next and kept the current track playing.
- Playlists:
  - creating one with an empty name showed the error;
  - a name with HTML (`Late <b>drive</b>`) was saved and shown as plain text;
  - deleting showed a confirmation with focus on Cancel, then removed the playlist from storage and returned to Library.
- Following an artist updated the button (`aria-pressed`) and the Library page.
- Keyboard shortcuts: `/` focused search and moved to Browse while typing continued. `?` opened the shortcuts dialog with all 11 entries.
- Searching "rose" found ROSÉ and her songs. The type and genre filters, the empty-results state and the reset button all worked.
- After a reload, the session came back paused, with the same track, position, volume and queue.
- 16 page addresses, covering all ten routes, rendered with the heading focused and no console errors. Unknown routes fell back to Listen.

**Checked at tablet size (820)**
- No sideways scrolling.
- The mini player opened the sheet as a modal: the page behind it became inert and focus moved to Close. Esc closed it and returned focus to the mini player.
- A fix was made for the album track grid at this size.

**Checked at phone size (390 × 844)**
- Listen, The Chart, Browse, a genre page, an album, an artist, Library, Liked, Recently played and a collection.
- The window stayed 390 px wide on every one of these pages. Only the filter chips scroll sideways, as intended.
- The full-screen player sheet; moving and removing items in the queue from the sheet.

**Bugs found and fixed during QA**
1. Opening a dialog from another dialog showed an empty dialog. The old dialog's close event was clearing the new content.
2. Dialogs focused the Cancel button first instead of the input.
3. Reset on the empty search state did not put focus back in the search field.
4. Album track rows had the wrong column layout between 720 and 1099 px.
5. Tile play buttons were placed with conflicting rules. They now use container query units.
6. The mini play button lost its amber fill on phones.
7. On phones, the Browse page made the whole page 928 px wide. A `<fieldset>` has `min-inline-size: min-content` by default, so the filter row that doesn't wrap pushed the layout wider. Fixed with `min-width: 0`. An earlier overflow check had missed this because it compared against the already stretched window width, so the check was changed and every page was checked again.

---

## 9. Limitations and honest notes

- Only 30-second previews, because that is what the public API provides.
- Needs the internet for audio and artwork. If the catalogue fails, the app shows an error with a retry button. There is no fake playback.
- The catalogue is fixed at 63 songs. Search covers that catalogue, not the whole Apple Music library.
- Library data stays in one browser's `localStorage`, with no account or sync.
- No artist photos, because the API doesn't provide them.
- iOS ignores `audio.volume`, so the volume slider does nothing there. Mute still works.
- Media Session was checked through its JavaScript state in Chromium. Physical media keys and phone lock screens were not tested.
- Screen readers were not tested with real assistive technology. The ARIA roles, labels, focus order and live regions were checked by reading the DOM and using the keyboard.
- Only one browser engine (Chromium) was used. Firefox and Safari were not tested.
- The page has to be served over HTTP or HTTPS, because ES modules don't load from `file://`.
- The README screenshots were taken in the desktop app's browser pane. Its device scaling made the desktop image 800 × 500 (a scaled 1440 × 900 layout) and the phone images 488 × 1055 (a 390 × 844 layout).
