// toast, screen reader announcer, popup menu and modal dialog

import { html, raw } from "../core/dom.js";
import { icon } from "./icons.js";

// toast

let toastTimer = null;
export function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = "";
  // a fresh text node makes screen readers announce repeated messages
  requestAnimationFrame(() => {
    el.textContent = message;
    el.classList.add("is-visible");
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 3200);
}

// polite announcements that are not shown on screen
let announceTimer = null;
export function announce(message) {
  const el = document.getElementById("announcer");
  if (!el) return;
  clearTimeout(announceTimer);
  el.textContent = "";
  announceTimer = setTimeout(() => {
    el.textContent = message;
  }, 120);
}

// popup menu
// items: [{ label, icon, run, disabled }] or "separator"

let menuReturn = null;

export function openMenu(anchor, items, label = "Options") {
  const menu = document.getElementById("menu");
  if (!menu) return;
  closeMenu(false);
  menu.setAttribute("aria-label", label);
  menu.innerHTML = items
    .map((item, i) =>
      item === "separator"
        ? '<div class="menu-sep" role="separator"></div>'
        : String(
            html`<button class="menu-item" type="button" role="menuitem" tabindex="-1" data-menu-index="${i}"${
              item.disabled ? raw(' aria-disabled="true"') : ""
            }>${raw(icon(item.icon || "chevronRight"))}<span>${item.label}</span></button>`
          )
    )
    .join("");
  menu.hidden = false;
  menu._items = items;
  menuReturn = anchor;
  anchor.setAttribute("aria-expanded", "true");
  positionMenu(menu, anchor);
  focusItem(menu, 0);
}

function positionMenu(menu, anchor) {
  const rect = anchor.getBoundingClientRect();
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  const gap = 6;
  let left = rect.right - width;
  let top = rect.bottom + gap;
  if (left < 8) left = Math.min(rect.left, window.innerWidth - width - 8);
  if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - gap);
  menu.style.left = Math.max(8, left) + "px";
  menu.style.top = top + "px";
}

const menuItems = (menu) => Array.from(menu.querySelectorAll(".menu-item:not([aria-disabled])"));

function focusItem(menu, index) {
  const items = menuItems(menu);
  if (!items.length) return;
  items[(index + items.length) % items.length].focus();
}

export function closeMenu(restoreFocus = true) {
  const menu = document.getElementById("menu");
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  menu.innerHTML = "";
  menu._items = null;
  if (menuReturn) {
    menuReturn.setAttribute("aria-expanded", "false");
    if (restoreFocus && menuReturn.isConnected) menuReturn.focus();
  }
  menuReturn = null;
}

export function wireMenu() {
  const menu = document.getElementById("menu");
  menu.addEventListener("click", (event) => {
    const btn = event.target.closest(".menu-item");
    if (!btn || btn.getAttribute("aria-disabled")) return;
    const item = menu._items && menu._items[Number(btn.dataset.menuIndex)];
    closeMenu(true);
    if (item && item.run) item.run();
  });
  menu.addEventListener("keydown", (event) => {
    const items = menuItems(menu);
    const at = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown") focusItem(menu, at + 1);
    else if (event.key === "ArrowUp") focusItem(menu, at - 1);
    else if (event.key === "Home") focusItem(menu, 0);
    else if (event.key === "End") focusItem(menu, items.length - 1);
    else if (event.key === "Escape") closeMenu(true);
    else if (event.key === "Tab") closeMenu(false);
    else return;
    event.preventDefault();
    event.stopPropagation();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!menu.hidden && !menu.contains(event.target) && !(menuReturn && menuReturn.contains(event.target))) {
      closeMenu(false);
    }
  });
  window.addEventListener("resize", () => closeMenu(false));
  document.addEventListener("scroll", () => closeMenu(false), { capture: true, passive: true });
}

// modal dialog built on <dialog>, which traps focus and handles escape

let dialogReturn = null;
let replacing = false;

// content is SafeHtml; onOpen(dialog) wires up the body; returns the dialog
export function openDialog({ title, body, wide = false, onOpen }) {
  const dialog = document.getElementById("dialog");
  if (dialog.open) {
    // swapping one dialog for another: keep the original return target and
    // stop the pending close event from clearing the new content
    replacing = true;
    dialog.close();
  } else {
    dialogReturn = document.activeElement;
  }
  dialog.classList.toggle("dialog-wide", wide);
  dialog.innerHTML = String(html`<div class="dialog-head">
      <h2 class="dialog-title" id="dialog-title">${title}</h2>
      <button class="icon-btn" type="button" data-dialog-close aria-label="Close dialog">${raw(icon("close"))}</button>
    </div>
    <div class="dialog-body">${body}</div>`);
  dialog.showModal();
  if (onOpen) onOpen(dialog);
  const first = ["[autofocus]", "input", ".pick", ".dialog-body .btn-primary", ".dialog-body button"]
    .map((selector) => dialog.querySelector(selector))
    .find(Boolean);
  if (first) first.focus();
  return dialog;
}

export function closeDialog() {
  const dialog = document.getElementById("dialog");
  if (dialog.open) dialog.close();
}

export function wireDialog() {
  const dialog = document.getElementById("dialog");
  dialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-dialog-close]")) closeDialog();
    // a click on the backdrop lands on the dialog element itself
    else if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", () => {
    if (replacing) {
      replacing = false;
      return;
    }
    dialog.innerHTML = "";
    if (dialogReturn && dialogReturn.isConnected) dialogReturn.focus();
    dialogReturn = null;
  });
}

