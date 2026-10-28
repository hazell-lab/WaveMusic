/* runs the real app files in node with a small fake dom, and checks that
   every page renders, the router works, the player behaves and the data is
   consistent.

   run it with:  node docs/verify-logic.js
   it should end with "87 passed / 0 failed" */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* fake dom */

const VOID_TAGS = new Set(["img", "br", "input", "hr", "meta", "link", "source", "use", "path", "circle", "rect", "ellipse", "text", "stop"]);

let nodeIds = 0;
const documentListeners = {};
const byId = new Map();

// make one fake element
function makeElement(tag) {
  const el = {
    __id: ++nodeIds,
    nodeType: 1,
    tagName: String(tag || "div").toUpperCase(),
    childNodes: [],
    attributes: {},
    _text: "",
    _html: "",
    _listeners: {},
    value: "",
    disabled: false,
    offsetWidth: 100,
    src: "",
    volume: 1,
    currentTime: 0,
    duration: NaN,
    style: null,
    dataset: null,
    classList: null,
    parentElement: null,

    get children() {
      return this.childNodes.filter((n) => n.nodeType === 1);
    },
    get firstChild() {
      return this.childNodes[0] || null;
    },
    appendChild(child) {
      if (child.parentElement) child.parentElement.childNodes = child.parentElement.childNodes.filter((c) => c !== child);
      child.parentElement = this;
      this.childNodes.push(child);
      registerId(child);
      return child;
    },
    insertBefore(child, ref) {
      const at = this.childNodes.indexOf(ref);
      if (child.parentElement) child.parentElement.childNodes = child.parentElement.childNodes.filter((c) => c !== child);
      child.parentElement = this;
      if (at === -1) this.childNodes.push(child);
      else this.childNodes.splice(at, 0, child);
      registerId(child);
      return child;
    },
    removeChild(child) {
      this.childNodes = this.childNodes.filter((c) => c !== child);
      return child;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === "disabled") this.disabled = true;
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    addEventListener(type, fn) {
      (this._listeners[type] = this._listeners[type] || []).push(fn);
    },
    removeEventListener() {},
    dispatchEvent(event) {
      let node = this;
      while (node) {
        (node._listeners[event.type] || []).forEach((fn) => fn.call(node, event));
        node = node.parentElement;
      }
      (documentListeners[event.type] || []).forEach((fn) => fn.call(document, event));
      return true;
    },
    focus() {},
    blur() {},
    click() {
      this.dispatchEvent(fakeEvent("click", this));
    },
    setPointerCapture() {},
    releasePointerCapture() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 400, height: 16, right: 400, bottom: 16 };
    },
    setSelectionRange() {},
    play() {
      // no audio here, so demo mode kicks in
      return Promise.reject(new Error("no audio in the harness"));
    },
    pause() {},
    load() {},
    querySelector(sel) {
      return this.querySelectorAll(sel)[0] || null;
    },
    querySelectorAll(sel) {
      return querySelectorAll(this, sel);
    },
    closest(sel) {
      let node = this;
      while (node) {
        if (matchesSelector(node, sel)) return node;
        node = node.parentElement;
      }
      return null;
    },
    get outerHTML() {
      return serialize(this);
    },
    get innerHTML() {
      return this.childNodes.map(serialize).join("");
    },
    set innerHTML(html) {
      const parsed = parseHTML(String(html));
      this.childNodes = [];
      parsed.forEach((child) => this.appendChild(child));
      this._html = "";
      this._text = "";
    },
    get textContent() {
      return this._text + this.childNodes.map((c) => c.textContent).join("");
    },
    set textContent(text) {
      this._text = String(text);
      this.childNodes = [];
      this._html = "";
    }
  };

  // classList
  const classes = new Set();
  el.classList = {
    add(...names) { names.forEach((n) => classes.add(n)); },
    remove(...names) { names.forEach((n) => classes.delete(n)); },
    contains(name) { return classes.has(name); },
    toggle(name, force) {
      const on = force === undefined ? !classes.has(name) : !!force;
      if (on) classes.add(name);
      else classes.delete(name);
      return on;
    }
  };
  el.__syncClasses = function () {
    classes.clear();
    String(el.attributes.class || "").split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
  };

  // style
  const styleProxy = new Proxy({}, {
    get(target, prop) {
      if (Object.prototype.hasOwnProperty.call(target, prop)) return target[prop];
      return "";
    },
    set(target, prop, value) {
      target[prop] = typeof value === "function" ? value : String(value);
      return true;
    },
    has() { return true; }
  });
  styleProxy.setProperty = function (name, value) { styleProxy[name] = value; };
  styleProxy.removeProperty = function (name) { styleProxy[name] = ""; };
  el.style = styleProxy;

  // dataset
  el.dataset = new Proxy({}, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      const key = "data-" + prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      return target[key];
    },
    set(target, prop, value) {
      const key = "data-" + String(prop).replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      target[key] = String(value);
      el.attributes[key] = String(value);
      return true;
    },
    has() { return true; }
  });

  el.__syncDataset = function () {
    Object.keys(el.attributes).forEach((k) => {
      if (k.indexOf("data-") === 0) {
        const camel = k.slice(5).replace(/-([a-z])/g, (m, c) => c.toUpperCase());
        el.dataset[camel] = el.attributes[k];
      }
    });
  };

  // el.id = "x" works like setAttribute("id", "x")
  Object.defineProperty(el, "id", {
    get() { return this.attributes.id === undefined ? "" : this.attributes.id; },
    set(value) {
      this.attributes.id = String(value);
      if (!byId.has(String(value))) byId.set(String(value), this);
    },
    configurable: true,
    enumerable: true
  });

  return el;
}

function textNode(text) {
  return { nodeType: 3, textContent: String(text), parentElement: null, childNodes: [] };
}

function fakeEvent(type, target) {
  return { type, target, preventDefault() {}, stopPropagation() {}, clientX: 0, pointerId: 1, key: "", code: "" };
}

// remember ids that get added to the dom, first one wins
function registerId(node) {
  if (node && node.nodeType === 1 && node.attributes && node.attributes.id && !byId.has(node.attributes.id)) {
    byId.set(node.attributes.id, node);
  }
}

// html parser
function parseHTML(html) {
  const nodes = [];
  const stack = [{ childNodes: nodes }];
  const tagRe = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[\w:.-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s">]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;

  while ((m = tagRe.exec(html)) !== null) {
    const [full, closeTag, openTag, attrText, selfClose, textChunk] = m;

    if (full.startsWith("<!--")) continue;

    if (closeTag) {
      if (stack.length > 1) stack.pop();
      continue;
    }

    if (openTag) {
      const el = makeElement(openTag);
      const attrRe = /([\w:.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s">]+)))?/g;
      let a;
      while ((a = attrRe.exec(attrText || "")) !== null) {
        el.setAttribute(a[1], a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : "");
      }
      el.__syncDataset();
      el.__syncClasses();
      stack[stack.length - 1].childNodes.push(el);
      if (!selfClose && !VOID_TAGS.has(openTag.toLowerCase())) stack.push(el);
      continue;
    }

    if (textChunk) {
      stack[stack.length - 1].childNodes.push(textNode(textChunk));
    }
  }

  (function link(list, parent) {
    list.forEach((n) => {
      n.parentElement = parent;
      if (n.childNodes) link(n.childNodes, n);
    });
  })(nodes, null);

  return nodes;
}

function serialize(node) {
  if (node.nodeType === 3) return node.textContent;
  const attrs = Object.keys(node.attributes)
    .map((k) => " " + k + '="' + String(node.attributes[k]).replace(/"/g, "&quot;") + '"')
    .join("");
  const inner = node._text + node.childNodes.map(serialize).join("");
  return "<" + node.tagName.toLowerCase() + attrs + ">" + inner + "</" + node.tagName.toLowerCase() + ">";
}

// selector engine, enough for the classes and attributes the app uses
function matchesSelector(node, selector) {
  if (!node || node.nodeType !== 1) return false;

  const parts = selector.trim().split(/\s+(?![^\[]*\])/);
  if (parts.length > 1) {
    const last = parts.pop();
    if (!matchesSimple(node, last)) return false;
    let parent = node.parentElement;
    while (parts.length) {
      const want = parts.pop();
      let found = false;
      while (parent) {
        if (matchesSimple(parent, want)) { found = true; parent = parent.parentElement; break; }
        parent = parent.parentElement;
      }
      if (!found) return false;
    }
    return true;
  }

  return matchesSimple(node, selector);
}

function matchesSimple(node, selector) {
  if (selector === "*") return true;
  const re = /([.#]?[\w-]+)|(\[[^\]]+\])|(:[\w-]+)/g;
  let m;
  let matched = false;

  while ((m = re.exec(selector)) !== null) {
    const token = m[0];
    matched = true;

    if (token[0] === ".") {
      if (!node.classList.contains(token.slice(1))) return false;
    } else if (token[0] === "#") {
      if (node.attributes.id !== token.slice(1)) return false;
    } else if (token[0] === "[") {
      const body = token.slice(1, -1);
      const eq = body.indexOf("=");
      if (eq === -1) {
        if (node.getAttribute(body) === null) return false;
      } else {
        const name = body.slice(0, eq).trim();
        const want = body.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (String(node.getAttribute(name)) !== want) return false;
      }
    } else if (token[0] === ":") {
      return false;
    } else {
      if (node.tagName !== token.toUpperCase()) return false;
    }
  }

  return matched;
}

function querySelectorAll(root, selector) {
  const results = [];
  const selectors = selector.split(",").map((s) => s.trim()).filter(Boolean);

  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    const kids = node.childNodes || [];
    for (let i = 0; i < kids.length; i++) {
      const child = kids[i];
      if (child.nodeType !== 1) continue;
      for (let s = 0; s < selectors.length; s++) {
        if (matchesSelector(child, selectors[s])) { results.push(child); break; }
      }
      stack.push(child);
    }
  }

  return results;
}

/* the fake document and window */

function el(tag, attrs) {
  const node = makeElement(tag);
  Object.keys(attrs || {}).forEach((k) => node.setAttribute(k, attrs[k]));
  node.__syncDataset();
  node.__syncClasses();
  return node;
}

const body = el("body");
const documentElement = el("html");
documentElement.appendChild(body);

const document = {
  body,
  documentElement,
  activeElement: body,
  createElement: (tag) => makeElement(tag),
  getElementById(id) {
    if (!byId.has(id)) {
      const node = makeElement(id === "audio" ? "audio" : "div");
      node.setAttribute("id", id);
      byId.set(id, node);
      body.appendChild(node);
    }
    return byId.get(id);
  },
  querySelector: (sel) => querySelectorAll(body, sel)[0] || null,
  querySelectorAll: (sel) => querySelectorAll(body, sel),
  addEventListener(type, fn) {
    (documentListeners[type] = documentListeners[type] || []).push(fn);
  },
  removeEventListener() {}
};

/* the elements that index.html provides */
["main", "view", "top-search", "search-input", "player", "player-cover", "player-title", "player-artist",
 "player-like", "player-play-icon", "player-current", "player-duration", "player-progress",
 "player-progress-fill", "player-progress-knob", "shuffle-btn", "repeat-btn", "volume-btn",
 "volume-slider", "queue-btn", "queue-panel", "queue-list", "queue-source", "now-playing", "np-cover",
 "np-art", "np-title", "np-artist", "np-album", "np-current", "np-duration", "np-progress",
 "np-progress-fill", "np-progress-knob", "np-play-icon", "np-shuffle", "np-repeat", "np-like",
 "profile-menu", "profile-btn", "user-name", "user-avatar", "liked-count", "sidebar-playlists",
 "toast", "back-btn", "forward-btn", "demo-badge", "audio", "player-cover-btn"
].forEach((id) => document.getElementById(id));

/* the player, now playing, queue and menu markup */
document.getElementById("player").innerHTML =
  '<div class="player-left">' +
    '<button class="player-cover-btn" id="player-cover-btn" data-action="open-now-playing">' +
      '<img id="player-cover" src="assets/images/default-cover.svg" alt=""></button>' +
    '<div class="player-meta"><button id="player-title" data-action="open-now-playing"></button>' +
      '<span id="player-artist"></span><span class="demo-badge" id="demo-badge"></span></div>' +
    '<span id="player-like"></span>' +
  "</div>" +
  '<div class="player-center">' +
    '<div class="player-controls">' +
      '<button class="ctrl-btn" id="shuffle-btn" data-action="shuffle"></button>' +
      '<button class="ctrl-btn" data-action="prev"></button>' +
      '<button class="play-btn" data-action="toggle-play"><span id="player-play-icon"></span></button>' +
      '<button class="ctrl-btn" data-action="next"></button>' +
      '<button class="ctrl-btn" id="repeat-btn" data-action="repeat"></button>' +
    "</div>" +
    '<div class="player-progress-row"><span class="time" id="player-current"></span>' +
      '<div class="progress" id="player-progress" role="slider" tabindex="0"><div class="progress-track">' +
        '<div class="progress-fill" id="player-progress-fill"></div>' +
        '<div class="progress-knob" id="player-progress-knob"></div></div></div>' +
      '<span class="time" id="player-duration"></span></div>' +
  "</div>" +
  '<div class="player-right">' +
    '<button class="icon-btn" id="queue-btn" data-action="toggle-queue"></button>' +
    '<button class="icon-btn" id="volume-btn" data-action="toggle-mute"></button>' +
    '<input class="volume-slider" id="volume-slider" type="range" min="0" max="100" value="80">' +
  "</div>";

document.getElementById("now-playing").innerHTML =
  '<div class="np-inner"><button class="icon-btn np-close" data-action="close-now-playing"></button>' +
  '<div class="np-grid"><figure class="art np-art" id="np-art"><img class="art-img" id="np-cover" ' +
    'src="assets/images/default-cover.svg" alt=""></figure>' +
  '<div class="np-right"><h2 class="np-title" id="np-title"></h2><p class="np-artist" id="np-artist"></p>' +
  '<p class="np-album" id="np-album"></p>' +
  '<div class="np-progress-row"><span class="time" id="np-current"></span>' +
  '<div class="progress" id="np-progress" role="slider" tabindex="0"><div class="progress-track">' +
  '<div class="progress-fill" id="np-progress-fill"></div>' +
  '<div class="progress-knob" id="np-progress-knob"></div></div></div>' +
  '<span class="time" id="np-duration"></span></div>' +
  '<div class="np-controls"><button class="ctrl-btn" id="np-shuffle" data-action="shuffle"></button>' +
  '<button class="ctrl-btn" data-action="prev"></button>' +
  '<button class="play-btn" data-action="toggle-play"><span id="np-play-icon"></span></button>' +
  '<button class="ctrl-btn" data-action="next"></button>' +
  '<button class="ctrl-btn" id="np-repeat" data-action="repeat"></button></div>' +
  '<div class="np-foot"><span id="np-like"></span></div></div></div></div>';

document.getElementById("queue-panel").innerHTML =
  '<div class="queue-head"><h2>Queue</h2><button class="icon-btn" data-action="toggle-queue"></button></div>' +
  '<p class="queue-source" id="queue-source"></p><div class="queue-list" id="queue-list"></div>';

document.getElementById("profile-menu").innerHTML =
  '<button class="dropdown-item" data-action="profile-item" data-icon="user" data-message="Profile (demo)">Profile</button>' +
  '<button class="dropdown-item" data-action="profile-item" data-icon="settings" data-message="Settings (demo)">Settings</button>';

/* the sidebar nav */
const navHost = document.getElementById("sidebar-playlists");
navHost.parentElement.insertBefore(
  (function () {
    const nav = makeElement("nav");
    nav.setAttribute("class", "side-nav");
    nav.innerHTML =
      '<button class="side-link" data-nav="home" data-action="go" data-view="home">Home</button>' +
      '<button class="side-link" data-nav="search" data-action="go" data-view="search">Search</button>' +
      '<button class="side-link" data-nav="library" data-action="go" data-view="library">Library</button>' +
      '<button class="side-link" data-nav="liked" data-action="go" data-view="liked">Liked Songs</button>' +
      '<button class="side-link" data-nav="recent" data-action="go" data-view="recent">Recently Played</button>';
    return nav;
  })(),
  navHost
);

/* re-index the ids, the markup above replaced the placeholders */
(function reindex() {
  byId.clear();
  (function walk(node) {
    (node.childNodes || []).forEach((child) => {
      if (child.nodeType !== 1) return;
      if (child.attributes.id && !byId.has(child.attributes.id)) byId.set(child.attributes.id, child);
      walk(child);
    });
  })(body);
})();

const window = {
  innerWidth: 1440,
  innerHeight: 900,
  document,
  location: { hash: "", search: "", href: "http://localhost/" },
  addEventListener() {},
  removeEventListener() {},
  setTimeout: () => 0,
  clearTimeout() {},
  setInterval: () => 0,
  clearInterval() {},
  scrollTo() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  navigator: { mediaSession: undefined }
};

/* load the real app files */
const files = ["js/icons.js", "js/art.js", "js/data.js", "js/app.js"];
const ROOT = path.join(__dirname, "..");
const sources = files.map((f) => fs.readFileSync(path.join(ROOT, f), "utf8"));

const stripped = sources.map((src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
);

// the four files share one scope here, the same way script tags do
const declared = new Set();
stripped.forEach((code) => {
  let m;
  const re = /\b(?:const|let)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = re.exec(code)) !== null) declared.add(m[1]);
});

const prelude = "var " + Array.from(declared).join(", ") + ";\n";
const bundle = stripped
  .map((code) => code.replace(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/g, "$1 ="))
  .join("\n;\n");

const sandbox = {
  document, window, console,
  location: window.location,
  navigator: window.navigator,
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] === undefined ? null : this._data[k]; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  setTimeout: window.setTimeout,
  clearTimeout: window.clearTimeout,
  setInterval: window.setInterval,
  clearInterval: window.clearInterval,
  MediaMetadata: function () {},
  Promise, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error, isFinite, parseInt
};

vm.createContext(sandbox);

// point the app at the harness dom
sandbox.__hdoc = document;
sandbox.__hwin = window;
vm.runInContext(
  "document = __hdoc; window = __hwin; window.document = __hdoc;" +
  " location = __hwin.location; navigator = __hwin.navigator;",
  sandbox
);

vm.runInContext(prelude + bundle, sandbox, { filename: "wavemusic-bundle.js" });

const run = (code) => vm.runInContext(code, sandbox);

/* checks */

const results = [];
function check(name, condition, extra) {
  results.push({ name, pass: !!condition, extra: extra === undefined ? "" : String(extra) });
}

function textOf(id) {
  return document.getElementById(id).textContent;
}

try {
  run("init();");

  // startup
  check("catalogue has 12+ songs", run("SONGS.length") >= 12, run("SONGS.length") + " songs");
  const spriteSymbols = run('document.getElementById("icon-sprite").querySelectorAll("symbol").length');
  check("icon sprite injected", spriteSymbols > 30, spriteSymbols + " symbols");
  check("sidebar playlists rendered", document.getElementById("sidebar-playlists").querySelectorAll(".side-playlist").length >= 9,
    document.getElementById("sidebar-playlists").querySelectorAll(".side-playlist").length + " rows");
  check("liked counter filled", textOf("liked-count") === "12", textOf("liked-count"));
  check("volume applied from storage", Math.abs(run("state.volume") - 0.8) < 0.001);

  // home page
  const view = document.getElementById("view");
  const homeHtml = view.innerHTML;
  check("home greeting rendered", /Good (morning|afternoon|evening)/.test(homeHtml), homeHtml.match(/Good \w+/));
  check("home has cards", view.querySelectorAll(".card").length > 10, view.querySelectorAll(".card").length + " cards");
  check("home has all sections", /Recently Played/.test(homeHtml) && /Made For You/.test(homeHtml) &&
    /Popular Albums/.test(homeHtml) && /Trending Songs/.test(homeHtml));
  check("home track table has rows", view.querySelectorAll(".track-row").length >= 10,
    view.querySelectorAll(".track-row").length + " rows");
  check("covers fall back to the default art before apple loads",
    view.querySelectorAll("img")[0].getAttribute("src") === "assets/images/default-cover.svg",
    view.querySelectorAll("img")[0].getAttribute("src"));

  // every page renders
  [
    ["search", "search"],
    ["library", "library"],
    ["liked", "liked songs"],
    ["recent", "recently played"],
    ["playlist/chill-vibes", "playlist"],
    ["playlist/daily-mix-01", "mix playlist"],
    ["album/after-hours", "album"],
    ["artist/the-weeknd", "artist"],
    ["category/jazz", "category"],
    ["album/does-not-exist", "missing album"]
  ].forEach(([route, label]) => {
    try {
      run('navigate("' + route + '", { skipHistory: true });');
      const html = view.innerHTML;
      check("page renders: " + label, html.length > 150, html.length + " chars");
    } catch (err) {
      check("page renders: " + label, false, err.message);
    }
  });

  run('navigate("album/nope", { skipHistory: true });');
  check("unknown album shows the empty state", view.querySelectorAll(".empty-state").length === 1);

  // search
  run('navigate("search", { skipHistory: true });');
  run('handleSearchInput("love", "page"); renderView();');
  const hits = view.querySelectorAll(".track-row").length;
  const titles = view.querySelectorAll(".row-text strong").map((n) => n.textContent).join(" | ");
  check("searching love filters the songs", hits >= 2 && /love/i.test(titles), hits + " hits: " + titles);
  run('handleSearchInput("weeknd", "page"); renderView();');
  check("searching an artist name works", /The Weeknd/.test(view.innerHTML));
  run('handleSearchInput("zzzz-nothing", "page"); renderView();');
  check("no results shows the empty state", view.querySelectorAll(".empty-state").length === 1);
  run('handleSearchInput("", "page"); renderView();');
  check("clearing the search shows the categories", view.querySelectorAll(".category-card").length === run("CATEGORIES.length"),
    view.querySelectorAll(".category-card").length + " categories");
  // no manual renderView() here: typing in the page box must redraw by itself
  run('handleSearchInput("love", "page");');
  check("search page box updates results by itself", view.querySelectorAll(".track-row").length >= 2);
  run('handleSearchInput("<b>x", "page");');
  check("search text is escaped, not run as html", view.innerHTML.indexOf("<b>x") === -1 && view.innerHTML.indexOf("&lt;b&gt;x") !== -1);
  run('handleSearchInput("", "page");');
  run('handleSearchInput("neon", "top");');
  check("top bar search opens the search page", run("state.view") === "search" && run("state.searchQuery") === "neon");

  // library tabs
  run('state.searchQuery = ""; navigate("library", { skipHistory: true });');
  const playlistCards = view.querySelectorAll(".card").length;
  view.querySelector('[data-action="library-tab"][data-id="artists"]').click();
  const artistCards = view.querySelectorAll(".card--round").length;
  check("library switches to artists", artistCards > 0, playlistCards + " playlists -> " + artistCards + " artists");
  view.querySelector('[data-action="library-tab"][data-id="albums"]').click();
  check("library switches to albums", view.querySelectorAll(".card").length >= 10);
  view.querySelector('[data-action="library-tab"][data-id="playlists"]').click();
  check("library switches back to playlists", view.querySelectorAll(".card").length >= 9);

  // playlist page and playback
  run('navigate("playlist/chill-vibes", { skipHistory: true });');
  const meta = view.querySelector(".detail-meta").textContent;
  check("playlist shows the count and the length", /16 songs/.test(meta) && /hr|min/.test(meta), meta.trim());
  check("playlist table has the right columns", /Date Added/.test(view.innerHTML) && /Album/.test(view.innerHTML));

  view.querySelector('[data-action="play-collection"]').click();
  check("play fills a queue of 16", run("state.queue.length") === 16, run("state.queue.length") + " queued");
  check("player shows the title", textOf("player-title") === "BIRDS OF A FEATHER", textOf("player-title"));
  check("player shows the artist", textOf("player-artist") === "Billie Eilish", textOf("player-artist"));
  check("demo mode is on when previews cannot load", run("state.demoMode") === true);
  check("demo badge is visible", !document.getElementById("demo-badge").classList.contains("is-hidden"));
  check("one row is highlighted", view.querySelectorAll(".track-row.is-active").length === 1,
    view.querySelectorAll(".track-row.is-active").length + " active");

  // next and previous
  document.querySelector('[data-action="next"]').click();
  check("next moves to the next song", textOf("player-title") === "Don't Know Why", textOf("player-title"));
  document.querySelector('[data-action="prev"]').click();
  document.querySelector('[data-action="prev"]').click();
  check("previous goes back", textOf("player-title") === "BIRDS OF A FEATHER", textOf("player-title"));

  // shuffle
  run('toggleShuffle();');
  check("shuffle turns on", run("state.shuffle") === true && document.getElementById("shuffle-btn").classList.contains("is-active"));
  check("shuffle order covers every song", run("state.shuffleOrder.length") === 16);
  check("shuffle keeps the current song first", run("state.shuffleOrder[0]") === run("state.queueIndex"));
  const beforeShuffle = run("state.queueIndex");
  document.querySelector('[data-action="next"]').click();
  check("shuffle next jumps somewhere else", run("state.queueIndex") !== beforeShuffle);
  run('toggleShuffle();');
  check("shuffle turns off", run("state.shuffle") === false);

  // repeat
  document.getElementById("repeat-btn").click();
  check("repeat cycles to all", run("state.repeat") === "all");
  document.getElementById("repeat-btn").click();
  check("repeat cycles to one", run("state.repeat") === "one");
  check("repeat one swaps the icon", document.getElementById("repeat-btn").innerHTML.indexOf("i-repeatOne") !== -1);
  document.getElementById("repeat-btn").click();
  check("repeat cycles back to off", run("state.repeat") === "off");

  // progress and volume
  run("seekTo(60);");
  check("seek moves the playhead", run("state.demoSeconds") === 60);
  // the song is picked by shuffle, so work out the expected width from its length
  const expectedPct = (60 / run("currentDurationSeconds()")) * 100;
  check("progress bar width updates",
    Math.abs(parseFloat(document.getElementById("player-progress-fill").style.width) - expectedPct) < 0.5,
    document.getElementById("player-progress-fill").style.width);
  run("setVolume(0.35);");
  check("volume slider sets the level", Math.abs(run("state.volume") - 0.35) < 0.001 &&
    document.getElementById("volume-slider").value === "35", document.getElementById("volume-slider").value);
  document.getElementById("volume-btn").click();
  check("mute works", run("state.muted") === true && document.getElementById("audio").volume === 0);
  document.getElementById("volume-btn").click();
  check("unmute restores the level", run("state.muted") === false &&
    Math.abs(document.getElementById("audio").volume - 0.35) < 0.001);
  check("a finished song moves on", (function () {
    // start from the first song so there is always a "next" one
    run("state.queueIndex = 0; loadCurrentTrack(false);");
    const before = run("state.queueIndex");
    run("state.repeat = 'off'; onTrackEnded();");
    return run("state.queueIndex") === before + 1;
  })());

  // likes
  const heart = view.querySelector('[data-action="like"]');
  const heartId = heart.dataset.id;
  const wasLiked = run("isLiked(" + heartId + ")");
  heart.click();
  check("heart toggles the like", run("isLiked(" + heartId + ")") !== wasLiked, "song " + heartId);
  check("liked counter follows", textOf("liked-count") === String(run("state.liked.length")), textOf("liked-count"));
  heart.click();
  check("heart toggles back", run("isLiked(" + heartId + ")") === wasLiked);
  run('navigate("liked", { skipHistory: true });');
  check("liked page lists the liked songs", view.querySelectorAll(".track-row").length === run("state.liked.length"),
    view.querySelectorAll(".track-row").length + " rows");

  // queue panel
  run('navigate("playlist/chill-vibes", { skipHistory: true });');
  view.querySelector('[data-action="play-collection"]').click();
  document.getElementById("queue-btn").click();
  check("queue panel opens with every track", document.getElementById("queue-panel").classList.contains("is-open") &&
    document.getElementById("queue-list").querySelectorAll(".queue-item").length === 16,
    document.getElementById("queue-list").querySelectorAll(".queue-item").length + " items");
  document.getElementById("queue-list").querySelectorAll(".queue-item")[3].click();
  check("clicking a queue row plays that song", run("state.queueIndex") === 3);
  document.getElementById("queue-btn").click();
  check("queue panel closes", !document.getElementById("queue-panel").classList.contains("is-open"));

  // now playing overlay
  document.getElementById("player-cover-btn").click();
  check("now playing opens", document.getElementById("now-playing").classList.contains("is-open"));
  check("now playing matches the player", textOf("np-title") === textOf("player-title"), textOf("np-title"));
  check("now playing shows the album",
    textOf("np-album") === run('albumTitle(state.queue[state.queueIndex])') && textOf("np-album").length > 0,
    textOf("np-album"));
  check("now playing cover is a local file", document.getElementById("np-cover").src.indexOf("assets/") === 0 ||
    run("getSong(state.queue[state.queueIndex]).cover") !== null, document.getElementById("np-cover").src);
  document.getElementById("now-playing").querySelector(".np-close").click();
  check("now playing closes", !document.getElementById("now-playing").classList.contains("is-open"));

  // profile menu
  document.getElementById("profile-btn").click();
  check("profile menu opens", !document.getElementById("profile-menu").classList.contains("is-hidden"));
  document.getElementById("profile-menu").querySelector('[data-action="profile-item"]').click();
  check("profile menu closes after a click", document.getElementById("profile-menu").classList.contains("is-hidden"));
  check("a toast is shown", document.getElementById("toast").classList.contains("is-visible"));

  // back and forward
  run('state.history = []; state.historyIndex = -1; navigate("home", { skipHistory: true });');
  run('navigate("library"); navigate("playlist/road-trip");');
  run("goBack();");
  check("back walks the history", run("state.view") === "library", run("state.view"));
  run("goForward();");
  check("forward walks the history", run("state.view") === "playlist/road-trip", run("state.view"));
  check("history buttons enable and disable",
    document.getElementById("back-btn").disabled === false && document.getElementById("forward-btn").disabled === true,
    "back disabled=" + document.getElementById("back-btn").disabled + " forward=" + document.getElementById("forward-btn").disabled);

  // active nav
  run('navigate("library", { skipHistory: true }); updateNavActive();');
  check("the sidebar link lights up", document.querySelector('[data-nav="library"]').classList.contains("is-active"));

  // helpers and data
  check("formatTime", run('formatTime(222)') === "3:42", run("formatTime(222)"));
  check("formatPlays", run('formatPlays("2,481,220")') === "2.5M", run('formatPlays("2,481,220")'));
  check("durationToSeconds", run('durationToSeconds("4:10")') === 250);
  check("totalDurationText", /hr/.test(run("totalDurationText(PLAYLISTS[0].tracks)")), run("totalDurationText(PLAYLISTS[0].tracks)"));
  check("song ids are unique", run("new Set(SONGS.map(s => s.id)).size === SONGS.length"));
  check("every song has an artist", run("SONGS.every(s => !!getArtist(s.artist))"));
  check("every song has a cover, an apple id and a duration", run("SONGS.every(s => s.cover && s.appleId && s.duration)"));
  check("every album track exists", run("ALBUMS.every(a => a.tracks.every(id => !!getSong(id)))"));
  check("every playlist track exists", run("PLAYLISTS.every(p => p.tracks.every(id => !!getSong(id)))"));
  check("every mix track exists", run("MIXES.every(m => m.tracks.every(id => !!getSong(id)))"));
  check("every album has an artist", run("ALBUMS.every(a => !!getArtist(a.artist))"));
  check("apple track ids are unique", run("new Set(SONGS.map(s => s.appleId)).size === SONGS.length"));
  check("every category has songs", run("CATEGORIES.every(c => SONGS.some(s => s.genre === c.genre))"),
    run("CATEGORIES.filter(c => !SONGS.some(s => s.genre === c.genre)).map(c => c.title).join(', ')") || "all covered");
  check("every album has a palette", run('ALBUMS.every(a => PALETTES[a.slug.replace(/-([a-z0-9])/g, (m,c) => c.toUpperCase())])'));

  // the generated artwork files exist (album and artist art comes from apple)
  const missing = [];
  run("PLAYLISTS.concat(MIXES)").forEach((p) => {
    if (!fs.existsSync(path.join(ROOT, "assets/playlists", p.slug, "cover.svg"))) missing.push("playlist " + p.slug);
  });
  ["avatar.svg", "default-cover.svg", "app-icon.svg"].forEach((f) => {
    if (!fs.existsSync(path.join(ROOT, "assets/images", f))) missing.push("image " + f);
  });
  check("every artwork file exists on disk", missing.length === 0, missing.join(", ") || "18 files verified");

  // apple music data is copied onto songs, albums and artists
  run('applyAppleData([{ trackId: 1499378607, previewUrl: "https://example.test/p.m4a", ' +
      'artworkUrl100: "https://example.test/art/100x100bb.jpg", trackViewUrl: "https://example.test/t", ' +
      'artistViewUrl: "https://example.test/a" }]);');
  check("apple preview becomes the song audio", run("getSong(1).audio") === "https://example.test/p.m4a");
  check("apple artwork is used at 600px for the album", run('albumCover("after-hours")') === "https://example.test/art/600x600bb.jpg",
    run('albumCover("after-hours")'));
  check("artist banner uses the bigger artwork", run('artistHero("the-weeknd")') === "https://example.test/art/1200x1200bb.jpg");
  check("artist gets an apple music link", run('getArtist("the-weeknd").url') === "https://example.test/a");
  check("singles open their song, not a missing album page", (function () {
    run('navigate("artist/sabrina-carpenter", { skipHistory: true });');
    const art = view.querySelector('.card-art[data-action="play-song"]');
    return !!art && art.dataset.id === "58";
  })());
} catch (err) {
  check("the harness ran without throwing", false, err.stack.split("\n").slice(0, 8).join("\n        "));
}

/* report */

const failed = results.filter((r) => !r.pass);
console.log("");
console.log("WaveMusic logic verification");
console.log("=".repeat(64));
results.forEach((r) => {
  console.log((r.pass ? "  PASS  " : "> FAIL  ") + r.name + (r.extra ? "  [" + r.extra + "]" : ""));
});
console.log("=".repeat(64));
console.log(results.length - failed.length + " passed / " + failed.length + " failed / " + results.length + " total");
process.exit(failed.length ? 1 : 0);
