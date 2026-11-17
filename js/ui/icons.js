// hand-drawn 24px line icons, injected once as an svg sprite and reused with <use>

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  library:
    '<path d="M4 21V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14"/><path d="M13.5 20.4 17.9 6.1a1.6 1.6 0 0 1 2-1.1l.5.2a1.6 1.6 0 0 1 1.1 2l-4.4 14.3a1.6 1.6 0 0 1-2 1.1l-.5-.2a1.6 1.6 0 0 1-1.1-2z"/><path d="M4 21h9.4"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/><path d="M12 3a9 9 0 0 1 9 9"/>',
  heart:
    '<path d="M12 20.3C8 17.6 3 14 3 9.6A4.6 4.6 0 0 1 7.6 5c1.6 0 3.2.9 4.4 2.6C13.2 5.9 14.8 5 16.4 5A4.6 4.6 0 0 1 21 9.6c0 4.4-5 8-9 10.7z"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.2 4.5v4.4h4.4"/><path d="M12 8v4.4l3.1 1.9"/>',
  play: '<path d="M7.5 4.8 19 12 7.5 19.2z" fill="currentColor"/>',
  pause:
    '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  skipBack: '<path d="M18.5 5.8v12.4L9.5 12z" fill="currentColor"/><path d="M5.5 5v14"/>',
  skipForward: '<path d="M5.5 5.8v12.4l9-6.2z" fill="currentColor"/><path d="M18.5 5v14"/>',
  shuffle:
    '<path d="M17 4l3 3-3 3"/><path d="M17 14l3 3-3 3"/><path d="M20 7h-3.4a4 4 0 0 0-3.3 1.8l-3.6 5.4A4 4 0 0 1 6.4 16H3"/><path d="M20 17h-3.4a4 4 0 0 1-3.3-1.8l-.9-1.4"/><path d="M3 7h3.4a4 4 0 0 1 3.3 1.8l.9 1.4"/>',
  repeat: '<path d="m17 3 3 3-3 3"/><path d="M20 6H8a4 4 0 0 0-4 4"/><path d="m7 21-3-3 3-3"/><path d="M4 18h12a4 4 0 0 0 4-4"/>',
  repeatOne:
    '<path d="m17 3 3 3-3 3"/><path d="M20 6H8a4 4 0 0 0-4 4"/><path d="m7 21-3-3 3-3"/><path d="M4 18h12a4 4 0 0 0 4-4"/><path d="M11.4 10.6 13 9.6V14.4"/>',
  volume: '<path d="M4 9.5h3l4.5-4v13L7 14.5H4z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18.6 7a7 7 0 0 1 0 10"/>',
  volumeLow: '<path d="M4 9.5h3l4.5-4v13L7 14.5H4z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5"/>',
  volumeMute: '<path d="M4 9.5h3l4.5-4v13L7 14.5H4z"/><path d="m16 10 4 4"/><path d="m20 10-4 4"/>',
  chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
  chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  listPlus: '<path d="M4 6.5h12"/><path d="M4 12h12"/><path d="M4 17.5h7"/><path d="M18 14v7"/><path d="M14.5 17.5h7"/>',
  queueNext: '<path d="M4 6.5h16"/><path d="M4 12h9"/><path d="M4 17.5h9"/><path d="m16 10 4 4.5-4 4.5"/>',
  close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  trash: '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10.5 11v5.5"/><path d="M13.5 11v5.5"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1"/><path d="m8.2 13.2 7.6 4.1"/>',
  externalLink:
    '<path d="M13.5 4.5H20V11"/><path d="M20 4.5 11 13.5"/><path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6h4.7"/>',
  keyboard:
    '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01"/><path d="M9.5 10h.01"/><path d="M13 10h.01"/><path d="M16.5 10h.01"/><path d="M7.5 14h9"/>',
  alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5"/><path d="M12 17.3h.01"/>',
  album: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  user: '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 20a7.6 7.6 0 0 1 14.4 0"/>',
  music: '<circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="15.5" r="3"/><path d="M9.5 17.5V6.2l11-2.2v11.5"/>'
};

export function injectIcons(doc = document) {
  if (doc.getElementById("icon-sprite")) return;
  const symbols = Object.entries(ICONS)
    .map(([name, body]) => '<symbol id="i-' + name + '" viewBox="0 0 24 24">' + body + "</symbol>")
    .join("");
  const holder = doc.createElement("div");
  holder.id = "icon-sprite";
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + symbols + "</svg>";
  doc.body.prepend(holder);
}

// markup for one icon; the name comes from code, never from user input
export function icon(name, className = "") {
  return '<svg class="ico' + (className ? " " + className : "") + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
}

export const ICON_NAMES = Object.keys(ICONS);
