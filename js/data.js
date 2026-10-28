/* all the content lives in this file: palettes, artists, albums, singles,
   songs, playlists, mixes and categories.

   the songs are real. each one stores its apple music track id, and when the
   app starts it asks the public itunes search api for that song's official
   30-second preview and its album artwork (see loadAppleCatalogue below).
   no audio or artwork files are stored in this project.

   the palettes colour the gradients behind each cover, and are also read by
   docs/build-art.js to draw the playlist and mix covers. */

// colours for the cover gradients and the generated artwork
const PALETTES = {
  brand: "#7c5cff | #4326b8 | #ff5ca8",
  waves: "#25d8a4 | #0c5f52 | #7c5cff",
  profile: "#ff7a59 | #b02b6b | #7c5cff",

  // albums (the key is the album slug written in camelCase)
  afterHours: "#e11d48 | #3b0712 | #f59e0b",
  midnights: "#6366f1 | #1e1b4b | #a5b4fc",
  futureNostalgia: "#f472b6 | #4c1d95 | #fde047",
  hitMeHardAndSoft: "#38bdf8 | #0c2f5a | #1e3a8a",
  divide: "#22d3ee | #0e4f63 | #a5f3fc",
  "24kMagic": "#a78bfa | #2e1065 | #fbbf24",
  sos: "#60a5fa | #0f2a4a | #e2e8f0",
  damn: "#ef4444 | #450a0a | #f5f5f4",
  aRushOfBlood: "#f59e0b | #1c1917 | #38bdf8",
  am: "#a1a1aa | #09090b | #e4e4e7",
  randomAccessMemories: "#d4d4d8 | #18181b | #fbbf24",
  true: "#fb923c | #3b1a07 | #fde68a",
  getUp: "#93c5fd | #1e3a8a | #fbcfe8",
  comeAwayWithMe: "#d6a77a | #3f2a1a | #fde68a",
  bewitched: "#fca5a5 | #4c1d2e | #93c5fd",
  unaMattina: "#e5e7eb | #1f2937 | #9ca3af",
  sour: "#c084fc | #3b0764 | #f9a8d4",
  evolve: "#fb923c | #431407 | #38bdf8",
  chapters: "#f9a8d4 | #500724 | #fde68a",

  // singles
  espresso: "#facc15 | #713f12 | #38bdf8",
  goodLuckBabe: "#f472b6 | #500724 | #fecaca",
  beautifulThings: "#94a3b8 | #0f172a | #fde68a",
  apt: "#fb7185 | #4c0519 | #fda4af",
  dieWithASmile: "#e5e7eb | #111827 | #f87171",
  notLikeUs: "#4ade80 | #052e16 | #fafafa",

  // search categories
  catPop: "#ff5ca8 | #6d1b52 | #ffd166",
  catRock: "#ef4444 | #1c1917 | #f97316",
  catHipHop: "#facc15 | #3f2d0b | #ef4444",
  catRnb: "#a78bfa | #2e1065 | #f472b6",
  catJazz: "#d6a77a | #3f2a1a | #fde68a",
  catElectronic: "#22d3ee | #0c4a6e | #7c5cff",
  catDance: "#f97316 | #7c2d12 | #facc15",
  catKpop: "#f9a8d4 | #4c1d95 | #93c5fd",
  catAlternative: "#38bdf8 | #0f172a | #a78bfa",
  catClassical: "#e5e7eb | #1f2937 | #a5b4fc",

  // playlists
  chillVibes: "#7c5cff | #2a1a6e | #ff5ca8",
  lateNightCoding: "#4f46e5 | #111133 | #22d3ee",
  workoutMix: "#ff4d6d | #450a0a | #ffd166",
  studySession: "#a78bfa | #312e81 | #a5f3fc",
  roadTrip: "#f59e0b | #7c2d12 | #38bdf8",
  focusMode: "#25d8a4 | #064e3b | #7c5cff",
  gymEnergy: "#ef4444 | #450a0a | #f97316",
  rainyNight: "#60a5fa | #1e293b | #a78bfa",
  codingSession: "#22d3ee | #0c4a6e | #7c5cff",

  // made for you mixes
  dailyMix01: "#7c5cff | #312e81 | #ff5ca8",
  dailyMix02: "#25d8a4 | #064e3b | #38bdf8",
  chillMix: "#a5b4fc | #312e81 | #f0abfc",
  focusMix: "#22d3ee | #0e7490 | #7c5cff",
  discoverMix: "#fb7185 | #7f1d1d | #ffd166",
  throwbackMix: "#f59e0b | #78350f | #ef4444"
};

// artists. "cover" is the album or single whose artwork represents them,
// because the itunes api does not provide artist photos.
const ARTISTS = [
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

// albums: the slug names the palette and the artwork
const ALBUMS = [
  { id: "after-hours", title: "After Hours", artist: "the-weeknd", year: 2020, genre: "R&B", slug: "after-hours",
    tracks: [1, 2, 3, 4] },
  { id: "midnights", title: "Midnights", artist: "taylor-swift", year: 2022, genre: "Pop", slug: "midnights",
    tracks: [5, 6, 7] },
  { id: "future-nostalgia", title: "Future Nostalgia", artist: "dua-lipa", year: 2020, genre: "Dance", slug: "future-nostalgia",
    tracks: [8, 9, 10] },
  { id: "hit-me-hard-and-soft", title: "HIT ME HARD AND SOFT", artist: "billie-eilish", year: 2024, genre: "Alternative", slug: "hit-me-hard-and-soft",
    tracks: [11, 12, 13] },
  { id: "divide", title: "÷ (Divide)", artist: "ed-sheeran", year: 2017, genre: "Pop", slug: "divide",
    tracks: [14, 15, 16] },
  { id: "24k-magic", title: "24K Magic", artist: "bruno-mars", year: 2016, genre: "R&B", slug: "24k-magic",
    tracks: [17, 18, 19] },
  { id: "sos", title: "SOS", artist: "sza", year: 2022, genre: "R&B", slug: "sos",
    tracks: [20, 21, 22] },
  { id: "damn", title: "DAMN.", artist: "kendrick-lamar", year: 2017, genre: "Hip Hop", slug: "damn",
    tracks: [23, 24, 25] },
  { id: "a-rush-of-blood", title: "A Rush of Blood to the Head", artist: "coldplay", year: 2002, genre: "Rock", slug: "a-rush-of-blood",
    tracks: [26, 27, 28] },
  { id: "am", title: "AM", artist: "arctic-monkeys", year: 2013, genre: "Rock", slug: "am",
    tracks: [29, 30, 31] },
  { id: "random-access-memories", title: "Random Access Memories", artist: "daft-punk", year: 2013, genre: "Electronic", slug: "random-access-memories",
    tracks: [32, 33, 34] },
  { id: "true", title: "True", artist: "avicii", year: 2013, genre: "Dance", slug: "true",
    tracks: [35, 36, 37] },
  { id: "get-up", title: "Get Up", artist: "newjeans", year: 2023, genre: "K-Pop", slug: "get-up",
    tracks: [38, 39, 40] },
  { id: "come-away-with-me", title: "Come Away with Me", artist: "norah-jones", year: 2002, genre: "Jazz", slug: "come-away-with-me",
    tracks: [41, 42, 43] },
  { id: "bewitched", title: "Bewitched", artist: "laufey", year: 2023, genre: "Jazz", slug: "bewitched",
    tracks: [44, 45, 46] },
  { id: "una-mattina", title: "Una Mattina", artist: "ludovico-einaudi", year: 2004, genre: "Classical", slug: "una-mattina",
    tracks: [47, 48] },
  { id: "sour", title: "SOUR", artist: "olivia-rodrigo", year: 2021, genre: "Pop", slug: "sour",
    tracks: [49, 50, 51] },
  { id: "evolve", title: "Evolve", artist: "imagine-dragons", year: 2017, genre: "Rock", slug: "evolve",
    tracks: [52, 53, 54] },
  { id: "chapters", title: "Chapters", artist: "yuna", year: 2016, genre: "R&B", slug: "chapters",
    tracks: [55, 56, 57] }
];

// singles
const SINGLES = [
  { id: "espresso", title: "Espresso", artist: "sabrina-carpenter", year: 2024, song: 58, slug: "espresso" },
  { id: "good-luck-babe", title: "Good Luck, Babe!", artist: "chappell-roan", year: 2024, song: 59, slug: "good-luck-babe" },
  { id: "beautiful-things", title: "Beautiful Things", artist: "benson-boone", year: 2024, song: 60, slug: "beautiful-things" },
  { id: "apt", title: "APT.", artist: "rose", year: 2024, song: 61, slug: "apt" },
  { id: "die-with-a-smile", title: "Die With A Smile", artist: "lady-gaga", year: 2024, song: 62, slug: "die-with-a-smile" },
  { id: "not-like-us", title: "Not Like Us", artist: "kendrick-lamar", year: 2024, song: 63, slug: "not-like-us" }
];

// songs: id, title, artist id, album id, cover slug, length, year, genre, apple music track id
const SONGS = [
  song(1, "Blinding Lights", "the-weeknd", "after-hours", "after-hours", "3:20", 2019, "R&B", 1499378607),
  song(2, "Save Your Tears", "the-weeknd", "after-hours", "after-hours", "3:36", 2020, "R&B", 1499386369),
  song(3, "In Your Eyes", "the-weeknd", "after-hours", "after-hours", "3:58", 2020, "R&B", 1499386363),
  song(4, "Heartless", "the-weeknd", "after-hours", "after-hours", "3:18", 2019, "R&B", 1615102593),

  song(5, "Anti-Hero", "taylor-swift", "midnights", "midnights", "3:21", 2022, "Pop", 1689131533),
  song(6, "Lavender Haze", "taylor-swift", "midnights", "midnights", "3:22", 2022, "Pop", 1650859886),
  song(7, "Karma (feat. Ice Spice)", "taylor-swift", "midnights", "midnights", "3:21", 2022, "Pop", 1689090494),

  song(8, "Levitating", "dua-lipa", "future-nostalgia", "future-nostalgia", "3:24", 2020, "Dance", 1538003843),
  song(9, "Don't Start Now", "dua-lipa", "future-nostalgia", "future-nostalgia", "3:03", 2019, "Dance", 1538003635),
  song(10, "Physical", "dua-lipa", "future-nostalgia", "future-nostalgia", "3:14", 2020, "Dance", 1552269072),

  song(11, "BIRDS OF A FEATHER", "billie-eilish", "hit-me-hard-and-soft", "hit-me-hard-and-soft", "3:30", 2024, "Alternative", 1739659142),
  song(12, "LUNCH", "billie-eilish", "hit-me-hard-and-soft", "hit-me-hard-and-soft", "2:00", 2024, "Alternative", 1739659140),
  song(13, "WILDFLOWER", "billie-eilish", "hit-me-hard-and-soft", "hit-me-hard-and-soft", "4:21", 2024, "Alternative", 1739659144),

  song(14, "Shape of You", "ed-sheeran", "divide", "divide", "3:54", 2017, "Pop", 1193701392),
  song(15, "Perfect", "ed-sheeran", "divide", "divide", "4:23", 2017, "Pop", 1193701400),
  song(16, "Castle on the Hill", "ed-sheeran", "divide", "divide", "4:21", 2017, "Pop", 1193701328),

  song(17, "24K Magic", "bruno-mars", "24k-magic", "24k-magic", "3:47", 2016, "R&B", 1161504024),
  song(18, "That's What I Like", "bruno-mars", "24k-magic", "24k-magic", "3:27", 2016, "R&B", 1161504043),
  song(19, "Finesse", "bruno-mars", "24k-magic", "24k-magic", "3:11", 2016, "R&B", 1161504065),

  song(20, "Kill Bill", "sza", "sos", "sos", "2:34", 2022, "R&B", 1657869393),
  song(21, "Snooze", "sza", "sos", "sos", "3:22", 2022, "R&B", 1658650499),
  song(22, "Good Days", "sza", "sos", "sos", "4:38", 2020, "R&B", 1658650802),

  song(23, "HUMBLE.", "kendrick-lamar", "damn", "damn", "2:57", 2017, "Hip Hop", 1440882165),
  song(24, "DNA.", "kendrick-lamar", "damn", "damn", "3:06", 2017, "Hip Hop", 1440881990),
  song(25, "LOVE. (feat. Zacari)", "kendrick-lamar", "damn", "damn", "3:33", 2017, "Hip Hop", 1440882172),

  song(26, "The Scientist", "coldplay", "a-rush-of-blood", "a-rush-of-blood", "5:09", 2002, "Rock", 1122776155),
  song(27, "Clocks", "coldplay", "a-rush-of-blood", "a-rush-of-blood", "5:07", 2002, "Rock", 1122776156),
  song(28, "In My Place", "coldplay", "a-rush-of-blood", "a-rush-of-blood", "3:49", 2002, "Rock", 1122776153),

  song(29, "Do I Wanna Know?", "arctic-monkeys", "am", "am", "4:32", 2013, "Rock", 663097965),
  song(30, "R U Mine?", "arctic-monkeys", "am", "am", "3:22", 2012, "Rock", 663097966),
  song(31, "Why'd You Only Call Me When You're High?", "arctic-monkeys", "am", "am", "2:41", 2013, "Rock", 776014885),

  song(32, "Get Lucky", "daft-punk", "random-access-memories", "random-access-memories", "6:10", 2013, "Electronic", 617154366),
  song(33, "Instant Crush", "daft-punk", "random-access-memories", "random-access-memories", "5:38", 2013, "Electronic", 617154362),
  song(34, "Lose Yourself to Dance", "daft-punk", "random-access-memories", "random-access-memories", "5:54", 2013, "Electronic", 617154363),

  song(35, "Wake Me Up", "avicii", "true", "true", "4:10", 2013, "Dance", 1440872929),
  song(36, "Hey Brother", "avicii", "true", "true", "4:14", 2013, "Dance", 1440873108),
  song(37, "Addicted To You", "avicii", "true", "true", "2:28", 2013, "Dance", 1440873120),

  song(38, "Super Shy", "newjeans", "get-up", "get-up", "2:35", 2023, "K-Pop", 1695951897),
  song(39, "ETA", "newjeans", "get-up", "get-up", "2:31", 2023, "K-Pop", 1695951900),
  song(40, "Cool With You", "newjeans", "get-up", "get-up", "2:28", 2023, "K-Pop", 1695951905),

  song(41, "Don't Know Why", "norah-jones", "come-away-with-me", "come-away-with-me", "3:06", 2002, "Jazz", 1624173757),
  song(42, "Come Away with Me", "norah-jones", "come-away-with-me", "come-away-with-me", "3:18", 2002, "Jazz", 1624174098),
  song(43, "Turn Me On", "norah-jones", "come-away-with-me", "come-away-with-me", "2:35", 2002, "Jazz", 1624174335),

  song(44, "From The Start", "laufey", "bewitched", "bewitched", "2:50", 2023, "Jazz", 1690609217),
  song(45, "Bewitched", "laufey", "bewitched", "bewitched", "4:07", 2023, "Jazz", 1690609674),
  song(46, "Promise", "laufey", "bewitched", "bewitched", "3:54", 2023, "Jazz", 1690608935),

  song(47, "Nuvole Bianche", "ludovico-einaudi", "una-mattina", "una-mattina", "5:58", 2004, "Classical", 1440762319),
  song(48, "Una Mattina", "ludovico-einaudi", "una-mattina", "una-mattina", "3:24", 2004, "Classical", 1440762058),

  song(49, "drivers license", "olivia-rodrigo", "sour", "sour", "4:02", 2021, "Pop", 1560735480),
  song(50, "good 4 u", "olivia-rodrigo", "sour", "sour", "2:58", 2021, "Pop", 1560735856),
  song(51, "deja vu", "olivia-rodrigo", "sour", "sour", "3:36", 2021, "Pop", 1560735847),

  song(52, "Believer", "imagine-dragons", "evolve", "evolve", "3:24", 2017, "Rock", 1411628233),
  song(53, "Thunder", "imagine-dragons", "evolve", "evolve", "3:07", 2017, "Rock", 1411629089),
  song(54, "Whatever It Takes", "imagine-dragons", "evolve", "evolve", "3:21", 2017, "Rock", 1411628148),

  song(55, "Crush (feat. Usher)", "yuna", "chapters", "chapters", "4:03", 2016, "R&B", 1440842581),
  song(56, "Lanes", "yuna", "chapters", "chapters", "3:14", 2016, "R&B", 1440842573),
  song(57, "Unrequited Love", "yuna", "chapters", "chapters", "4:09", 2016, "R&B", 1440842590),

  // singles
  song(58, "Espresso", "sabrina-carpenter", null, "espresso", "2:55", 2024, "Pop", 1744253558),
  song(59, "Good Luck, Babe!", "chappell-roan", null, "good-luck-babe", "3:38", 2024, "Pop", 1737497080),
  song(60, "Beautiful Things", "benson-boone", null, "beautiful-things", "3:00", 2024, "Pop", 1736051619),
  song(61, "APT. (with Bruno Mars)", "rose", null, "apt", "2:50", 2024, "K-Pop", 1771105935),
  song(62, "Die With A Smile (with Bruno Mars)", "lady-gaga", null, "die-with-a-smile", "4:12", 2024, "Pop", 1762656732),
  song(63, "Not Like Us", "kendrick-lamar", null, "not-like-us", "4:34", 2024, "Hip Hop", 1781353929)
];

// the order of the trending chart on the home page. a song's position here
// is its "rank", which also orders the popular songs on artist pages.
const CHART = [11, 61, 62, 58, 1, 59, 60, 63, 5, 20, 8, 14, 38, 49, 44, 26, 52, 29, 32, 35];
CHART.forEach((id, i) => {
  const s = SONGS.find((x) => x.id === id);
  if (s) s.rank = i + 1;
});

// what the home page shows as recently played, and the songs liked by default
const COLLECTIONS = {
  recentlyPlayed: [
    "after-hours", "hit-me-hard-and-soft", "get-up", "sos", "am",
    "bewitched", "future-nostalgia", "a-rush-of-blood", "midnights", "random-access-memories"
  ],
  likedSongs: [
    1, 11, 20, 8, 26, 44, 58, 38, 47, 5, 32, 29
  ]
};

// playlists
const PLAYLISTS = [
  {
    id: "chill-vibes", title: "Chill Vibes", slug: "chill-vibes", owner: "WaveMusic",
    description: "Relaxing music for late nights and peaceful moments.",
    tracks: [11, 41, 44, 47, 26, 55, 13, 45, 42, 48, 56, 22, 15, 33, 46, 57]
  },
  {
    id: "late-night-coding", title: "Late Night Coding", slug: "late-night-coding", owner: "You",
    description: "Deep focus grooves for shipping code after midnight.",
    tracks: [32, 33, 34, 47, 48, 29, 30, 1, 3, 11, 39, 40, 27, 24]
  },
  {
    id: "workout-mix", title: "Workout Mix", slug: "workout-mix", owner: "You",
    description: "High energy tracks to keep you moving through the last rep.",
    tracks: [52, 53, 54, 23, 63, 17, 35, 8, 9, 50, 20, 58, 61]
  },
  {
    id: "study-session", title: "Study Session", slug: "study-session", owner: "WaveMusic",
    description: "Piano, soft jazz and gentle vocals for long study hours.",
    tracks: [47, 48, 41, 42, 43, 44, 45, 46, 26, 13, 57, 56]
  },
  {
    id: "road-trip", title: "Road Trip", slug: "road-trip", owner: "You",
    description: "Windows down, volume up. Songs for the long drive.",
    tracks: [1, 2, 14, 16, 27, 35, 36, 8, 59, 60, 62, 18, 26, 49, 5]
  },
  {
    id: "focus-mode", title: "Focus Mode", slug: "focus-mode", owner: "WaveMusic",
    description: "Calm, steady sound for deep work.",
    tracks: [47, 48, 32, 33, 34, 41, 46, 11, 28, 12]
  },
  {
    id: "gym-energy", title: "Gym Energy", slug: "gym-energy", owner: "You",
    description: "Big drums and fast tempos. No skipping allowed.",
    tracks: [52, 23, 63, 50, 17, 35, 53, 10, 9, 24, 58]
  },
  {
    id: "rainy-night", title: "Rainy Night", slug: "rainy-night", owner: "WaveMusic",
    description: "Soft, moody songs for a rainy evening indoors.",
    tracks: [26, 13, 49, 22, 44, 45, 15, 57, 62, 42, 3, 21]
  },
  {
    id: "coding-session", title: "Coding Session", slug: "coding-session", owner: "You",
    description: "Steady grooves that keep the flow going.",
    tracks: [32, 34, 33, 29, 31, 24, 35, 37, 38, 39, 11]
  }
];

// the made for you mixes on the home page
const MIXES = [
  { id: "daily-mix-01", title: "Daily Mix 01", slug: "daily-mix-01", palette: "dailyMix01", subtitle: "The Weeknd, Dua Lipa, SZA",
    description: "A daily blend of your pop and R&B favourites.",
    tracks: [1, 8, 20, 2, 9, 21, 3, 10] },
  { id: "daily-mix-02", title: "Daily Mix 02", slug: "daily-mix-02", palette: "dailyMix02", subtitle: "Coldplay, Arctic Monkeys, Imagine Dragons",
    description: "Guitar-driven tracks picked from your recent listening.",
    tracks: [26, 29, 52, 27, 30, 53, 28, 54] },
  { id: "chill-mix", title: "Chill Mix", slug: "chill-mix", subtitle: "Chill, laid back, easy",
    description: "Smooth songs to slow the evening down.",
    tracks: [41, 44, 11, 55, 45, 22, 13, 57] },
  { id: "focus-mix", title: "Focus Mix", slug: "focus-mix", subtitle: "Piano, jazz and slow grooves",
    description: "Gentle music that never gets in the way.",
    tracks: [47, 48, 41, 33, 46, 42, 34, 43] },
  { id: "discover-mix", title: "Discover Mix", slug: "discover-mix", subtitle: "New artists to try",
    description: "Fresh names from the WaveMusic catalogue.",
    tracks: [38, 59, 60, 45, 39, 56, 58, 40] },
  { id: "throwback-mix", title: "Throwback Mix", slug: "throwback-mix", subtitle: "Older favourites",
    description: "Classics from the 2000s and early 2010s.",
    tracks: [26, 27, 41, 29, 32, 35, 42, 28] }
];

// the cards on the search page, each mapped to a genre in the song list
const CATEGORIES = [
  { id: "pop", title: "Pop", genre: "Pop", palette: "catPop", icon: "sparkles" },
  { id: "rock", title: "Rock", genre: "Rock", palette: "catRock", icon: "guitar" },
  { id: "hip-hop", title: "Hip Hop", genre: "Hip Hop", palette: "catHipHop", icon: "mic" },
  { id: "r-and-b", title: "R&B", genre: "R&B", palette: "catRnb", icon: "heart" },
  { id: "k-pop", title: "K-Pop", genre: "K-Pop", palette: "catKpop", icon: "star" },
  { id: "dance", title: "Dance", genre: "Dance", palette: "catDance", icon: "flame" },
  { id: "electronic", title: "Electronic", genre: "Electronic", palette: "catElectronic", icon: "waveform" },
  { id: "alternative", title: "Alternative", genre: "Alternative", palette: "catAlternative", icon: "headphones" },
  { id: "jazz", title: "Jazz", genre: "Jazz", palette: "catJazz", icon: "saxophone" },
  { id: "classical", title: "Classical", genre: "Classical", palette: "catClassical", icon: "music" }
];

// build one song object, and keeps the big list above short.
// audio and art stay empty until loadAppleCatalogue fills them in.
function song(id, title, artist, album, coverKey, duration, year, genre, appleId) {
  return {
    id,
    title,
    artist,
    album,
    cover: coverKey,
    appleId,
    audio: "",
    art: "",
    duration,
    year,
    genre
  };
}

const SONG_BY_ID = {};
SONGS.forEach((s) => { SONG_BY_ID[s.id] = s; });

const ARTIST_BY_ID = {};
ARTISTS.forEach((a) => { ARTIST_BY_ID[a.id] = a; });

const ALBUM_BY_ID = {};
ALBUMS.forEach((a) => { ALBUM_BY_ID[a.id] = a; });

const PLAYLIST_BY_ID = {};
PLAYLISTS.forEach((p) => { PLAYLIST_BY_ID[p.id] = p; });

const MIX_BY_ID = {};
MIXES.forEach((m) => { MIX_BY_ID[m.id] = m; });

const CATEGORY_BY_ID = {};
CATEGORIES.forEach((c) => { CATEGORY_BY_ID[c.id] = c; });

// small getters used all over the app
function getSong(id) { return SONG_BY_ID[id] || null; }
function getArtist(id) { return ARTIST_BY_ID[id] || null; }
function getAlbum(id) { return ALBUM_BY_ID[id] || null; }
function getPlaylist(id) { return PLAYLIST_BY_ID[id] || null; }
function getMix(id) { return MIX_BY_ID[id] || null; }

// artist name for a song
function artistName(songOrId) {
  const s = typeof songOrId === "object" ? songOrId : getSong(songOrId);
  const a = s ? getArtist(s.artist) : null;
  return a ? a.name : "Unknown Artist";
}

// album name for a song. songs without an album show as a single.
function albumTitle(songOrId) {
  const s = typeof songOrId === "object" ? songOrId : getSong(songOrId);
  if (!s) return "";
  const alb = s.album ? getAlbum(s.album) : null;
  return alb ? alb.title : "Single";
}

// every song of one album, in track order
function songsOfAlbum(albumId) {
  const alb = getAlbum(albumId);
  if (!alb) return [];
  return alb.tracks.map(getSong).filter(Boolean);
}

// every song of one artist
function songsOfArtist(artistId) {
  return SONGS.filter((s) => s.artist === artistId);
}

// albums of one artist
function albumsOfArtist(artistId) {
  return ALBUMS.filter((a) => a.artist === artistId);
}

// singles of one artist
function singlesOfArtist(artistId) {
  return SINGLES.filter((s) => s.artist === artistId);
}

// "3:42" to 222 seconds, used to add up playlist lengths
function durationToSeconds(text) {
  const parts = String(text).split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

// total length of a list of songs, like "1 hr 32 min"
function totalDurationText(trackIds) {
  const total = trackIds.reduce((sum, id) => {
    const s = getSong(id);
    return sum + (s ? durationToSeconds(s.duration) : 0);
  }, 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  if (hours <= 0) return minutes + " min";
  return hours + " hr " + minutes + " min";
}

// artwork. album and single covers come from apple music once the catalogue
// has loaded; until then (or offline) the gradient fallback cover is shown.
// playlists and mixes use the generated svg files in assets/playlists.
const ARTWORK = {};
const DEFAULT_COVER = "assets/images/default-cover.svg";

function albumCover(slug) { return ARTWORK[slug] || DEFAULT_COVER; }
function artistCover(artistId) {
  const a = ARTIST_BY_ID[artistId];
  return a ? albumCover(a.cover) : DEFAULT_COVER;
}
// a bigger version of the same artwork for the artist page banner
function artistHero(artistId) {
  return artistCover(artistId).replace("600x600bb", "1200x1200bb");
}
function playlistCover(slug) { return "assets/playlists/" + slug + "/cover.svg"; }

// turn a slug like "after-hours" into the palette key "afterHours".
// artists borrow the palette of their cover album.
function paletteForCover(kebabKey) {
  const artist = ARTIST_BY_ID[kebabKey];
  const key = artist ? artist.cover : kebabKey;
  const camel = String(key).replace(/-([a-z0-9])/g, (m, c) => c.toUpperCase());
  return PALETTES[camel] || PALETTES.brand;
}

// other artists for the fans also like row: same genre first, then the rest
function similarArtists(artistId, limit) {
  const me = ARTIST_BY_ID[artistId];
  const others = ARTISTS.filter((a) => a.id !== artistId);
  const same = others.filter((a) => me && a.genre === me.genre);
  const rest = others.filter((a) => !me || a.genre !== me.genre);
  return same.concat(rest).slice(0, limit || 6);
}

/* apple music previews
   one request to the itunes lookup api returns the preview url, artwork and
   apple music links for every song at once. the result is cached in the
   browser for a day so the next visit starts instantly. */

const APPLE_CACHE_KEY = "wavemusic.apple.v1";
const APPLE_CACHE_HOURS = 24;
const APPLE = { status: "idle", waiting: [] };

// copy the api results onto the songs, albums and artists
function applyAppleData(results) {
  const byTrack = {};
  results.forEach((r) => { if (r && r.trackId) byTrack[r.trackId] = r; });

  SONGS.forEach((s) => {
    const r = byTrack[s.appleId];
    if (!r) return;
    if (r.previewUrl) s.audio = r.previewUrl;
    if (r.artworkUrl100) s.art = r.artworkUrl100.replace("100x100bb", "600x600bb");
    if (r.trackViewUrl) s.url = r.trackViewUrl;
    const artist = ARTIST_BY_ID[s.artist];
    if (artist && !artist.url && r.artistViewUrl) artist.url = r.artistViewUrl;
  });

  // an album or single uses the artwork of its first song
  ALBUMS.forEach((a) => {
    const first = SONG_BY_ID[a.tracks[0]];
    if (first && first.art) ARTWORK[a.slug] = first.art;
  });
  SINGLES.forEach((s) => {
    const one = SONG_BY_ID[s.song];
    if (one && one.art) ARTWORK[s.slug] = one.art;
  });
}

function readAppleCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(APPLE_CACHE_KEY) || "null");
    if (!saved || !Array.isArray(saved.results)) return null;
    const ageHours = (Date.now() - saved.time) / 3600000;
    return ageHours < APPLE_CACHE_HOURS ? saved.results : null;
  } catch (err) {
    return null;
  }
}

function writeAppleCache(results) {
  try {
    // keep only the fields the app uses, so the cache stays small
    const slim = results.map((r) => ({
      trackId: r.trackId, previewUrl: r.previewUrl, artworkUrl100: r.artworkUrl100,
      trackViewUrl: r.trackViewUrl, artistViewUrl: r.artistViewUrl
    }));
    localStorage.setItem(APPLE_CACHE_KEY, JSON.stringify({ time: Date.now(), results: slim }));
  } catch (err) {
    // storage can be full or blocked; the app still works without the cache
  }
}

// run a function once the catalogue is ready (or failed to load)
function whenAppleReady(fn) {
  if (APPLE.status === "ready" || APPLE.status === "failed") fn();
  else APPLE.waiting.push(fn);
}

function finishApple(status) {
  APPLE.status = status;
  const waiting = APPLE.waiting.splice(0);
  waiting.forEach((fn) => fn());
}

// load previews and artwork. onUpdate runs whenever new data arrives.
function loadAppleCatalogue(onUpdate) {
  const cached = readAppleCache();
  if (cached) {
    applyAppleData(cached);
    finishApple("ready");
    if (onUpdate) onUpdate();
    return;
  }

  if (typeof fetch !== "function") {
    finishApple("failed");
    return;
  }

  APPLE.status = "loading";
  const ids = SONGS.map((s) => s.appleId).join(",");
  fetch("https://itunes.apple.com/lookup?id=" + ids)
    .then((res) => {
      if (!res.ok) throw new Error("itunes lookup failed: " + res.status);
      return res.json();
    })
    .then((data) => {
      const results = (data && data.results) || [];
      applyAppleData(results);
      writeAppleCache(results);
      finishApple("ready");
      if (onUpdate) onUpdate();
    })
    .catch(() => {
      finishApple("failed");
    });
}
