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

## Game tiles CMS (www.monsters.win/admin)
The sliding game rows in the homepage hero come from /data/games.json. Edit them in the CMS at /admin:
add or reorder games, type the name and studio, upload a square image (1:1, at least 600 x 600) and set the play link.
All games show in the three sliding rows. Each save is a commit to `main`, and the site updates about a minute later.
Images are stored in /img/games.

First merge this redesign into `main` (the CMS edits `main`). Then set up login once (about 10 minutes):

1. **Cloudflare Worker.** In a free Cloudflare account: Workers & Pages -> Create -> Worker, name it
   `monstersweeps-cms-auth`, and replace its code with tools/decap-oauth-worker.js. Deploy and note its URL,
   for example https://monstersweeps-cms-auth.<your-name>.workers.dev
2. **GitHub OAuth App.** github.com -> your organisation -> Settings -> Developer settings -> OAuth Apps -> New:
   - Homepage URL: https://www.monsters.win
   - Authorization callback URL: <worker URL>/callback
   Create a client secret.
3. **Worker settings** (Settings -> Variables and Secrets): GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (as a Secret),
   ALLOWED_ORIGIN = https://www.monsters.win
4. **CMS config.** In admin/config.yml set `base_url:` to the worker URL (no trailing slash) and commit.
5. Open https://www.monsters.win/admin, click "Login with GitHub". Only people with write access to this repo can save.

Until step 4 is done the site works normally; only the /admin login does not.
