/* cover art helpers
   builds the gradient behind each cover, the artwork markup, and the fallback
   used when an image file is missing. */

// gradient for a cover, using the colours from data.js
function gradientFor(name, angle) {
  const raw = paletteForCover(name);
  const parts = String(raw).split("|").map(function (c) { return c.trim(); });
  const a = parts[0] || "#7c5cff";
  const b = parts[1] || "#1c1c22";
  const c = parts[2] || a;
  const deg = angle === undefined ? 145 : angle;
  return (
    "linear-gradient(" + deg + "deg, " + a + " 0%, " + b + " 62%, " + c + " 100%)"
  );
}

// the same gradient, wrapped in an inline style attribute
function gradientStyle(name, angle) {
  return 'style="--cover-gradient: ' + gradientFor(name, angle) + '"';
}

// artwork markup: gradient wrapper, image on top, optional round shape
function coverArt(options) {
  const opts = options || {};
  const src = opts.src || "";
  const name = opts.name || "brand";
  const alt = opts.alt || "";
  const extra = opts.className ? " " + opts.className : "";
  const shape = opts.shape === "circle" ? " art--circle" : "";
  const fallbackText = alt || name;

  return (
    '<figure class="art' + shape + extra + '" ' + gradientStyle(name) + ">" +
      '<img class="art-img" src="' + src + '" alt="' + escapeAttr(alt) + '" loading="lazy" ' +
        "onerror=\"onCoverError(this, '" + escapeAttr(fallbackText) + "')\">" +
      '<span class="art-sheen" aria-hidden="true"></span>' +
    "</figure>"
  );
}

// if an image is missing, swap in a generated placeholder
function onCoverError(img, text) {
  if (!img || img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = placeholderDataUri(text || "WaveMusic");
}

// build the placeholder as a data uri, so no extra file is needed
function placeholderDataUri(text) {
  const label = String(text).slice(0, 22).toUpperCase();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#7c5cff"/><stop offset="0.55" stop-color="#232335"/>' +
        '<stop offset="1" stop-color="#ff5ca8"/></linearGradient></defs>' +
      '<rect width="512" height="512" fill="url(#g)"/>' +
      '<circle cx="380" cy="120" r="210" fill="#ffffff" opacity="0.10"/>' +
      '<path d="M150 300v-90l120-26v96" fill="none" stroke="#ffffff" stroke-width="12" opacity="0.75"/>' +
      '<circle cx="134" cy="308" r="26" fill="#ffffff" opacity="0.75"/>' +
      '<circle cx="254" cy="288" r="26" fill="#ffffff" opacity="0.75"/>' +
      '<text x="32" y="452" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">' +
        label +
      "</text>" +
    "</svg>";
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// escape text before putting it inside an attribute
function escapeAttr(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
