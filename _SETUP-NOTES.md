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
www.monsters.win is the landing page for three products: Sweeps.Monster (https://sweeps.monster/, the game platforms), the MonsterSweeps sweepstakes casino (https://monstersweeps.net/) and MonsterPay. Product links live in data/site-config.json under "products"; platforms are listed in data/platforms.json with logos in /img/platforms. Make sure monsters.win (no www) redirects to https://www.monsters.win.

## How updates work
There is no CMS to log in to. Every change goes through Claude Code in chat: describe it (or send game images,
names and links, or new text), agree the plan, and Claude edits the site, tests it, pushes it and merges when you
say "merge". GitHub Pages then publishes www.monsters.win within about a minute.

- Featured games (the sliding rows in the homepage hero) live in /data/games.json: name, provider, image, url, badge.
  Game images go in /img/games (square 1:1, at least 600 x 600).
- Before each release, tools/bump-version.sh stamps the CSS/JS links so browsers fetch fresh files.
