import { DIMS } from '../data/image-dims.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** URL of an image in /public/img. `size` 'sm' uses the small version when one exists. */
export function imgSrc(key, size = 'sm') {
  const d = DIMS[key];
  return size === 'sm' && d && d[2] ? `/img/${key}-sm.webp` : `/img/${key}.webp`;
}

/** Responsive <img> markup for an image key from image-dims.js. */
export function imgTag(key, alt, { sizes = '(max-width: 720px) 100vw, 33vw', eager = false } = {}) {
  const [w, h, sw] = DIMS[key] || [1600, 900];
  const srcset = sw ? ` srcset="/img/${key}-sm.webp ${sw}w, /img/${key}.webp ${w}w" sizes="${sizes}"` : '';
  const loading = eager ? '' : ' loading="lazy"';
  return `<img src="${imgSrc(key)}"${srcset} width="${w}" height="${h}" alt="${esc(alt)}"${loading} decoding="async">`;
}

let toastEl;
let toastTimer;
export function toast(message) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    document.body.append(toastEl);
  }
  toastEl.textContent = message;
  requestAnimationFrame(() => toastEl.classList.add('is-on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
}

/** fetch + JSON with a timeout. Throws on network errors, timeouts and non-2xx responses. */
export async function fetchJSON(url, ms = 9000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Tell scroll animations the page height changed (panels appearing, filters, etc). */
export const layoutChanged = () => document.dispatchEvent(new CustomEvent('layout:changed'));
