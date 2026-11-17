// global keyboard shortcuts. they stay out of the way while typing and
// leave native keys alone on focused controls.

export const SHORTCUTS = [
  ["Space or K", "Play or pause"],
  ["Shift + Right", "Next track"],
  ["Shift + Left", "Previous track or restart"],
  ["Right / Left", "Seek forward or back 5 seconds"],
  ["M", "Mute or unmute"],
  ["S", "Shuffle on or off"],
  ["R", "Cycle repeat: off, all, one"],
  ["Q", "Open the player and queue"],
  ["/", "Search"],
  ["?", "Show these shortcuts"],
  ["Esc", "Close menus, dialogs and the player sheet"]
];

function isTyping(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === "TEXTAREA" || el.tagName === "SELECT") return true;
  if (el.tagName === "INPUT") return !["button", "checkbox", "radio", "submit", "reset"].includes(el.type);
  return false;
}

// keys a focused control already uses for itself
function ownsKey(el, event) {
  if (!el) return false;
  const tag = el.tagName;
  if (event.code === "Space" && (tag === "BUTTON" || tag === "A" || tag === "SUMMARY" || el.type === "radio" || el.type === "checkbox")) return true;
  if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && (el.type === "range" || el.type === "radio" || el.getAttribute("role") === "menuitem")) {
    return true;
  }
  return false;
}

export function wireKeyboard({ player, onShortcuts, onSearch, onQueue, onEscape }) {
  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const active = document.activeElement;

    if (event.key === "Escape") {
      onEscape();
      return;
    }
    if (isTyping(active) || ownsKey(active, event)) return;
    if (document.getElementById("dialog").open) return;

    const key = event.key;
    let handled = true;
    if (event.code === "Space" || key === "k" || key === "K") player.togglePlay();
    else if (key === "ArrowRight" && event.shiftKey) player.next();
    else if (key === "ArrowLeft" && event.shiftKey) player.previous();
    else if (key === "ArrowRight") player.seekBy(5);
    else if (key === "ArrowLeft") player.seekBy(-5);
    else if (key === "m" || key === "M") player.toggleMute();
    else if (key === "s" || key === "S") onShortcutToggle("shuffle");
    else if (key === "r" || key === "R") onShortcutToggle("repeat");
    else if (key === "q" || key === "Q") onQueue();
    else if (key === "/") onSearch();
    else if (key === "?") onShortcuts();
    else handled = false;

    if (handled) event.preventDefault();
  });

  function onShortcutToggle(which) {
    const button = document.getElementById(which === "shuffle" ? "shuffle-btn" : "repeat-btn");
    if (button) button.click();
  }
}
