# Joshua Mertz · Career Mode

My portfolio for Sleeper's **Tennis Content Curator** role, told like a sports-game career mode: a player card, attribute ratings with receipts, a fan profile, four career seasons, a project draft board, the Minecraft UHC vault and a scouting report.

**Stack:** Vite + vanilla JS, GSAP (ScrollTrigger + SplitText), Lenis smooth scrolling, self-hosted fonts (Big Shoulders Display, Barlow, JetBrains Mono) and two small Vercel functions for live data.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. The dev server also serves the `/api` functions, so the live panels work locally.

`npm run build` creates the production site in `dist/`, and `npm run preview` serves that build.

## Deploy on Vercel

1. Import this GitHub repo in Vercel.
2. Vercel detects **Vite** automatically (build `npm run build`, output `dist`). No environment variables are needed.
3. Files in `/api` deploy as serverless functions on their own.

Social previews (LinkedIn, X, iMessage) use `public/og.jpg`. Vercel's production domain is filled into the meta tags at build time.

## Where to edit things

| What | File |
| --- | --- |
| Page text (hero, fan profile, seasons, DeuceTennis, vault, scouting report, résumé, contact) | `index.html` |
| Draft board projects (text, tags, screenshots, order) | `src/data/projects.js` |
| UHC eras, screenshots and scenarios | `src/data/uhc.js` |
| **Reddit links for the UHC match threads** | `src/data/uhc-links.js` |
| Colors, fonts, layout | `src/styles/main.css` |
| Animations | `src/modules/motion.js` |

### Adding the UHC Reddit links

Open `src/data/uhc-links.js` and paste each link as a string, one per line, with a comma after it:

```js
export const uhcLinks = [
  'https://www.reddit.com/r/UHCMatches/comments/abc123/jun_30_1700_utc_na_xvexs_45_ffa_cutclean_apollo_uhc/',
  'https://www.reddit.com/r/ultrahardcore/comments/def456/the_arcus_network_uhc_game_1/',
];
```

The site builds a readable label from each link. To write your own label, use `{ title: 'My label', url: 'https://...' }` instead. The "Match threads on Reddit" block appears as soon as the list has at least one link.

## Live data

- **Live from the tour** (`/api/tennis`): ATP and WTA singles results, live matches and what's up next, trimmed from ESPN's public tennis scoreboard and cached on Vercel's CDN for 2 minutes. My favorite players get a ★.
- **Trending on Sleeper**: most-added NFL players in the last 24 hours, straight from Sleeper's public API. Names come from `/api/sleeper-players`, a trimmed copy of Sleeper's player list that's cached for 24 hours (Sleeper asks apps to pull that list at most once a day). Sleeper's public API only covers football, which is why this panel is NFL.

If a source is down, its panel stays hidden and the rest of the site works normally.

## Images

All screenshots and art live in `public/img` as WebP. Most images have a full-size file and a `-sm` version for cards; their sizes are listed in `src/data/image-dims.js`.

Not affiliated with Sleeper.
