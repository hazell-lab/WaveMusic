/* all the demo content lives in this file: palettes, artists, albums, singles,
   songs, playlists, mixes and categories.

   every artist, album and song is made up, so there is nothing copyrighted here.
   change these lists to use your own content.

   the palettes are also read by docs/build-art.js to generate the cover art. */

// colours for the cover gradients and the generated artwork
const PALETTES = {
  brand: "#7c5cff | #4326b8 | #ff5ca8",
  waves: "#25d8a4 | #0c5f52 | #7c5cff",
  profile: "#ff7a59 | #b02b6b | #7c5cff",

  // albums
  neonSkies: "#7c5cff | #2a1a6e | #ff5ca8",
  cityLights: "#3aa0ff | #10214f | #7c5cff",
  nightDrive: "#ff4d6d | #4a0d3a | #7c5cff",
  paperMoons: "#ffb457 | #7a3210 | #ff6f91",
  coastalBlues: "#25d8a4 | #0b4f63 | #3aa0ff",
  slowMotion: "#a78bfa | #3b1d64 | #f472b6",
  solarFlare: "#ffd166 | #c2410c | #ff4d6d",
  velvetRoom: "#f472b6 | #6d1b52 | #a78bfa",
  quietHours: "#8fa8ff | #1f2a5e | #a5f3fc",
  staticBloom: "#c084fc | #4c1d95 | #fb7185",

  // singles
  afterglow: "#ff7a59 | #7c2d12 | #ffd166",
  glassWaves: "#67e8f9 | #0e5f7a | #7c5cff",
  honeyStatic: "#facc15 | #78350f | #fb7185",
  northbound: "#60a5fa | #172554 | #25d8a4",
  paperPlanes: "#fda4af | #831843 | #a78bfa",
  wildflower: "#a3e635 | #365314 | #25d8a4",

  // artist portraits
  novaLane: "#a78bfa | #312e81 | #ff5ca8",
  ethanCole: "#38bdf8 | #0c2f5a | #7c5cff",
  lunaGrey: "#fbbf24 | #7c2d12 | #fb7185",
  kaiRivers: "#2dd4bf | #134e4a | #3aa0ff",
  miraSol: "#fb7185 | #7f1d1d | #ffd166",
  thePaperHearts: "#f0abfc | #6b21a8 | #67e8f9",
  dreVale: "#f59e0b | #3f2d0b | #ef4444",
  arianaWilde: "#f472b6 | #4c1d95 | #a78bfa",
  solReed: "#fcd34d | #7c4a03 | #f97316",
  ivyMonroe: "#c4b5fd | #3730a3 | #f0abfc",
  noahBennett: "#93c5fd | #1e3a8a | #a5f3fc",
  zaidAmir: "#4ade80 | #064e3b | #a3e635",

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

// artists
const ARTISTS = [
  { id: "nova-lane", name: "Nova Lane", monthly: "4,281,904", verified: true, genre: "Dream Pop" },
  { id: "ethan-cole", name: "Ethan Cole", monthly: "2,104,338", verified: true, genre: "Alt Pop" },
  { id: "luna-grey", name: "Luna Grey", monthly: "3,672,110", verified: true, genre: "Indie Soul" },
  { id: "kai-rivers", name: "Kai Rivers", monthly: "1,895,047", verified: true, genre: "Electronic" },
  { id: "mira-sol", name: "Mira Sol", monthly: "5,431,220", verified: true, genre: "Pop" },
  { id: "the-paper-hearts", name: "The Paper Hearts", monthly: "982,516", verified: false, genre: "Indie Rock" },
  { id: "dre-vale", name: "Dre Vale", monthly: "6,120,887", verified: true, genre: "Hip Hop" },
  { id: "ariana-wilde", name: "Ariana Wilde", monthly: "8,904,412", verified: true, genre: "R&B" },
  { id: "sol-reed", name: "Sol Reed", monthly: "740,209", verified: false, genre: "Jazz" },
  { id: "ivy-monroe", name: "Ivy Monroe", monthly: "1,332,760", verified: true, genre: "Classical Crossover" },
  { id: "noah-bennett", name: "Noah Bennett", monthly: "512,933", verified: false, genre: "Lo-Fi" },
  { id: "zaid-amir", name: "Zaid Amir", monthly: "2,780,341", verified: true, genre: "Acoustic" }
];

// albums: the slug is also the artwork folder name
const ALBUMS = [
  { id: "neon-skies", title: "Neon Skies", artist: "nova-lane", year: 2024, genre: "Dream Pop", slug: "neon-skies",
    tracks: [1, 2, 3, 4, 5] },
  { id: "city-lights", title: "City Lights", artist: "ethan-cole", year: 2023, genre: "Alt Pop", slug: "city-lights",
    tracks: [6, 7, 8, 9, 10] },
  { id: "night-drive", title: "Night Drive", artist: "kai-rivers", year: 2024, genre: "Electronic", slug: "night-drive",
    tracks: [11, 12, 13, 14, 15, 16] },
  { id: "paper-moons", title: "Paper Moons", artist: "luna-grey", year: 2022, genre: "Indie Soul", slug: "paper-moons",
    tracks: [17, 18, 19, 20, 21] },
  { id: "coastal-blues", title: "Coastal Blues", artist: "luna-grey", year: 2024, genre: "Indie Soul", slug: "coastal-blues",
    tracks: [22, 23, 24, 25, 26] },
  { id: "slow-motion", title: "Slow Motion", artist: "ivy-monroe", year: 2023, genre: "Ambient Classical", slug: "slow-motion",
    tracks: [27, 28, 29, 30, 31] },
  { id: "solar-flare", title: "Solar Flare", artist: "mira-sol", year: 2025, genre: "Pop", slug: "solar-flare",
    tracks: [32, 33, 34, 35, 36] },
  { id: "velvet-room", title: "Velvet Room", artist: "ariana-wilde", year: 2024, genre: "R&B", slug: "velvet-room",
    tracks: [37, 38, 39, 40, 41] },
  { id: "quiet-hours", title: "Quiet Hours", artist: "noah-bennett", year: 2023, genre: "Lo-Fi", slug: "quiet-hours",
    tracks: [47, 48, 49, 50, 51] },
  { id: "static-bloom", title: "Static Bloom", artist: "the-paper-hearts", year: 2025, genre: "Indie Rock", slug: "static-bloom",
    tracks: [42, 43, 44, 45, 46] }
];

// singles
const SINGLES = [
  { id: "afterglow", title: "Afterglow", artist: "mira-sol", year: 2025, song: 52, slug: "afterglow" },
  { id: "glass-waves", title: "Glass Waves", artist: "kai-rivers", year: 2024, song: 53, slug: "glass-waves" },
  { id: "honey-static", title: "Honey Static", artist: "ariana-wilde", year: 2023, song: 54, slug: "honey-static" },
  { id: "northbound", title: "Northbound", artist: "zaid-amir", year: 2024, song: 55, slug: "northbound" },
  { id: "paper-planes", title: "Paper Planes", artist: "the-paper-hearts", year: 2022, song: 56, slug: "paper-planes" },
  { id: "wildflower", title: "Wildflower", artist: "sol-reed", year: 2021, song: 57, slug: "wildflower" }
];

// songs: id, title, artist id, album id, cover folder, duration, year, genre, plays
const SONGS = [
  // neon skies - nova lane
  song(1, "Midnight Drive", "nova-lane", "neon-skies", "neon-skies", "3:42", 2024, "Dream Pop", "2,481,220"),
  song(2, "Neon Skies", "nova-lane", "neon-skies", "neon-skies", "4:05", 2024, "Dream Pop", "1,904,551"),
  song(3, "Paper Satellites", "nova-lane", "neon-skies", "neon-skies", "3:18", 2024, "Dream Pop", "1,220,884"),
  song(4, "Violet Hour", "nova-lane", "neon-skies", "neon-skies", "4:31", 2024, "Dream Pop", "987,320"),
  song(5, "Slow Collapse", "nova-lane", "neon-skies", "neon-skies", "3:56", 2024, "Dream Pop", "760,142"),

  // city lights - ethan cole
  song(6, "After Hours", "ethan-cole", "city-lights", "city-lights", "4:10", 2023, "Alt Pop", "3,240,001"),
  song(7, "City Lights", "ethan-cole", "city-lights", "city-lights", "3:35", 2023, "Alt Pop", "2,110,447"),
  song(8, "Concrete Rain", "ethan-cole", "city-lights", "city-lights", "3:52", 2023, "Alt Pop", "1,540,220"),
  song(9, "Taxi Window", "ethan-cole", "city-lights", "city-lights", "2:58", 2023, "Alt Pop", "1,002,315"),
  song(10, "Last Train Home", "ethan-cole", "city-lights", "city-lights", "4:22", 2023, "Alt Pop", "890,664"),

  // night drive - kai rivers
  song(11, "Neon Tunnel", "kai-rivers", "night-drive", "night-drive", "5:02", 2024, "Electronic", "2,004,778"),
  song(12, "Headlights", "kai-rivers", "night-drive", "night-drive", "4:16", 2024, "Electronic", "1,338,902"),
  song(13, "Analog Heart", "kai-rivers", "night-drive", "night-drive", "3:48", 2024, "Electronic", "998,441"),
  song(14, "Zero Gravity", "kai-rivers", "night-drive", "night-drive", "4:44", 2024, "Electronic", "876,220"),
  song(15, "Midnight Voltage", "kai-rivers", "night-drive", "night-drive", "3:29", 2024, "Electronic", "654,310"),
  song(16, "Empty Highway", "kai-rivers", "night-drive", "night-drive", "5:21", 2024, "Electronic", "512,908"),

  // paper moons - luna grey
  song(17, "Paper Moons", "luna-grey", "paper-moons", "paper-moons", "3:44", 2022, "Indie Soul", "2,981,662"),
  song(18, "Golden Static", "luna-grey", "paper-moons", "paper-moons", "3:12", 2022, "Indie Soul", "1,776,004"),
  song(19, "Slow Burn", "luna-grey", "paper-moons", "paper-moons", "4:02", 2022, "Indie Soul", "1,204,338"),
  song(20, "Honey & Smoke", "luna-grey", "paper-moons", "paper-moons", "3:27", 2022, "Indie Soul", "865,140"),
  song(21, "Window Seat", "luna-grey", "paper-moons", "paper-moons", "3:58", 2022, "Indie Soul", "701,553"),

  // coastal blues - luna grey
  song(22, "Blue Horizon", "luna-grey", "coastal-blues", "coastal-blues", "3:27", 2024, "Indie Soul", "3,540,128"),
  song(23, "Salt & Sunlight", "luna-grey", "coastal-blues", "coastal-blues", "3:51", 2024, "Indie Soul", "2,220,904"),
  song(24, "Tide Pools", "luna-grey", "coastal-blues", "coastal-blues", "4:12", 2024, "Indie Soul", "1,440,229"),
  song(25, "Endless Summer", "luna-grey", "coastal-blues", "coastal-blues", "3:39", 2024, "Indie Soul", "2,904,113"),
  song(26, "Driftwood", "luna-grey", "coastal-blues", "coastal-blues", "4:28", 2024, "Indie Soul", "980,775"),

  // slow motion - ivy monroe
  song(27, "Slow Motion", "ivy-monroe", "slow-motion", "slow-motion", "4:48", 2023, "Ambient Classical", "1,120,443"),
  song(28, "First Light", "ivy-monroe", "slow-motion", "slow-motion", "3:56", 2023, "Ambient Classical", "804,220"),
  song(29, "Glass Piano", "ivy-monroe", "slow-motion", "slow-motion", "5:12", 2023, "Ambient Classical", "655,009"),
  song(30, "Winter Study", "ivy-monroe", "slow-motion", "slow-motion", "4:20", 2023, "Ambient Classical", "498,117"),
  song(31, "Quiet Rooms", "ivy-monroe", "slow-motion", "slow-motion", "6:01", 2023, "Ambient Classical", "377,540"),

  // solar flare - mira sol
  song(32, "Solar Flare", "mira-sol", "solar-flare", "solar-flare", "3:15", 2025, "Pop", "5,220,417"),
  song(33, "Gold Rush", "mira-sol", "solar-flare", "solar-flare", "3:02", 2025, "Pop", "4,109,882"),
  song(34, "Sunspot", "mira-sol", "solar-flare", "solar-flare", "2:47", 2025, "Pop", "3,004,551"),
  song(35, "Heatwave", "mira-sol", "solar-flare", "solar-flare", "3:33", 2025, "Pop", "2,456,109"),
  song(36, "Eclipse", "mira-sol", "solar-flare", "solar-flare", "4:01", 2025, "Pop", "1,880,332"),

  // velvet room - ariana wilde
  song(37, "Velvet Room", "ariana-wilde", "velvet-room", "velvet-room", "4:12", 2024, "R&B", "6,004,771"),
  song(38, "Midnight Silk", "ariana-wilde", "velvet-room", "velvet-room", "3:48", 2024, "R&B", "4,882,306"),
  song(39, "Slow Dance", "ariana-wilde", "velvet-room", "velvet-room", "4:33", 2024, "R&B", "3,220,118"),
  song(40, "Candlelight", "ariana-wilde", "velvet-room", "velvet-room", "3:21", 2024, "R&B", "2,710,449"),
  song(41, "Gold Chain", "ariana-wilde", "velvet-room", "velvet-room", "3:59", 2024, "R&B", "1,994,207"),

  // static bloom - the paper hearts
  song(42, "Static Bloom", "the-paper-hearts", "static-bloom", "static-bloom", "3:41", 2025, "Indie Rock", "980,220"),
  song(43, "Cassette Summer", "the-paper-hearts", "static-bloom", "static-bloom", "3:08", 2025, "Indie Rock", "712,449"),
  song(44, "Basement Show", "the-paper-hearts", "static-bloom", "static-bloom", "2:54", 2025, "Indie Rock", "598,003"),
  song(45, "Paper Hearts", "the-paper-hearts", "static-bloom", "static-bloom", "4:07", 2025, "Indie Rock", "455,881"),
  song(46, "Fading Signal", "the-paper-hearts", "static-bloom", "static-bloom", "3:36", 2025, "Indie Rock", "388,120"),

  // quiet hours - noah bennett
  song(47, "Quiet Hours", "noah-bennett", "quiet-hours", "quiet-hours", "2:58", 2023, "Lo-Fi", "1,204,338"),
  song(48, "Rain on Glass", "noah-bennett", "quiet-hours", "quiet-hours", "3:14", 2023, "Lo-Fi", "980,112"),
  song(49, "3AM Study", "noah-bennett", "quiet-hours", "quiet-hours", "2:41", 2023, "Lo-Fi", "760,449"),
  song(50, "Coffee Steam", "noah-bennett", "quiet-hours", "quiet-hours", "3:02", 2023, "Lo-Fi", "620,318"),
  song(51, "Soft Static", "noah-bennett", "quiet-hours", "quiet-hours", "3:27", 2023, "Lo-Fi", "540,007"),

  // singles
  song(52, "Afterglow", "mira-sol", null, "afterglow", "3:33", 2025, "Pop", "2,004,117"),
  song(53, "Glass Waves", "kai-rivers", null, "glass-waves", "4:09", 2024, "Electronic", "1,332,540"),
  song(54, "Honey Static", "ariana-wilde", null, "honey-static", "3:57", 2023, "R&B", "1,880,229"),
  song(55, "Northbound", "zaid-amir", null, "northbound", "3:21", 2024, "Acoustic", "940,004"),
  song(56, "Paper Planes", "the-paper-hearts", null, "paper-planes", "3:44", 2022, "Indie Rock", "702,118"),
  song(57, "Wildflower", "sol-reed", null, "wildflower", "5:06", 2021, "Jazz", "612,883"),

  // extra tracks that sit on existing albums
  song(58, "Low Tide", "kai-rivers", "night-drive", "night-drive", "4:02", 2022, "Electronic", "1,120,554"),
  song(59, "Amber Room", "sol-reed", "velvet-room", "velvet-room", "5:24", 2024, "Jazz", "402,118"),
  song(60, "Signal Fade", "dre-vale", "solar-flare", "solar-flare", "3:12", 2025, "Hip Hop", "3,004,662"),
  song(61, "Skyline Theory", "dre-vale", "city-lights", "city-lights", "3:38", 2023, "Hip Hop", "2,441,700"),
  song(62, "North Star", "zaid-amir", "coastal-blues", "coastal-blues", "3:29", 2024, "Acoustic", "1,208,441"),
  song(63, "Half Past Two", "sol-reed", "quiet-hours", "quiet-hours", "4:47", 2020, "Jazz", "355,220"),
  song(64, "Wildfire", "dre-vale", "static-bloom", "static-bloom", "3:56", 2022, "Hip Hop", "1,904,338")
];

// what the home page shows as recently played, and the songs liked by default
const COLLECTIONS = {
  recentlyPlayed: [
    "neon-skies", "velvet-room", "night-drive", "coastal-blues", "solar-flare",
    "quiet-hours", "paper-moons", "city-lights", "slow-motion", "static-bloom"
  ],
  likedSongs: [
    1, 6, 22, 37, 47, 17, 32, 11, 52, 59, 2, 27
  ]
};

// playlists
const PLAYLISTS = [
  {
    id: "chill-vibes", title: "Chill Vibes", slug: "chill-vibes", owner: "WaveMusic",
    description: "Relaxing music for late nights and peaceful moments.",
    tracks: [1, 22, 17, 47, 27, 19, 48, 11, 21, 25, 3, 49, 51, 18, 24, 50, 15, 5, 20, 16, 28, 23, 29, 4]
  },
  {
    id: "late-night-coding", title: "Late Night Coding", slug: "late-night-coding", owner: "You",
    description: "Deep focus beats for shipping code after midnight.",
    tracks: [11, 47, 27, 48, 13, 49, 53, 12, 50, 51, 28, 15, 14, 29, 30, 16]
  },
  {
    id: "workout-mix", title: "Workout Mix", slug: "workout-mix", owner: "You",
    description: "High energy tracks to keep you moving through the last rep.",
    tracks: [32, 60, 64, 33, 37, 34, 35, 6, 61, 36, 38, 13, 11, 40]
  },
  {
    id: "study-session", title: "Study Session", slug: "study-session", owner: "WaveMusic",
    description: "Calm instrumentals and soft electronics for long study hours.",
    tracks: [27, 28, 29, 30, 31, 47, 48, 49, 50, 51, 63, 59, 19, 57]
  },
  {
    id: "road-trip", title: "Road Trip", slug: "road-trip", owner: "You",
    description: "Windows down, volume up. Songs for the long drive.",
    tracks: [25, 1, 6, 22, 55, 2, 10, 7, 62, 23, 33, 12, 24, 8, 26]
  },
  {
    id: "focus-mode", title: "Focus Mode", slug: "focus-mode", owner: "WaveMusic",
    description: "Minimal, distraction free sound for deep work.",
    tracks: [30, 31, 29, 47, 49, 50, 13, 28, 63, 15, 51, 16]
  },
  {
    id: "gym-energy", title: "Gym Energy", slug: "gym-energy", owner: "You",
    description: "Heavy bass and fast tempos. No skipping allowed.",
    tracks: [60, 64, 32, 11, 61, 13, 33, 34, 12, 36, 14]
  },
  {
    id: "rainy-night", title: "Rainy Night", slug: "rainy-night", owner: "WaveMusic",
    description: "Soft, moody songs for a rainy evening indoors.",
    tracks: [8, 41, 22, 17, 48, 26, 39, 20, 56, 5, 21, 31, 54]
  },
  {
    id: "coding-session", title: "Coding Session", slug: "coding-session", owner: "You",
    description: "Steady electronic grooves that keep the flow going.",
    tracks: [11, 53, 12, 13, 14, 15, 16, 58, 47, 27, 30]
  }
];

// the made for you mixes on the home page
const MIXES = [
  { id: "daily-mix-01", title: "Daily Mix 01", slug: "daily-mix-01", palette: "dailyMix01", subtitle: "Nova Lane, Luna Grey, Mira Sol",
    description: "A daily blend of your dream pop and indie soul favourites.",
    tracks: [1, 22, 17, 32, 2, 25, 3, 33] },
  { id: "daily-mix-02", title: "Daily Mix 02", slug: "daily-mix-02", palette: "dailyMix02", subtitle: "Kai Rivers, Noah Bennett",
    description: "Electronic and lo-fi tracks picked from your recent listening.",
    tracks: [11, 47, 53, 13, 48, 12, 49, 58] },
  { id: "chill-mix", title: "Chill Mix", slug: "chill-mix", subtitle: "Chill, laid back, easy",
    description: "Smooth songs to slow the evening down.",
    tracks: [22, 26, 19, 39, 17, 41, 21, 20] },
  { id: "focus-mix", title: "Focus Mix", slug: "focus-mix", subtitle: "Instrumental and ambient",
    description: "Beat driven but never distracting.",
    tracks: [27, 30, 31, 29, 50, 49, 63, 15] },
  { id: "discover-mix", title: "Discover Mix", slug: "discover-mix", subtitle: "New artists to try",
    description: "Fresh names from the WaveMusic catalogue.",
    tracks: [42, 56, 55, 44, 62, 45, 46, 43] },
  { id: "throwback-mix", title: "Throwback Mix", slug: "throwback-mix", subtitle: "Older favourites",
    description: "Songs from the early days of your library.",
    tracks: [63, 56, 17, 58, 18, 64, 59, 19] }
];

// the cards on the search page, each mapped to a genre in the song list
const CATEGORIES = [
  { id: "pop", title: "Pop", genre: "Pop", palette: "solarFlare", icon: "sparkles" },
  { id: "rock", title: "Rock", genre: "Indie Rock", palette: "nightDrive", icon: "guitar" },
  { id: "hip-hop", title: "Hip Hop", genre: "Hip Hop", palette: "honeyStatic", icon: "mic" },
  { id: "r-and-b", title: "R&B", genre: "R&B", palette: "velvetRoom", icon: "heart" },
  { id: "jazz", title: "Jazz", genre: "Jazz", palette: "paperMoons", icon: "saxophone" },
  { id: "electronic", title: "Electronic", genre: "Electronic", palette: "glassWaves", icon: "waveform" },
  { id: "lo-fi", title: "Lo-Fi", genre: "Lo-Fi", palette: "quietHours", icon: "headphones" },
  { id: "indie", title: "Indie", genre: "Indie Soul", palette: "staticBloom", icon: "star" },
  { id: "classical", title: "Classical", genre: "Ambient Classical", palette: "slowMotion", icon: "music" },
  { id: "workout", title: "Workout", genre: "Alt Pop", palette: "workoutMix", icon: "flame" },
  { id: "chill", title: "Chill", genre: "Dream Pop", palette: "chillVibes", icon: "moon" },
  { id: "road-trip", title: "Road Trip", genre: "Acoustic", palette: "roadTrip", icon: "compass" }
];

// build one song object, and keeps the big list above short
function song(id, title, artist, album, coverKey, duration, year, genre, plays) {
  return {
    id,
    title,
    artist,
    album,
    cover: coverKey,
    audio: "assets/audio/" + id + ".mp3",
    duration,
    year,
    genre,
    plays
  };
}

// lookups by id, so the rest of the app can find things quickly
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

// artwork paths, one folder per album, artist or playlist
function albumCover(slug) { return "assets/albums/" + slug + "/cover.svg"; }
function artistCover(slug) { return "assets/artists/" + slug + "/cover.svg"; }
function artistHero(slug) { return "assets/artists/" + slug + "/hero.svg"; }
function playlistCover(slug) { return "assets/playlists/" + slug + "/cover.svg"; }

// turn a folder name like "neon-skies" into the palette key "neonSkies"
function paletteForCover(kebabKey) {
  const camel = String(kebabKey).replace(/-([a-z0-9])/g, (m, c) => c.toUpperCase());
  return PALETTES[camel] || PALETTES.brand;
}

// other artists for the fans also like row
function similarArtists(artistId, limit) {
  const others = ARTISTS.filter((a) => a.id !== artistId);
  return others.slice(0, limit || 6);
}
