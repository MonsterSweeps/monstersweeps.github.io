"""Draw og-image.png (1200x630), the picture shown when someone shares a MonsterSweeps link.
    python3 tools/og-image.py
Needs Playwright (uses the Chromium in /opt/pw-browsers when present) and the site fonts in /fonts."""
import asyncio, glob, os, pathlib, random
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
_r = random.Random(7)  # fixed seed: the same image every run
DUST = ''.join(f'<circle cx="{_r.uniform(0,1200):.0f}" cy="{_r.uniform(0,630):.0f}" r="{_r.uniform(.8,2.2):.1f}" fill="{_r.choice(["#ffd76e","#ffd76e","#c9adff"])}" opacity="{_r.uniform(.25,.8):.2f}"/>' for _ in range(80))
HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Adventor;src:url({(ROOT/'fonts/adventor-bold.woff').as_uri()})}}
@font-face{{font-family:InterW;src:url({(ROOT/'fonts/inter-600.woff').as_uri()});font-weight:600}}
body{{margin:0;width:1200px;height:630px;overflow:hidden;font-family:InterW,sans-serif;color:#f7f2ff;
  background:radial-gradient(900px 600px at 80% -10%,rgba(109,51,230,.75),transparent 62%),radial-gradient(700px 500px at 0% 110%,rgba(255,194,61,.22),transparent 60%),linear-gradient(180deg,#1d0c44,#110726)}}
.dust{{position:absolute;inset:0}}
.wrap{{position:absolute;left:84px;top:86px;right:84px}}
.brand{{display:flex;align-items:center;gap:20px;font:700 46px Adventor}}.brand b{{color:#ffc23d}}
.brand img{{width:84px;height:84px;filter:drop-shadow(0 10px 24px rgba(255,177,31,.45))}}
h1{{font:700 112px/0.98 Adventor;letter-spacing:-.03em;margin:46px 0 0;text-shadow:0 6px 30px rgba(20,10,43,.6)}}
h1 span{{display:block;color:#ffc23d}}
.pills{{display:flex;gap:14px;margin-top:40px}}
.pills div{{font:600 24px InterW;padding:12px 22px;border-radius:999px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1.5px rgba(201,173,255,.35)}}
.pills div:first-child{{background:linear-gradient(180deg,#ffe08a,#ffc23d 45%,#f0a21c);color:#2a1300;box-shadow:none}}
.coin{{position:absolute;right:70px;top:150px;width:330px;height:330px;filter:drop-shadow(0 30px 60px rgba(255,177,31,.35))}}
</style></head><body><svg class="dust" width="1200" height="630">{DUST}</svg>
<img class="coin" src="{(ROOT/'mark.svg').as_uri()}">
<div class="wrap"><div class="brand"><img src="{(ROOT/'mark.svg').as_uri()}"><div>Monster<b>Sweeps</b></div></div>
<h1>Spin free.<span>Every day.</span></h1>
<div class="pills"><div>Free daily spin</div><div>No purchase necessary</div><div>21+</div></div></div></body></html>"""

async def main():
    exe = (glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome') or [None])[0]
    tmp = ROOT / '.og-tmp.html'
    tmp.write_text(HTML)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=exe)
            pg = await b.new_page(viewport={'width': 1200, 'height': 630})
            await pg.goto(tmp.as_uri()); await pg.wait_for_timeout(500)
            await pg.screenshot(path=str(ROOT / 'og-image.png'))
            await b.close()
    finally:
        tmp.unlink(missing_ok=True)
    print('wrote og-image.png')

asyncio.run(main())
