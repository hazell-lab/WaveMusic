// the static catalogue: artists, albums, singles, songs and curated collections.
// songs store their apple music track id. previews and artwork are looked up
// at runtime by data/apple.js, so no audio or artwork files live in the repo.

// [primary, deep, highlight] colours, used for tints before artwork loads
export const PALETTES = {
  brand: ["#ff9f43", "#2a1a0c", "#f2ece2"],

  "after-hours": ["#e11d48", "#3b0712", "#f59e0b"],
  midnights: ["#6366f1", "#1e1b4b", "#a5b4fc"],
  "future-nostalgia": ["#f472b6", "#4c1d95", "#fde047"],
  "hit-me-hard-and-soft": ["#38bdf8", "#0c2f5a", "#1e3a8a"],
  divide: ["#22d3ee", "#0e4f63", "#a5f3fc"],
  "24k-magic": ["#a78bfa", "#2e1065", "#fbbf24"],
  sos: ["#60a5fa", "#0f2a4a", "#e2e8f0"],
  damn: ["#ef4444", "#450a0a", "#f5f5f4"],
  "a-rush-of-blood": ["#f59e0b", "#1c1917", "#38bdf8"],
  am: ["#a1a1aa", "#09090b", "#e4e4e7"],
  "random-access-memories": ["#d4d4d8", "#18181b", "#fbbf24"],
  true: ["#fb923c", "#3b1a07", "#fde68a"],
  "get-up": ["#93c5fd", "#1e3a8a", "#fbcfe8"],
  "come-away-with-me": ["#d6a77a", "#3f2a1a", "#fde68a"],
  bewitched: ["#fca5a5", "#4c1d2e", "#93c5fd"],
  "una-mattina": ["#e5e7eb", "#1f2937", "#9ca3af"],
  sour: ["#c084fc", "#3b0764", "#f9a8d4"],
  evolve: ["#fb923c", "#431407", "#38bdf8"],
  chapters: ["#f9a8d4", "#500724", "#fde68a"],

  espresso: ["#facc15", "#713f12", "#38bdf8"],
  "good-luck-babe": ["#f472b6", "#500724", "#fecaca"],
  "beautiful-things": ["#94a3b8", "#0f172a", "#fde68a"],
  apt: ["#fb7185", "#4c0519", "#fda4af"],
  "die-with-a-smile": ["#e5e7eb", "#111827", "#f87171"],
  "not-like-us": ["#4ade80", "#052e16", "#fafafa"],

  pop: ["#ff6f91", "#3d1023", "#ffd166"],
  rock: ["#ef4444", "#1c1917", "#f97316"],
  "hip-hop": ["#facc15", "#3f2d0b", "#ef4444"],
  "r-and-b": ["#a78bfa", "#2e1065", "#f472b6"],
  "k-pop": ["#f9a8d4", "#4c1d95", "#93c5fd"],
  dance: ["#f97316", "#7c2d12", "#facc15"],
  electronic: ["#22d3ee", "#0c4a6e", "#a78bfa"],
  alternative: ["#38bdf8", "#0f172a", "#a78bfa"],
  jazz: ["#d6a77a", "#3f2a1a", "#fde68a"],
  classical: ["#e5e7eb", "#1f2937", "#a5b4fc"],

  "chill-vibes": ["#8b7cf6", "#1d1640", "#ffb3c7"],
  "late-night-coding": ["#5b6cf0", "#0f1230", "#5eead4"],
  "workout-mix": ["#ff4d6d", "#3a0a10", "#ffd166"],
  "study-session": ["#b5a1f5", "#24204d", "#a5f3fc"],
  "road-trip": ["#f59e0b", "#3d1a07", "#7dd3fc"],
  "focus-mode": ["#34d399", "#06302a", "#c4b5fd"],
  "gym-energy": ["#ef4444", "#2e0909", "#fb923c"],
  "rainy-night": ["#60a5fa", "#141c2b", "#c4b5fd"],
  "coding-session": ["#22d3ee", "#082a3a", "#a78bfa"],
  "daily-mix-01": ["#a78bfa", "#221d4f", "#ff8fb1"],
  "daily-mix-02": ["#2dd4bf", "#06302a", "#7dd3fc"],
  "chill-mix": ["#a5b4fc", "#1f2150", "#f0abfc"],
  "focus-mix": ["#22d3ee", "#073b4a", "#a78bfa"],
  "discover-mix": ["#fb7185", "#3f0d12", "#ffd166"],
  "throwback-mix": ["#f59e0b", "#3b1d06", "#ef4444"]
};

// artists. "cover" names the album or single whose artwork represents them,
// because the itunes api does not provide artist photos.
export const ARTISTS = [
  { id: "the-weeknd", name: "The Weeknd", genre: "R&B", cover: "after-hours" },
  { id: "taylor-swift", name: "Taylor Swift", genre: "Pop", cover: "midnights" },
  { id: "dua-lipa", name: "Dua Lipa", genre: "Dance", cover: "future-nostalgia" },
  { id: "billie-eilish", name: "Billie Eilish", genre: "Alternative", cover: "hit-me-hard-and-soft" },
  { id: "ed-sheeran", name: "Ed Sheeran", genre: "Pop", cover: "divide" },
  { id: "bruno-mars", name: "Bruno Mars", genre: "R&B", cover: "24k-magic" },
  { id: "sza", name: "SZA", genre: "R&B", cover: "sos" },
  { id: "kendrick-lamar", name: "Kendrick Lamar", genre: "Hip Hop", cover: "damn" },
  { id: "coldplay", name: "Coldplay", genre: "Rock", cover: "a-rush-of-blood" },
  { id: "arctic-monkeys", name: "Arctic Monkeys", genre: "Rock", cover: "am" },
  { id: "daft-punk", name: "Daft Punk", genre: "Electronic", cover: "random-access-memories" },
  { id: "avicii", name: "Avicii", genre: "Dance", cover: "true" },
  { id: "newjeans", name: "NewJeans", genre: "K-Pop", cover: "get-up" },
  { id: "norah-jones", name: "Norah Jones", genre: "Jazz", cover: "come-away-with-me" },
  { id: "laufey", name: "Laufey", genre: "Jazz", cover: "bewitched" },
  { id: "ludovico-einaudi", name: "Ludovico Einaudi", genre: "Classical", cover: "una-mattina" },
  { id: "olivia-rodrigo", name: "Olivia Rodrigo", genre: "Pop", cover: "sour" },
  { id: "imagine-dragons", name: "Imagine Dragons", genre: "Rock", cover: "evolve" },
  { id: "yuna", name: "Yuna", genre: "R&B", cover: "chapters" },
  { id: "sabrina-carpenter", name: "Sabrina Carpenter", genre: "Pop", cover: "espresso" },
  { id: "chappell-roan", name: "Chappell Roan", genre: "Pop", cover: "good-luck-babe" },
  { id: "benson-boone", name: "Benson Boone", genre: "Pop", cover: "beautiful-things" },
  { id: "rose", name: "ROSÉ", genre: "K-Pop", cover: "apt" },
  { id: "lady-gaga", name: "Lady Gaga", genre: "Pop", cover: "die-with-a-smile" }
];

export const ALBUMS = [
  { id: "after-hours", title: "After Hours", artist: "the-weeknd", year: 2020, genre: "R&B", tracks: [1, 2, 3, 4] },
  { id: "midnights", title: "Midnights", artist: "taylor-swift", year: 2022, genre: "Pop", tracks: [5, 6, 7] },
  { id: "future-nostalgia", title: "Future Nostalgia", artist: "dua-lipa", year: 2020, genre: "Dance", tracks: [8, 9, 10] },
  { id: "hit-me-hard-and-soft", title: "HIT ME HARD AND SOFT", artist: "billie-eilish", year: 2024, genre: "Alternative", tracks: [11, 12, 13] },
  { id: "divide", title: "÷ (Divide)", artist: "ed-sheeran", year: 2017, genre: "Pop", tracks: [14, 15, 16] },
  { id: "24k-magic", title: "24K Magic", artist: "bruno-mars", year: 2016, genre: "R&B", tracks: [17, 18, 19] },
  { id: "sos", title: "SOS", artist: "sza", year: 2022, genre: "R&B", tracks: [20, 21, 22] },
  { id: "damn", title: "DAMN.", artist: "kendrick-lamar", year: 2017, genre: "Hip Hop", tracks: [23, 24, 25] },
  { id: "a-rush-of-blood", title: "A Rush of Blood to the Head", artist: "coldplay", year: 2002, genre: "Rock", tracks: [26, 27, 28] },
  { id: "am", title: "AM", artist: "arctic-monkeys", year: 2013, genre: "Rock", tracks: [29, 30, 31] },
  { id: "random-access-memories", title: "Random Access Memories", artist: "daft-punk", year: 2013, genre: "Electronic", tracks: [32, 33, 34] },
  { id: "true", title: "True", artist: "avicii", year: 2013, genre: "Dance", tracks: [35, 36, 37] },
  { id: "get-up", title: "Get Up", artist: "newjeans", year: 2023, genre: "K-Pop", tracks: [38, 39, 40] },
  { id: "come-away-with-me", title: "Come Away with Me", artist: "norah-jones", year: 2002, genre: "Jazz", tracks: [41, 42, 43] },
  { id: "bewitched", title: "Bewitched", artist: "laufey", year: 2023, genre: "Jazz", tracks: [44, 45, 46] },
  { id: "una-mattina", title: "Una Mattina", artist: "ludovico-einaudi", year: 2004, genre: "Classical", tracks: [47, 48] },
  { id: "sour", title: "SOUR", artist: "olivia-rodrigo", year: 2021, genre: "Pop", tracks: [49, 50, 51] },
  { id: "evolve", title: "Evolve", artist: "imagine-dragons", year: 2017, genre: "Rock", tracks: [52, 53, 54] },
  { id: "chapters", title: "Chapters", artist: "yuna", year: 2016, genre: "R&B", tracks: [55, 56, 57] }
];

export const SINGLES = [
  { id: "espresso", title: "Espresso", artist: "sabrina-carpenter", year: 2024, song: 58 },
  { id: "good-luck-babe", title: "Good Luck, Babe!", artist: "chappell-roan", year: 2024, song: 59 },
  { id: "beautiful-things", title: "Beautiful Things", artist: "benson-boone", year: 2024, song: 60 },
  { id: "apt", title: "APT.", artist: "rose", year: 2024, song: 61 },
  { id: "die-with-a-smile", title: "Die With A Smile", artist: "lady-gaga", year: 2024, song: 62 },
  { id: "not-like-us", title: "Not Like Us", artist: "kendrick-lamar", year: 2024, song: 63 }
];

// id, title, artist, album (null for a single), cover key, length, year, genre, apple track id
const SONG_ROWS = [
  [1, "Blinding Lights", "the-weeknd", "after-hours", "after-hours", "3:20", 2019, "R&B", 1499378607],
  [2, "Save Your Tears", "the-weeknd", "after-hours", "after-hours", "3:36", 2020, "R&B", 1499386369],
  [3, "In Your Eyes", "the-weeknd", "after-hours", "after-hours", "3:58", 2020, "R&B", 1499386363],
  [4, "Heartless", "the-weeknd", "after-hours", "after-hours", "3:18", 2019, "R&B", 1615102593],
  [5, "Anti-Hero", "taylor-swift", "midnights", "midnights", "3:21", 2022, "Pop", 1689131533],
  [6, "Lavender Haze", "taylor-swift", "midnights", "midnights", "3:22", 2022, "Pop", 1650859886],
  [7, "Karma (feat. Ice Spice)", "taylor-swift", "midnights", "midnights", "3:21", 2022, "Pop", 1689090494],
  [8, "Levitating", "dua-lipa", "future-nostalgia", "future-nostalgia", "3:24", 2020, "Dance", 1538003843],
  [9, "Don't Start Now", "dua-lipa", "future-nostalgia", "future-nostalgia", "3:03", 2019, "Dance", 1538003635],
  [10, "Physical", "dua-lipa", "future-nostalgia", "future-nostalgia", "3:14", 2020, "Dance", 1552269072],
  [11, "BIRDS OF A FEATHER", "billie-eilish", "hit-me-hard-and-soft", "hit-me-hard-and-soft", "3:30", 2024, "Alternative", 1739659142],
  [12, "LUNCH", "billie-eilish", "hit-me-hard-and-soft", "hit-me-hard-and-soft", "2:00", 2024, "Alternative", 1739659140],
  [13, "WILDFLOWER", "billie-eilish", "hit-me-hard-and-soft", "hit-me-hard-and-soft", "4:21", 2024, "Alternative", 1739659144],
  [14, "Shape of You", "ed-sheeran", "divide", "divide", "3:54", 2017, "Pop", 1193701392],
  [15, "Perfect", "ed-sheeran", "divide", "divide", "4:23", 2017, "Pop", 1193701400],
  [16, "Castle on the Hill", "ed-sheeran", "divide", "divide", "4:21", 2017, "Pop", 1193701328],
  [17, "24K Magic", "bruno-mars", "24k-magic", "24k-magic", "3:47", 2016, "R&B", 1161504024],
  [18, "That's What I Like", "bruno-mars", "24k-magic", "24k-magic", "3:27", 2016, "R&B", 1161504043],
  [19, "Finesse", "bruno-mars", "24k-magic", "24k-magic", "3:11", 2016, "R&B", 1161504065],
  [20, "Kill Bill", "sza", "sos", "sos", "2:34", 2022, "R&B", 1657869393],
  [21, "Snooze", "sza", "sos", "sos", "3:22", 2022, "R&B", 1658650499],
  [22, "Good Days", "sza", "sos", "sos", "4:38", 2020, "R&B", 1658650802],
  [23, "HUMBLE.", "kendrick-lamar", "damn", "damn", "2:57", 2017, "Hip Hop", 1440882165],
  [24, "DNA.", "kendrick-lamar", "damn", "damn", "3:06", 2017, "Hip Hop", 1440881990],
  [25, "LOVE. (feat. Zacari)", "kendrick-lamar", "damn", "damn", "3:33", 2017, "Hip Hop", 1440882172],
  [26, "The Scientist", "coldplay", "a-rush-of-blood", "a-rush-of-blood", "5:09", 2002, "Rock", 1122776155],
  [27, "Clocks", "coldplay", "a-rush-of-blood", "a-rush-of-blood", "5:07", 2002, "Rock", 1122776156],
  [28, "In My Place", "coldplay", "a-rush-of-blood", "a-rush-of-blood", "3:49", 2002, "Rock", 1122776153],
  [29, "Do I Wanna Know?", "arctic-monkeys", "am", "am", "4:32", 2013, "Rock", 663097965],
  [30, "R U Mine?", "arctic-monkeys", "am", "am", "3:22", 2012, "Rock", 663097966],
  [31, "Why'd You Only Call Me When You're High?", "arctic-monkeys", "am", "am", "2:41", 2013, "Rock", 776014885],
  [32, "Get Lucky", "daft-punk", "random-access-memories", "random-access-memories", "6:10", 2013, "Electronic", 617154366],
  [33, "Instant Crush", "daft-punk", "random-access-memories", "random-access-memories", "5:38", 2013, "Electronic", 617154362],
  [34, "Lose Yourself to Dance", "daft-punk", "random-access-memories", "random-access-memories", "5:54", 2013, "Electronic", 617154363],
  [35, "Wake Me Up", "avicii", "true", "true", "4:10", 2013, "Dance", 1440872929],
  [36, "Hey Brother", "avicii", "true", "true", "4:14", 2013, "Dance", 1440873108],
  [37, "Addicted To You", "avicii", "true", "true", "2:28", 2013, "Dance", 1440873120],
  [38, "Super Shy", "newjeans", "get-up", "get-up", "2:35", 2023, "K-Pop", 1695951897],
  [39, "ETA", "newjeans", "get-up", "get-up", "2:31", 2023, "K-Pop", 1695951900],
  [40, "Cool With You", "newjeans", "get-up", "get-up", "2:28", 2023, "K-Pop", 1695951905],
  [41, "Don't Know Why", "norah-jones", "come-away-with-me", "come-away-with-me", "3:06", 2002, "Jazz", 1624173757],
  [42, "Come Away with Me", "norah-jones", "come-away-with-me", "come-away-with-me", "3:18", 2002, "Jazz", 1624174098],
  [43, "Turn Me On", "norah-jones", "come-away-with-me", "come-away-with-me", "2:35", 2002, "Jazz", 1624174335],
  [44, "From The Start", "laufey", "bewitched", "bewitched", "2:50", 2023, "Jazz", 1690609217],
  [45, "Bewitched", "laufey", "bewitched", "bewitched", "4:07", 2023, "Jazz", 1690609674],
  [46, "Promise", "laufey", "bewitched", "bewitched", "3:54", 2023, "Jazz", 1690608935],
  [47, "Nuvole Bianche", "ludovico-einaudi", "una-mattina", "una-mattina", "5:58", 2004, "Classical", 1440762319],
  [48, "Una Mattina", "ludovico-einaudi", "una-mattina", "una-mattina", "3:24", 2004, "Classical", 1440762058],
  [49, "drivers license", "olivia-rodrigo", "sour", "sour", "4:02", 2021, "Pop", 1560735480],
  [50, "good 4 u", "olivia-rodrigo", "sour", "sour", "2:58", 2021, "Pop", 1560735856],
  [51, "deja vu", "olivia-rodrigo", "sour", "sour", "3:36", 2021, "Pop", 1560735847],
  [52, "Believer", "imagine-dragons", "evolve", "evolve", "3:24", 2017, "Rock", 1411628233],
  [53, "Thunder", "imagine-dragons", "evolve", "evolve", "3:07", 2017, "Rock", 1411629089],
  [54, "Whatever It Takes", "imagine-dragons", "evolve", "evolve", "3:21", 2017, "Rock", 1411628148],
  [55, "Crush (feat. Usher)", "yuna", "chapters", "chapters", "4:03", 2016, "R&B", 1440842581],
  [56, "Lanes", "yuna", "chapters", "chapters", "3:14", 2016, "R&B", 1440842573],
  [57, "Unrequited Love", "yuna", "chapters", "chapters", "4:09", 2016, "R&B", 1440842590],
  [58, "Espresso", "sabrina-carpenter", null, "espresso", "2:55", 2024, "Pop", 1744253558],
  [59, "Good Luck, Babe!", "chappell-roan", null, "good-luck-babe", "3:38", 2024, "Pop", 1737497080],
  [60, "Beautiful Things", "benson-boone", null, "beautiful-things", "3:00", 2024, "Pop", 1736051619],
  [61, "APT. (with Bruno Mars)", "rose", null, "apt", "2:50", 2024, "K-Pop", 1771105935],
  [62, "Die With A Smile (with Bruno Mars)", "lady-gaga", null, "die-with-a-smile", "4:12", 2024, "Pop", 1762656732],
  [63, "Not Like Us", "kendrick-lamar", null, "not-like-us", "4:34", 2024, "Hip Hop", 1781353929]
];

// audio, art and url stay empty until data/apple.js fills them in
export const SONGS = SONG_ROWS.map(([id, title, artist, album, cover, length, year, genre, appleId]) => ({
  id, title, artist, album, cover, length, year, genre, appleId,
  audio: "", art: "", url: ""
}));

// ranked chart shown on the listen page
export const CHART = [11, 61, 62, 58, 1, 59, 60, 63, 5, 20, 8, 14, 38, 49, 44, 26, 52, 29, 32, 35];

// curated collections. "mix" collections are themed blends, not personalised.
export const COLLECTIONS = [
  { id: "chill-vibes", kind: "collection", title: "Chill Vibes", description: "Relaxing music for late nights and peaceful moments.",
    tracks: [11, 41, 44, 47, 26, 55, 13, 45, 42, 48, 56, 22, 15, 33, 46, 57] },
  { id: "late-night-coding", kind: "collection", title: "Late Night Coding", description: "Deep focus grooves for shipping code after midnight.",
    tracks: [32, 33, 34, 47, 48, 29, 30, 1, 3, 11, 39, 40, 27, 24] },
  { id: "workout-mix", kind: "collection", title: "Workout Mix", description: "High energy tracks to keep you moving through the last rep.",
    tracks: [52, 53, 54, 23, 63, 17, 35, 8, 9, 50, 20, 58, 61] },
  { id: "study-session", kind: "collection", title: "Study Session", description: "Piano, soft jazz and gentle vocals for long study hours.",
    tracks: [47, 48, 41, 42, 43, 44, 45, 46, 26, 13, 57, 56] },
  { id: "road-trip", kind: "collection", title: "Road Trip", description: "Windows down, volume up. Songs for the long drive.",
    tracks: [1, 2, 14, 16, 27, 35, 36, 8, 59, 60, 62, 18, 26, 49, 5] },
  { id: "focus-mode", kind: "collection", title: "Focus Mode", description: "Calm, steady sound for deep work.",
    tracks: [47, 48, 32, 33, 34, 41, 46, 11, 28, 12] },
  { id: "gym-energy", kind: "collection", title: "Gym Energy", description: "Big drums and fast tempos. No skipping allowed.",
    tracks: [52, 23, 63, 50, 17, 35, 53, 10, 9, 24, 58] },
  { id: "rainy-night", kind: "collection", title: "Rainy Night", description: "Soft, moody songs for a rainy evening indoors.",
    tracks: [26, 13, 49, 22, 44, 45, 15, 57, 62, 42, 3, 21] },
  { id: "coding-session", kind: "collection", title: "Coding Session", description: "Steady grooves that keep the flow going.",
    tracks: [32, 34, 33, 29, 31, 24, 35, 37, 38, 39, 11] },
  { id: "daily-mix-01", kind: "mix", title: "Daily Mix 01", description: "Pop and R&B staples: The Weeknd, Dua Lipa, SZA.",
    tracks: [1, 8, 20, 2, 9, 21, 3, 10] },
  { id: "daily-mix-02", kind: "mix", title: "Daily Mix 02", description: "Guitar-driven: Coldplay, Arctic Monkeys, Imagine Dragons.",
    tracks: [26, 29, 52, 27, 30, 53, 28, 54] },
  { id: "chill-mix", kind: "mix", title: "Chill Mix", description: "Smooth songs to slow the evening down.",
    tracks: [41, 44, 11, 55, 45, 22, 13, 57] },
  { id: "focus-mix", kind: "mix", title: "Focus Mix", description: "Piano, jazz and slow grooves that never get in the way.",
    tracks: [47, 48, 41, 33, 46, 42, 34, 43] },
  { id: "discover-mix", kind: "mix", title: "Discover Mix", description: "Newer names from the WaveMusic catalogue.",
    tracks: [38, 59, 60, 45, 39, 56, 58, 40] },
  { id: "throwback-mix", kind: "mix", title: "Throwback Mix", description: "Classics from the 2000s and early 2010s.",
    tracks: [26, 27, 41, 29, 32, 35, 42, 28] }
];

export const GENRES = [
  { id: "pop", title: "Pop", genre: "Pop" },
  { id: "rock", title: "Rock", genre: "Rock" },
  { id: "hip-hop", title: "Hip Hop", genre: "Hip Hop" },
  { id: "r-and-b", title: "R&B", genre: "R&B" },
  { id: "k-pop", title: "K-Pop", genre: "K-Pop" },
  { id: "dance", title: "Dance", genre: "Dance" },
  { id: "electronic", title: "Electronic", genre: "Electronic" },
  { id: "alternative", title: "Alternative", genre: "Alternative" },
  { id: "jazz", title: "Jazz", genre: "Jazz" },
  { id: "classical", title: "Classical", genre: "Classical" }
];

const index = (list) => new Map(list.map((item) => [item.id, item]));
const SONG_MAP = index(SONGS);
const ARTIST_MAP = index(ARTISTS);
const ALBUM_MAP = index(ALBUMS);
const SINGLE_MAP = index(SINGLES);
const COLLECTION_MAP = index(COLLECTIONS);
const GENRE_MAP = index(GENRES);

export const getSong = (id) => SONG_MAP.get(Number(id)) || null;
export const getArtist = (id) => ARTIST_MAP.get(id) || null;
export const getAlbum = (id) => ALBUM_MAP.get(id) || null;
export const getSingle = (id) => SINGLE_MAP.get(id) || null;
export const getCollection = (id) => COLLECTION_MAP.get(id) || null;
export const getGenre = (id) => GENRE_MAP.get(id) || null;
export const genreByName = (name) => GENRES.find((g) => g.genre === name) || null;

export function artistName(song) {
  const artist = song && getArtist(song.artist);
  return artist ? artist.name : "Unknown artist";
}

export function albumTitle(song) {
  if (!song) return "";
  const album = song.album && getAlbum(song.album);
  return album ? album.title : "Single";
}

export const songsOfAlbum = (albumId) => (getAlbum(albumId)?.tracks || []).map(getSong).filter(Boolean);
export const songsOfArtist = (artistId) => SONGS.filter((s) => s.artist === artistId);
export const albumsOfArtist = (artistId) => ALBUMS.filter((a) => a.artist === artistId);
export const singlesOfArtist = (artistId) => SINGLES.filter((s) => s.artist === artistId);
export const songsOfGenre = (genre) => SONGS.filter((s) => s.genre === genre);
export const chartRank = (songId) => CHART.indexOf(Number(songId)) + 1;

// popular songs first (by chart rank), then the rest in catalogue order
export function topSongsOfArtist(artistId, limit = 5) {
  return songsOfArtist(artistId)
    .map((s, i) => ({ s, rank: chartRank(s.id) || 1000 + i }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map((x) => x.s);
}

// same genre first, then everyone else
export function similarArtists(artistId, limit = 6) {
  const me = getArtist(artistId);
  const others = ARTISTS.filter((a) => a.id !== artistId);
  const same = others.filter((a) => me && a.genre === me.genre);
  const rest = others.filter((a) => !me || a.genre !== me.genre);
  return same.concat(rest).slice(0, limit);
}

export function paletteFor(key) {
  const artist = getArtist(key);
  return PALETTES[artist ? artist.cover : key] || PALETTES.brand;
}
