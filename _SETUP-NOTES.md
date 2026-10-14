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

## Domains
Point sweeps.monster and monster.win at https://www.monsters.win with a 301 redirect. Make sure monsters.win (no www) also redirects to https://www.monsters.win.
