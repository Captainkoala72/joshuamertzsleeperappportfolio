// Live panels: "Live from the tour" (ESPN tennis via /api/tennis) and "Trending on Sleeper"
// (Sleeper's public trending endpoint + /api/sleeper-players for names). Each panel stays
// hidden unless its data loads, and the hero ticker picks up a few headlines from both.
import { $, $$, esc, fetchJSON, layoutChanged } from '../lib/dom.js';
import { renderTicker } from './render.js';

const FAVORITES = ['Fonseca', 'Berrettini', 'Shelton', 'Tiafoe', 'Alcaraz'];
const TRENDING_URL = 'https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=12';

const isFav = (name = '') => FAVORITES.some((f) => name.includes(f));
const surname = (p) => {
  const short = p.short || p.name || '';
  const i = short.indexOf('. ');
  return i > -1 ? short.slice(i + 2) : short;
};
const fmtCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
const fmtWhen = (iso, timeValid = true) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (!timeValid) return `${d.toLocaleDateString([], { weekday: 'short', timeZone: 'UTC' })} · time TBA`;
  return d.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
};

/* ---------- Tennis ---------- */
async function loadTennis() {
  try {
    const data = await fetchJSON('/api/tennis', 10000);
    if (!data || data.error) return null;
    const total = (data.live?.length || 0) + (data.recent?.length || 0) + (data.next?.length || 0);
    return total ? data : null;
  } catch {
    return null;
  }
}

function setsScore(winner, loser) {
  return winner.sets
    .map((ws, i) => {
      const ls = loser.sets[i] || [0];
      const low = ws[0] > ls[0] ? ls[1] : ws[1];
      return `${ws[0]}-${ls[0]}${low != null ? `(${low})` : ''}`;
    })
    .join(' ');
}

function matchHtml(m, kind) {
  const state =
    kind === 'live'
      ? '<span class="match__state is-live">● Live</span>'
      : kind === 'next'
        ? `<span class="match__state">${esc(fmtWhen(m.date, m.timeValid))}</span>`
        : `<span class="match__state">${m.status === 'STATUS_RETIRED' ? 'Final · ret.' : 'Final'}</span>`;
  const rows = m.players
    .map((p) => {
      const fav = isFav(p.name) ? ' <span class="match__fav" title="One of my favorite players">★</span>' : '';
      const sets =
        kind === 'next'
          ? ''
          : p.sets.map(([games, tb]) => `<b>${esc(games)}${tb != null ? `<sup>${esc(tb)}</sup>` : ''}</b>`).join('');
      return `<div class="match__row${p.winner ? ' is-win' : ''}"><span class="match__cc">${esc(p.country)}</span><span class="match__name">${esc(p.short)}${fav}</span><span class="match__sets">${sets}</span></div>`;
    })
    .join('');
  const fav = m.players.some((p) => isFav(p.name)) ? ' is-fav' : '';
  return `<div class="match match--${kind}${fav}"><p class="match__meta"><span class="match__tour">${esc(m.tour)}</span>${state}</p><p class="match__event">${esc(m.event)}<span>${esc(m.round)}</span></p>${rows}</div>`;
}

function renderTennis(data) {
  const panel = $('[data-tour]');
  const body = $('[data-tour-body]');
  if (!panel || !body) return;
  const live = (data.live || []).slice(0, 3);
  const recent = (data.recent || []).slice(0, live.length ? 3 : 4);
  const next = (data.next || []).slice(0, 2);
  body.innerHTML = [
    ...live.map((m) => matchHtml(m, 'live')),
    ...recent.map((m) => matchHtml(m, 'recent')),
    ...next.map((m) => matchHtml(m, 'next')),
  ].join('');
  panel.hidden = false;
}

function tennisTicker(data) {
  if (!data) return [];
  const items = [];
  for (const m of (data.live || []).slice(0, 2)) {
    const [a, b] = m.players;
    items.push(`<em class="is-tennis">Live</em> ${esc(surname(a))} vs ${esc(surname(b))} · ${esc(m.event)}`);
  }
  for (const m of (data.recent || []).slice(0, 3)) {
    const w = m.players.find((p) => p.winner);
    const l = m.players.find((p) => p !== w);
    if (!w || !l) continue; // retirements sometimes come without a winner flag
    const star = isFav(w.name) ? ' ★' : '';
    const ret = m.status === 'STATUS_RETIRED' ? ' ret.' : '';
    items.push(`<em class="is-tennis">${esc(m.tour)}</em> ${esc(surname(w))}${star} d. ${esc(surname(l))} ${esc(setsScore(w, l))}${ret} · ${esc(m.event)}`);
  }
  const fav = (data.next || []).find((m) => m.players.some((p) => isFav(p.name)));
  if (fav) {
    const [a, b] = fav.players;
    items.push(`<em class="is-tennis">Up next</em> ${esc(surname(a))} vs ${esc(surname(b))} · ${esc(fav.event)} ${esc(fav.round)}`);
  }
  return items;
}

/* ---------- Sleeper trending ---------- */
async function loadTrending() {
  try {
    const [trend, players] = await Promise.all([fetchJSON(TRENDING_URL, 10000), fetchJSON('/api/sleeper-players', 15000)]);
    if (!Array.isArray(trend) || !players || players.error) return null;
    const rows = trend
      .map((t) => {
        const p = players[t.player_id];
        return p ? { id: String(t.player_id), name: p[0], pos: p[1], team: p[2], count: t.count } : null;
      })
      .filter(Boolean)
      .slice(0, 8);
    return rows.length >= 3 ? rows : null;
  } catch {
    return null;
  }
}

function renderTrending(rows) {
  const panel = $('[data-trending]');
  const list = $('[data-trend-list]');
  if (!panel || !list) return;
  list.innerHTML = rows
    .map((r) => {
      const src =
        r.pos === 'DEF'
          ? `https://sleepercdn.com/images/team_logos/nfl/${encodeURIComponent(r.id.toLowerCase())}.png`
          : `https://sleepercdn.com/content/nfl/players/thumb/${encodeURIComponent(r.id)}.jpg`;
      return `<li class="trend__row${r.team === 'BUF' ? ' is-bills' : ''}"><img class="trend__img" src="${src}" alt="" width="36" height="36" loading="lazy" decoding="async"><span class="trend__name"><strong>${esc(r.name)}</strong><span><span class="trend__pos trend__pos--${esc(r.pos)}">${esc(r.pos)}</span>${esc(r.team)}</span></span><span class="trend__adds">+${fmtCount(r.count)} adds</span></li>`;
    })
    .join('');
  $$('.trend__img', list).forEach((img) => {
    const hide = () => (img.style.visibility = 'hidden');
    if (img.complete && !img.naturalWidth) hide();
    else img.addEventListener('error', hide, { once: true });
  });
  panel.hidden = false;
}

function trendTicker(rows) {
  if (!rows) return [];
  return rows
    .slice(0, 3)
    .map((r) => `<em>Sleeper trending</em> ${esc(r.name)} ${esc(r.pos)} · +${fmtCount(r.count)} adds`);
}

export function initLive() {
  const start = () => {
    const tennis = loadTennis().then((data) => {
      if (data) {
        renderTennis(data);
        layoutChanged();
      }
      return data;
    });
    const trending = loadTrending().then((rows) => {
      if (rows) {
        renderTrending(rows);
        layoutChanged();
      }
      return rows;
    });
    Promise.allSettled([tennis, trending]).then(([t, s]) => {
      const extra = [...tennisTicker(t.value), ...trendTicker(s.value)];
      if (extra.length) renderTicker(extra);
    });
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2500 });
  else setTimeout(start, 1200);
}
