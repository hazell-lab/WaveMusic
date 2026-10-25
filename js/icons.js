/* icons
   every icon is a hand-written svg, so the app works offline.
   write <i data-icon="play"></i> anywhere and upgradeIcons() swaps it for the
   real svg. */

const ICON_SPRITE = {
  // navigation
  home:
    '<path d="m3 10.2 9-7.2 9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  library:
    '<path d="M4 21V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14"/><path d="M13.5 20.4 17.9 6.1a1.6 1.6 0 0 1 2-1.1l.5.2a1.6 1.6 0 0 1 1.1 2l-4.4 14.3a1.6 1.6 0 0 1-2 1.1l-.5-.2a1.6 1.6 0 0 1-1.1-2z"/><path d="M4 21h9.4"/>',
  heart:
    '<path d="M12 20.3C8 17.6 3 14 3 9.6A4.6 4.6 0 0 1 7.6 5c1.6 0 3.2.9 4.4 2.6C13.2 5.9 14.8 5 16.4 5A4.6 4.6 0 0 1 21 9.6c0 4.4-5 8-9 10.7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.3V12l3.2 2"/>',
  history:
    '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.2 4.5v4.4h4.4"/><path d="M12 8v4.4l3.1 1.9"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2 5.2-5.2 2 2-5.2z"/>',

  // playback
  play: '<path d="M7 4.6 19 12 7 19.4z"/>',
  // solid bars, so it shows up on the filled play buttons too
  pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  skipBack: '<path d="M19 5.5v13L9.5 12z"/><path d="M5 5v14"/>',
  skipForward: '<path d="M5 5.5v13L14.5 12z"/><path d="M19 5v14"/>',
  shuffle:
    '<path d="M17 4l3 3-3 3"/><path d="M17 14l3 3-3 3"/><path d="M20 7h-3.4a4 4 0 0 0-3.3 1.8l-3.6 5.4A4 4 0 0 1 6.4 16H3"/><path d="M20 17h-3.4a4 4 0 0 1-3.3-1.8l-.9-1.4"/><path d="M3 7h3.4a4 4 0 0 1 3.3 1.8l.9 1.4"/>',
  repeat:
    '<path d="m17 3 3 3-3 3"/><path d="M20 6H8a4 4 0 0 0-4 4"/><path d="m7 21-3-3 3-3"/><path d="M4 18h12a4 4 0 0 0 4-4"/>',
  repeatOne:
    '<path d="m17 3 3 3-3 3"/><path d="M20 6H8a4 4 0 0 0-4 4"/><path d="m7 21-3-3 3-3"/><path d="M4 18h12a4 4 0 0 0 4-4"/><path d="M11.6 10.4 13 9.6V14"/>',

  // player, right side
  volume:
    '<path d="M4 9.5h3l4.5-4v13L7 14.5H4z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18.6 7a7 7 0 0 1 0 10"/>',
  volumeLow:
    '<path d="M4 9.5h3l4.5-4v13L7 14.5H4z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5"/>',
  volumeMute:
    '<path d="M4 9.5h3l4.5-4v13L7 14.5H4z"/><path d="m16 10 4 4"/><path d="m20 10-4 4"/>',
  queue:
    '<path d="M4 6.5h11"/><path d="M4 12h11"/><path d="M4 17.5h7"/><path d="M18 10.5v8"/><path d="m15 15.2 3-4.7 3 4.7"/>',
  cast:
    '<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v7a1.5 1.5 0 0 1-1.5 1.5H13"/><path d="M4 17.5h1.5"/><circle cx="5.6" cy="15.4" r="2.6"/><path d="M4 12.6a6 6 0 0 1 6 6"/>',
  devices:
    '<rect x="7.5" y="3" width="9" height="18" rx="2"/><path d="M11 18.2h2"/><path d="M2 9h3"/><path d="M2 13h3"/>',
  chevronUp: '<path d="m6 14.5 6-6 6 6"/>',
  chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
  chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
  chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  download: '<path d="M12 3.5V15"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4.5 20h15"/>',
  externalLink:
    '<path d="M13.5 4.5H20V11"/><path d="M20 4.5 11 13.5"/><path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6h4.7"/>',

  // header and profile
  user: '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 20a7.6 7.6 0 0 1 14.4 0"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.7 14.6a1.5 1.5 0 0 0 .3 1.7l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.3a1.7 1.7 0 1 1-3.4 0v-.2a1.5 1.5 0 0 0-2.6-1.1l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.3a1.7 1.7 0 1 1 0-3.4h.2a1.5 1.5 0 0 0 1.1-2.6l-.1-.1A1.7 1.7 0 1 1 6.8 5l.1.1a1.5 1.5 0 0 0 1.7.3 1.5 1.5 0 0 0 .9-1.4v-.3a1.7 1.7 0 1 1 3.4 0v.2a1.5 1.5 0 0 0 2.6 1.1l.1-.1A1.7 1.7 0 1 1 18 7.3l-.1.1a1.5 1.5 0 0 0-.3 1.7 1.5 1.5 0 0 0 1.4.9h.3a1.7 1.7 0 1 1 0 3.4h-.2a1.5 1.5 0 0 0-1.4.9z"/>',
  logout: '<path d="M15 5.5h3.5A1.5 1.5 0 0 1 20 7v10a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M11 8.5 13.5 11l-2.5 2.5"/><path d="M13.5 11H4"/>',
  bell: '<path d="M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15z"/><path d="M10 21h4"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  verified:
    '<path d="m12 2.5 2.4 1.8 3 .2.9 2.9 2.3 1.9-1.3 2.7.5 3-2.8 1.2-1.6 2.5-2.9-.6-2.7 1.2-1.7-2.5-2.8-1.1.4-3L3 11.3l2.2-2 1-2.9 2.9-.3z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  sparkles:
    '<path d="m12 3 1.7 4.9L18.5 9.6l-4.8 1.7L12 16.2l-1.7-4.9L5.5 9.6l4.8-1.7z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/><path d="M12 3a9 9 0 0 1 9 9"/>',
  mic: '<path d="M15.5 5.5A3.5 3.5 0 0 0 8.5 5.5v6a3.5 3.5 0 0 0 7 0z"/><path d="M5.8 11.5a6.2 6.2 0 0 0 12.4 0"/><path d="M12 17.7V21"/><path d="M9 21h6"/>',
  headphones:
    '<path d="M4 15.5v-3a8 8 0 0 1 16 0v3"/><rect x="2.8" y="14" width="4.2" height="6" rx="2"/><rect x="17" y="14" width="4.2" height="6" rx="2"/>',
  guitar:
    '<path d="M14.8 4.4a2.2 2.2 0 0 1 3.1 0l1.7 1.7a2.2 2.2 0 0 1 0 3.1l-2 2 1.4 1.4-3 3-1.4-1.4-3.3 3.3a3.3 3.3 0 0 1-4.7 0l-.6-.6a3.3 3.3 0 0 1 0-4.7l3.3-3.3-1.4-1.4 3-3 1.4 1.4z"/><circle cx="10.6" cy="13.4" r="1.6"/>',
  saxophone:
    '<path d="M9 3v9.5a4.5 4.5 0 0 0 9 0V10"/><path d="M9 3h4"/><path d="M18 10h3"/><circle cx="11" cy="19" r="2"/>',
  piano:
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v9"/><path d="M12 5v9"/><path d="M16 5v9"/><path d="M3 14h18"/>',
  waveform: '<path d="M4 10v4"/><path d="M8 6v12"/><path d="M12 3.5v17"/><path d="M16 7v10"/><path d="M20 10.5v3"/>',
  flame:
    '<path d="M12 21c3.3 0 6-2.4 6-5.6 0-3.9-4.2-6-5.3-10.9-2.5 1.8-3.4 4.2-3.4 5.7 0 1.2-.9 2-2 2-.9 0-1.6-.5-1.9-1.3-.3.8-.4 1.6-.4 2.4C5 18.6 8.2 21 12 21z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4A8.5 8.5 0 1 0 20 14.5z"/>',
  star: '<path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.8l5.9-.8z"/>',
  music: '<circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="15.5" r="3"/><path d="M9.5 17.5V6.2l11-2.2v11.5"/>',
  spark: '<path d="M12 3v5"/><path d="M12 16v5"/><path d="M3 12h5"/><path d="M16 12h5"/><path d="m6.4 6.4 3 3"/><path d="m14.6 14.6 3 3"/><path d="m17.6 6.4-3 3"/><path d="m9.4 14.6-3 3"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.8 7 8.2 6 8.2-6"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  wave: '<path d="M2.5 8.5c3.2-4.7 6.3 4.7 9.5 0s6.3 4.7 9.5 0"/><path d="M2.5 15.5c3.2-4.7 6.3 4.7 9.5 0s6.3 4.7 9.5 0"/>'
};

// build the sprite and add it to the page
function initIcons() {
  const names = Object.keys(ICON_SPRITE);
  const symbols = names
    .map((name) => '<symbol id="i-' + name + '" viewBox="0 0 24 24">' + ICON_SPRITE[name] + "</symbol>")
    .join("");

  const sprite = document.createElement("div");
  sprite.id = "icon-sprite";
  sprite.setAttribute("aria-hidden", "true");
  sprite.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">' +
    symbols +
    "</svg>";
  document.body.insertBefore(sprite, document.body.firstChild);
}

// markdown for one icon, used inside template strings
function icon(name, extraClass) {
  const cls = "ico" + (extraClass ? " " + extraClass : "");
  return (
    '<svg class="' + cls + '" aria-hidden="true" focusable="false"><use href="#i-' +
    name +
    '"></use></svg>'
  );
}

// swap every <i data-icon="..."> for the real svg
function upgradeIcons(root) {
  const scope = root || document;
  scope.querySelectorAll("i[data-icon]").forEach(function (el) {
    el.outerHTML = icon(el.dataset.icon, el.dataset.iconClass || "");
  });
}
