# MonsterSweeps site: setup notes (not linked from the site)

Upload everything in this folder to the root of the host for www.monsters.win.
The CNAME file is for GitHub Pages. Delete it if you host elsewhere.

## Change before launch
1. **Sign-up / Log in URL.** All buttons point to https://monstersweeps.net/. If you have a direct sign-up page (for example /register), tell us and we will point the buttons there.
2. **Telegram.** The Telegram card says "launching soon". Send the channel link and it becomes a live button.
3. **Placeholders** (purple tags on the pages): XP expiry, Silver/Gold perks, redemption time and minimum, referral cap, legal entity name, address and phone.
4. **Terms of Use and Official Sweepstakes Rules** pages are still needed.

## Leaderboard feed
The page reads /data/leaderboard.json. Replace it with live data in the same shape and set "sample": false to remove the preview banner:

    {"sample": false, "updated": "2026-10-13T00:00:00Z", "metric": "XP",
     "weekly":  [{"name": "Mon***42", "xp": 640, "tier": "Gold"}],
     "monthly": [...], "yearly": [...]}

- name must already be masked by the platform. tier is optional (the player's real tier).
- Up to 10 rows per period, highest XP first.
- leaderboard.html is noindex while it shows sample data. Remove the noindex when it goes live, and add it to sitemap.xml.

## Domains and products
Four official domains: www.monsters.win (this landing page), sweeps.monster (game platforms), monsterspay.net (MonsterPay payments) and monstersweeps.net (sweepstakes casino and predictions). Product links live in data/site-config.json under "products"; platforms are listed in data/platforms.json with logos in /img/platforms. Make sure monsters.win (no www) redirects to https://www.monsters.win.

## How updates work
There is no CMS to log in to. Every change goes through Claude Code in chat: describe it (or send game images,
names and links, or new text), agree the plan, and Claude edits the site, tests it, pushes it and merges when you
say "merge". GitHub Pages then publishes www.monsters.win within about a minute.

- Featured games (the sliding rows in the homepage hero) live in /data/games.json: name, provider, image, url, badge.
  Game images go in /img/games (square 1:1, at least 600 x 600).
- Before each release, tools/bump-version.sh stamps the CSS/JS links so browsers fetch fresh files.

## The King (mascot) and brand assets
- The brand kit lives in `brand/king-kit/` (key art, transparent cutouts, fonts, the original logo and the redesign brief).
- `python3 tools/king-assets.py` rebuilds every web asset from it: the hero stage art (`img/stage/`), the King cutouts and
  turntable frames (`img/king/`), the crest logo and icons (`logo-*`, `favicon-*`, `apple-touch-icon.png`), the WOFF2 fonts
  and the share image `og-image.jpg`. The art is only trimmed, scaled and mirrored, never redrawn.
- Homepage: `index.html` + `css/home.css` + `js/home.js`. Shared colours, fonts and buttons: `css/tokens.css`.

## MonsterSweeps launch switch
monstersweeps.net is not live yet, so the homepage card shows "Opening soon" instead of a Play button.
When it launches, set `"live": true` under `products.casino` in `data/site-config.json`: the card then shows
"Live now" and the Play / Log in button. (casino.html and casino-vip.html still link straight to monstersweeps.net.)

## Platform pages
- `sweeps.html` (Sweeps.Monster) and `casino.html` (MonsterSweeps) each show the daily streak, tier table, XP and VIP.
- Tier numbers live in `data/tiers.json` (`sweepsmonster` and `casino`). The casino list is a copy of the Sweeps.Monster one until its own numbers are final.
- Streak amounts appear on both pages when `streak` in `data/site-config.json` has seven values.
- `platforms.html` and `vip.html` only redirect to the pages above.
