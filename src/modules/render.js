// Builds the data-driven parts of the page: ticker, draft board, vault feed and links.
import { gsap } from 'gsap';
import { projects, POSITIONS, FILTERS } from '../data/projects.js';
import { eras, scenarios } from '../data/uhc.js';
import { uhcLinks } from '../data/uhc-links.js';
import { DIMS } from '../data/image-dims.js';
import { $, $$, esc, imgTag, layoutChanged, reduceMotion } from '../lib/dom.js';

/* ---------- Ticker ---------- */
const TICKER_BASE = [
  '<b>S4</b> AI builder season · live',
  'Favorite sport: <b>tennis</b>',
  '<b>50+</b> UHC games hosted',
  '<b>40–80</b> players per game',
  '<b>30+</b> college esports players managed',
  '<b>156</b> DeuceTennis commits in 5 weeks',
  'On Sleeper since <b>Sep 22, 2023</b>',
  'B.S. Esports Management · <b>Spring \'27</b>',
  '<b>25+</b> builds made with AI',
  'Die-hard <b>Bills</b> fan',
];

/** `extra` items (already escaped HTML) slot in after the first two base items. */
export function renderTicker(extra = []) {
  const track = $('[data-ticker]');
  if (!track) return;
  const items = [...TICKER_BASE.slice(0, 2), ...extra, ...TICKER_BASE.slice(2)];
  const group = (hidden) =>
    `<div class="ticker__group"${hidden ? ' aria-hidden="true"' : ''}>${items
      .map((html) => `<span class="ticker__item">${html}</span>`)
      .join('')}</div>`;
  track.innerHTML = group(false) + group(true);
  requestAnimationFrame(() => {
    const width = track.firstElementChild?.scrollWidth || 2000;
    track.style.setProperty('--ticker-speed', `${Math.max(30, width / 75)}s`);
  });
}

/* ---------- Draft board ---------- */
function pickCard(p) {
  const [statusKey, statusLabel] = p.status;
  const [thumbKey, thumbAlt] = p.images[0];
  const media = ['pick__media'];
  if (p.fit === 'phone') media.push('pick__media--phone');
  if (thumbKey.startsWith('uhc/')) media.push('pick__media--light');
  const sizes = p.wide
    ? '(max-width: 720px) 100vw, 55vw'
    : p.fit === 'phone'
      ? '240px'
      : '(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 400px';
  const open = p.action
    ? `<a class="pick__open" href="${esc(p.action[1])}">${esc(p.title)}</a>`
    : `<button class="pick__open" type="button" data-open="${esc(p.id)}" aria-haspopup="dialog">${esc(p.title)}</button>`;
  const more = p.action ? `${esc(p.action[0])} →` : 'Highlights →';

  return `<article class="pick${p.wide ? ' pick--wide' : ''}" data-cats="${esc(p.cats.join(' '))}" data-reveal>
    <div class="${media.join(' ')}">${imgTag(thumbKey, thumbAlt, { sizes })}<span class="pick__no">${esc(p.pick)}</span></div>
    <div class="pick__body">
      <div class="pick__meta">
        <span class="pos pos--${esc(p.pos)}">${POSITIONS[p.pos]}</span>
        <span class="status status--${esc(statusKey)}">${esc(statusLabel)}</span>
      </div>
      <h4 class="pick__title">${open}</h4>
      <p class="pick__tag">${esc(p.tagline)}</p>
      <p class="pick__desc">${esc(p.summary)}</p>
      <div class="pick__foot">
        <ul class="pick__tech">${p.tech.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <span class="pick__more" aria-hidden="true">${more}</span>
      </div>
    </div>
  </article>`;
}

export function renderBoard() {
  const grid = $('[data-board]');
  const filters = $('[data-filters]');
  if (!grid || !filters) return;
  grid.innerHTML = projects.map(pickCard).join('');

  const count = (key) => (key === 'all' ? projects.length : projects.filter((p) => p.cats.includes(key)).length);
  filters.innerHTML = FILTERS.map(
    ([key, label], i) =>
      `<button class="filter" type="button" data-filter="${key}" aria-pressed="${i === 0}">${esc(label)}<span>${count(key)}</span></button>`,
  ).join('');

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const key = btn.dataset.filter;
    $$('[data-filter]', filters).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    $('.board').classList.toggle('is-filtered', key !== 'all');
    const shown = [];
    $$('.pick', grid).forEach((card) => {
      const show = key === 'all' || card.dataset.cats.split(' ').includes(key);
      card.classList.toggle('is-hidden', !show);
      if (show) shown.push(card);
    });
    if (reduceMotion()) gsap.set(shown, { opacity: 1, y: 0 });
    else gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04, clearProps: 'transform' });
    layoutChanged();
  });
}

/* ---------- The Vault ---------- */
export function renderVault() {
  const list = $('[data-scenarios]');
  if (list) {
    list.innerHTML = scenarios
      .map((s) => `<li>${esc(s)}</li>`)
      .join('');
  }

  const tabs = $('[data-feed-tabs]');
  const panel = $('[data-feed-panel]');
  if (!tabs || !panel) return;
  panel.id = 'vault-panel';
  tabs.innerHTML = eras
    .map(
      (era, i) =>
        `<button class="feed__tab" type="button" role="tab" id="era-${era.id}" aria-controls="vault-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-era="${i}">${esc(era.server)}<small>${esc(era.when)} · ${esc(era.games)}</small></button>`,
    )
    .join('');

  const show = (i, focus = false) => {
    const era = eras[i];
    $$('.feed__tab', tabs).forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
      if (k === i && focus) t.focus();
    });
    panel.setAttribute('aria-labelledby', `era-${era.id}`);
    panel.innerHTML = era.strips
      .map(([key, alt]) => {
        const [w, h] = DIMS[`uhc/${key}`] || [1000, 120];
        return `<button class="feed__strip" type="button" data-lb="uhc-${era.id}" data-src="/img/uhc/${key}.webp" data-caption="${esc(alt)}"><img src="/img/uhc/${key}.webp" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async"></button>`;
      })
      .join('');
    panel.scrollTop = 0;
  };

  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('[data-era]');
    if (t) show(Number(t.dataset.era));
  });
  tabs.addEventListener('keydown', (e) => {
    const current = $$('.feed__tab', tabs).findIndex((t) => t.getAttribute('aria-selected') === 'true');
    let next = null;
    if (e.key === 'ArrowRight') next = (current + 1) % eras.length;
    if (e.key === 'ArrowLeft') next = (current - 1 + eras.length) % eras.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = eras.length - 1;
    if (next !== null) {
      e.preventDefault();
      show(next, true);
    }
  });
  show(0);
}

/* ---------- Reddit match-thread links (src/data/uhc-links.js) ---------- */
const WORDS = {
  utc: 'UTC', na: 'NA', us: 'US', eu: 'EU', ca: 'CA', ffa: 'FFA', uhc: 'UHC', pvp: 'PvP', pve: 'PvE',
  ipvp: 'iPvP', xvex: 'xVex', xvexs: "xVex's", to2: 'To2', to3: 'To3', to4: 'To4', to5: 'To5', to6: 'To6', vs: 'vs',
};

export function labelFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const sub = parts[0] === 'r' && parts[1] ? `r/${parts[1]}` : u.hostname.replace(/^www\./, '');
    const slug = parts[0] === 'r' && parts[2] === 'comments' ? parts[4] || '' : '';
    const title = slug
      .split('_')
      .filter(Boolean)
      .map((w) => WORDS[w.toLowerCase()] || w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { sub, title: title || 'Match thread' };
  } catch {
    return { sub: 'reddit', title: 'Match thread' };
  }
}

export function renderLinks() {
  const wrap = $('[data-uhc-links]');
  const list = $('[data-uhc-list]');
  if (!wrap || !list || !Array.isArray(uhcLinks) || !uhcLinks.length) return;
  const items = uhcLinks
    .map((item) => {
      const url = typeof item === 'string' ? item : item?.url;
      if (!url || !/^https?:\/\//i.test(url)) return '';
      const auto = labelFromUrl(url);
      const title = typeof item === 'object' && item.title ? item.title : auto.title;
      return `<li><a href="${esc(url)}" target="_blank" rel="noopener"><span class="vlinks__sub">${esc(auto.sub)} ↗</span><span class="vlinks__title">${esc(title)}</span></a></li>`;
    })
    .join('');
  if (!items) return;
  list.innerHTML = items;
  wrap.hidden = false;
}
