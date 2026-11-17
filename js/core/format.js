// small formatting helpers

// 222 -> "3:42"
export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ":" + String(s).padStart(2, "0");
}

// "3:42" -> 222
export function parseLength(text) {
  const parts = String(text).split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

// 5520 -> "1 hr 32 min"
export function formatTotal(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  if (hours <= 0) return minutes + " min";
  return hours + " hr " + minutes + " min";
}

export const plural = (n, word, many = word + "s") => n + " " + (n === 1 ? word : many);

// "just now", "5 min ago", "3 hr ago", "2 days ago", or a date
export function timeAgo(timestamp, now = Date.now()) {
  const diff = Math.max(0, now - timestamp) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";
  if (diff < 86400 * 7) return plural(Math.floor(diff / 86400), "day") + " ago";
  return new Date(timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const pad2 = (n) => String(n).padStart(2, "0");
