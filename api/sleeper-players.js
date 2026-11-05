// GET /api/sleeper-players
// A slim { player_id: [name, position, team] } map of fantasy-relevant NFL players.
//
// Sleeper's full /players/nfl dump is several MB and Sleeper asks that it be pulled
// at most once a day, so this function trims it down and lets Vercel's CDN cache the
// result for 24 hours. The browser fetches trending adds straight from Sleeper and
// uses this map only to turn player IDs into names.

const SOURCE = 'https://api.sleeper.app/v1/players/nfl';
const POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF']);
const DAY = 24 * 60 * 60 * 1000;

let memo = { at: 0, body: '' }; // survives between calls on a warm instance and in local dev

async function buildMap() {
  const res = await fetch(SOURCE, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Sleeper responded ${res.status}`);
  const all = await res.json();
  const out = {};
  for (const [id, p] of Object.entries(all)) {
    const pos = p.position || (Array.isArray(p.fantasy_positions) ? p.fantasy_positions[0] : '');
    if (!POSITIONS.has(pos)) continue;
    if (pos !== 'DEF' && p.active === false) continue;
    const name = pos === 'DEF'
      ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || id
      : p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
    if (!name) continue;
    out[id] = [name, pos, p.team || 'FA'];
  }
  return JSON.stringify(out);
}

export default async function handler(req, res) {
  try {
    if (!memo.body || Date.now() - memo.at > DAY) memo = { at: Date.now(), body: await buildMap() };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
    res.end(memo.body);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Sleeper player data is unavailable right now.' }));
  }
}
