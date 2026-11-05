// GET /api/tennis
// Live, upcoming and recent ATP + WTA singles matches, trimmed from ESPN's public
// tennis scoreboard feeds (about 0.7 MB raw) down to a few KB. Cached on Vercel's
// CDN for two minutes so every visitor doesn't hit ESPN.

const FEEDS = {
  ATP: 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard',
  WTA: 'https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard',
};

const countryCode = (athlete) => {
  const m = (athlete?.flag?.href || '').match(/countries\/\d+\/([a-z]{3})\.png/i);
  return m ? m[1].toUpperCase() : '';
};

function slimMatch(c, tour, event) {
  const type = c.status?.type || {};
  const players = [...(c.competitors || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((p) => ({
      name: p.athlete?.displayName || 'TBD',
      short: p.athlete?.shortName || p.athlete?.displayName || 'TBD',
      country: countryCode(p.athlete),
      winner: Boolean(p.winner),
      sets: (p.linescores || []).map((l) => (l.tiebreak != null ? [l.value, l.tiebreak] : [l.value])),
    }));
  return {
    id: String(c.id),
    tour,
    event: event.shortName || event.name || '',
    round: c.round?.displayName || '',
    date: c.date,
    timeValid: c.timeValid !== false, // false = ESPN only knows the day, not the start time
    state: type.state, // 'pre' | 'in' | 'post'
    status: type.name || '',
    players,
  };
}

async function loadTour(tour, url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${tour} feed responded ${res.status}`);
  const data = await res.json();
  const matches = [];
  for (const event of data.events || []) {
    const singles = (event.groupings || []).find((g) => /singles/i.test(g.grouping?.displayName || ''));
    for (const c of singles?.competitions || []) matches.push(slimMatch(c, tour, event));
  }
  return matches;
}

const known = (m) => m.players.length === 2 && m.players.every((p) => p.name && p.name !== 'TBD');
const newestFirst = (a, b) => new Date(b.date) - new Date(a.date);
const oldestFirst = (a, b) => new Date(a.date) - new Date(b.date);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const settled = await Promise.allSettled(Object.entries(FEEDS).map(([tour, url]) => loadTour(tour, url)));
    const all = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    if (!all.length && settled.every((r) => r.status === 'rejected')) throw new Error('No tennis feeds');
    const body = {
      updated: new Date().toISOString(),
      live: all.filter((m) => m.state === 'in' && known(m)).sort(newestFirst).slice(0, 4),
      next: all.filter((m) => m.state === 'pre' && known(m)).sort(oldestFirst).slice(0, 4),
      recent: all
        .filter((m) => m.state === 'post' && known(m) && m.status !== 'STATUS_WALKOVER')
        .sort(newestFirst)
        .slice(0, 6),
    };
    res.statusCode = 200;
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    res.end(JSON.stringify(body));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Tennis scores are unavailable right now.' }));
  }
}
