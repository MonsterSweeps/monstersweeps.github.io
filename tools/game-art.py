"""Draw the 12 original game-category tiles (img/games/<slug>.webp, 600x600) used in the homepage game rows
until the platform's official game thumbnails arrive. Royal purple scenes with a coin-gold emblem; no studio art.
    python3 tools/game-art.py
Reuses the gradients and helpers from tools/blog-art.py. Needs Pillow and Playwright."""
import asyncio, glob, importlib.util, io, math, os
from PIL import Image
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('blogart', os.path.join(ROOT, 'tools', 'blog-art.py'))
BA = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(BA)
DEFS, sparkle, coin_stack, crown = BA.DEFS, BA.sparkle, BA.coin_stack, BA.crown
S = 600
C = S / 2


def bg(seed, glow='#8b5cf6'):
    """Royal backdrop: radial violet glow, deep plum corners, a few gold specks."""
    out = [f'<rect width="{S}" height="{S}" fill="url(#bg)"/>',
           f'<circle cx="{C}" cy="{C*.95}" r="250" fill="{glow}" opacity=".28" filter="url(#glow)"/>']
    for i in range(18):
        x = (math.sin(i * 12.9898 + seed) * 43758.5453) % 1 * S
        y = (math.sin(i * 78.233 + seed * 3) * 12345.678) % 1 * S
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{1 + (i % 3) * .6:.1f}" fill="#ffd76e" opacity="{.25 + (i % 4) * .12:.2f}"/>')
    return ''.join(out)


def reel(x, y, w, h, sym):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="#fff6e0" stroke="#8a4f08" stroke-width="3"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h*.18}" rx="16" fill="#000" opacity=".08"/>'
            f'<text x="{x + w/2}" y="{y + h*.66}" text-anchor="middle" font-family="Adventor, Arial Black, sans-serif" font-weight="700" font-size="{h*.5}" fill="#c0262f">{sym}</text>')


def classic_slots():
    return (bg(1) + '<g filter="url(#shadow)">'
            f'<rect x="90" y="150" width="420" height="300" rx="36" fill="url(#gold)" stroke="#8a4f08" stroke-width="3"/>'
            f'<rect x="115" y="185" width="370" height="200" rx="22" fill="#2a1162"/>'
            + reel(130, 200, 105, 170, '7') + reel(247, 200, 105, 170, '7') + reel(364, 200, 105, 170, '7') +
            f'<rect x="210" y="405" width="180" height="26" rx="13" fill="#3a1a86"/>'
            f'<rect x="525" y="200" width="16" height="150" rx="8" fill="url(#goldEdge)"/><circle cx="533" cy="190" r="24" fill="#ff3b6b" stroke="#fff" stroke-width="3"/>'
            '</g>' + sparkle(90, 110, 1.2) + sparkle(500, 480, .8))


def megaways():
    cols = []
    for i in range(6):
        n = [3, 5, 4, 6, 5, 3][i]; x = 85 + i * 75; h = 300 / n
        for j in range(n):
            cols.append(f'<rect x="{x}" y="{150 + j*h + 3:.1f}" width="66" height="{h-6:.1f}" rx="8" fill="{["#ffc23d","#8b5cf6","#ffe08a","#6d33e6"][(i+j)%4]}" stroke="#2a1162" stroke-width="2"/>')
    return (bg(2, '#6d33e6') + '<g filter="url(#shadow)">'
            '<rect x="70" y="135" width="460" height="330" rx="28" fill="#1a0c3a" stroke="url(#gold)" stroke-width="8"/>' + ''.join(cols) +
            '</g>' + sparkle(520, 110, 1.1) + sparkle(80, 500, .8))


def hold_and_win():
    cells = []
    for r in range(3):
        for c in range(4):
            x, y = 105 + c * 100, 160 + r * 100
            locked = (r * 4 + c) in (0, 2, 5, 6, 9, 11)
            cells.append(f'<rect x="{x}" y="{y}" width="90" height="90" rx="16" fill="{"#2a1162" if not locked else "#3a1a86"}" stroke="{"#ffc23d" if locked else "#5a32b8"}" stroke-width="3"/>')
            if locked:
                cells.append(f'<circle cx="{x+45}" cy="{y+45}" r="32" fill="url(#gold)" stroke="#8a4f08" stroke-width="2"/><circle cx="{x+45}" cy="{y+45}" r="22" fill="none" stroke="#8a4f08" stroke-opacity=".45" stroke-width="2"/>')
    return bg(3) + '<g filter="url(#shadow)">' + ''.join(cells) + '</g>' + sparkle(500, 120, 1.1) + sparkle(90, 480, .9)


def jackpots():
    return (bg(4, '#ffc23d') + '<g filter="url(#shadow)">' + coin_stack(190, 470, 7, rx=60, ry=18, th=16) + coin_stack(410, 470, 9, rx=60, ry=18, th=16)
            + coin_stack(300, 500, 5, rx=60, ry=18, th=16) + '</g>' + crown(300, 200, 3.2) + sparkle(110, 120, 1.3) + sparkle(500, 150, 1))


def crash():
    return (bg(5, '#ff3b6b') +
            '<path d="M90 480 C 230 470 330 420 470 170" fill="none" stroke="url(#goldEdge)" stroke-width="10" stroke-linecap="round"/>'
            '<path d="M90 480 C 230 470 330 420 470 170 L470 480 Z" fill="#ffc23d" opacity=".12"/>'
            '<g transform="translate(470 170) rotate(40)" filter="url(#shadow)">'
            '<path d="M0 -70 C 30 -40 30 30 18 50 L-18 50 C -30 30 -30 -40 0 -70 Z" fill="#f7f2ff" stroke="#8a4f08" stroke-width="3"/>'
            '<circle cx="0" cy="-12" r="14" fill="#8b5cf6" stroke="#2a1162" stroke-width="3"/>'
            '<path d="M-18 30 L-40 62 L-16 52 Z M18 30 L40 62 L16 52 Z" fill="#ff3b6b"/>'
            '<path d="M-12 52 Q0 100 12 52 Z" fill="#ffc23d"/></g>'
            + sparkle(130, 140, 1.2) + sparkle(520, 420, .9))


def fish():
    return (bg(6, '#3fb6ff') + '<g filter="url(#shadow)" transform="translate(300 300)">'
            '<path d="M-170 0 C -100 -110 90 -110 150 0 C 90 110 -100 110 -170 0 Z" fill="url(#gold)" stroke="#8a4f08" stroke-width="4"/>'
            '<path d="M150 0 L240 -80 L215 0 L240 80 Z" fill="url(#goldV)" stroke="#8a4f08" stroke-width="4"/>'
            '<circle cx="-95" cy="-18" r="20" fill="#fff"/><circle cx="-92" cy="-18" r="10" fill="#1a0c3a"/>'
            '<path d="M-40 -70 C -10 -40 -10 40 -40 70 M20 -72 C 50 -40 50 40 20 72" fill="none" stroke="#8a4f08" stroke-opacity=".5" stroke-width="4"/>'
            '</g>'
            + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#c9adff" stroke-width="3" opacity=".7"/>' for x, y, r in [(110, 150, 16), (140, 110, 10), (480, 470, 14), (510, 430, 8)]))


def card(x, y, rot, label, suit, col='#c0262f'):
    return (f'<g transform="translate({x} {y}) rotate({rot})"><rect x="-80" y="-115" width="160" height="230" rx="18" fill="#fff6e0" stroke="#8a4f08" stroke-width="3"/>'
            f'<text x="-58" y="-70" font-family="Adventor, Arial Black, sans-serif" font-weight="700" font-size="44" fill="{col}">{label}</text>'
            f'<text x="0" y="40" text-anchor="middle" font-size="96" fill="{col}">{suit}</text></g>')


def chip(x, y, r, col):
    dash = ''.join(f'<rect x="{x - 7}" y="{y - r}" width="14" height="{r*.32}" fill="#fff" transform="rotate({a} {x} {y})"/>' for a in range(0, 360, 45))
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}" stroke="#fff" stroke-width="4"/>{dash}<circle cx="{x}" cy="{y}" r="{r*.55}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/>'


def live_tables():
    return (bg(7, '#3fd27a') + '<g filter="url(#shadow)">'
            '<ellipse cx="300" cy="380" rx="240" ry="120" fill="#0f6b3c" stroke="url(#gold)" stroke-width="10"/>'
            + card(240, 300, -12, 'A', '♠', '#1a0c3a') + card(345, 300, 10, 'K', '♥') + chip(160, 420, 46, '#6d33e6') + chip(450, 430, 46, '#c0262f') +
            '</g>' + sparkle(100, 110, 1.1) + sparkle(510, 120, .9))


def roulette():
    segs = []
    R = 190
    for i in range(18):
        a0, a1 = i / 18 * 2 * math.pi, (i + 1) / 18 * 2 * math.pi
        segs.append(f'<path d="M{C} {C} L{C+R*math.cos(a0):.1f} {C+R*math.sin(a0):.1f} A{R} {R} 0 0 1 {C+R*math.cos(a1):.1f} {C+R*math.sin(a1):.1f} Z" fill="{["#c0262f","#1a0c3a"][i%2] if i else "#0f6b3c"}"/>')
    return (bg(8) + '<g filter="url(#shadow)">' f'<circle cx="{C}" cy="{C}" r="{R+28}" fill="url(#gold)" stroke="#8a4f08" stroke-width="3"/>' + ''.join(segs) +
            f'<circle cx="{C}" cy="{C}" r="110" fill="#2a1162" stroke="url(#gold)" stroke-width="8"/>' + crown(C, C + 4, 1.6) +
            f'<circle cx="{C+150}" cy="{C-95}" r="14" fill="#fff"/></g>')


def blackjack():
    return (bg(9, '#6d33e6') + '<g filter="url(#shadow)">' + card(235, 300, -10, 'A', '♠', '#1a0c3a') + card(365, 300, 10, 'K', '♦') + '</g>'
            '<g filter="url(#shadow)"><circle cx="300" cy="470" r="52" fill="url(#gold)" stroke="#8a4f08" stroke-width="3"/>'
            '<text x="300" y="490" text-anchor="middle" font-family="Adventor, Arial Black, sans-serif" font-weight="700" font-size="54" fill="#2a1300">21</text></g>'
            + sparkle(110, 120, 1.1))


def scratch():
    return (bg(10) + '<g filter="url(#shadow)" transform="rotate(-8 300 300)">'
            '<rect x="110" y="170" width="380" height="260" rx="26" fill="#f7f2ff" stroke="url(#gold)" stroke-width="8"/>'
            '<rect x="140" y="200" width="320" height="200" rx="16" fill="#b9abd9"/>'
            '<path d="M150 330 C 210 250 260 360 320 270 C 360 220 400 300 450 250 L450 390 L150 390 Z" fill="#fff6e0"/>'
            + coin_stack(250, 380, 1, rx=36, ry=12, th=8) + coin_stack(350, 375, 1, rx=36, ry=12, th=8) +
            '<circle cx="455" cy="230" r="34" fill="url(#gold)" stroke="#8a4f08" stroke-width="3"/></g>' + sparkle(90, 120, 1.1) + sparkle(510, 480, .9))


def bonus_buy():
    return (bg(11, '#ff3b6b') + '<g filter="url(#shadow)">'
            '<rect x="150" y="270" width="300" height="210" rx="18" fill="#6d33e6" stroke="#2a1162" stroke-width="3"/>'
            '<rect x="130" y="220" width="340" height="70" rx="16" fill="#8b5cf6" stroke="#2a1162" stroke-width="3"/>'
            '<rect x="280" y="220" width="40" height="260" fill="url(#goldV)"/>'
            '<path d="M300 220 C 240 130 170 170 220 215 Z M300 220 C 360 130 430 170 380 215 Z" fill="url(#gold)" stroke="#8a4f08" stroke-width="3"/>'
            '</g>' + sparkle(120, 140, 1.3) + sparkle(480, 140, 1) + sparkle(500, 470, .8))


def daily_wheel():
    R, segs = 200, []
    cols = ['url(#goldV)', '#6d33e6', '#ffd76e', '#4a1fb8'] * 2
    for i in range(8):
        a0, a1 = i / 8 * 2 * math.pi - math.pi / 2, (i + 1) / 8 * 2 * math.pi - math.pi / 2
        segs.append(f'<path d="M{C} {C+20} L{C+R*math.cos(a0):.1f} {C+20+R*math.sin(a0):.1f} A{R} {R} 0 0 1 {C+R*math.cos(a1):.1f} {C+20+R*math.sin(a1):.1f} Z" fill="{cols[i]}"/>')
    bulbs = ''.join(f'<circle cx="{C+(R+14)*math.cos(i/20*2*math.pi):.1f}" cy="{C+20+(R+14)*math.sin(i/20*2*math.pi):.1f}" r="5" fill="#fff6d0"/>' for i in range(20))
    return (bg(12) + '<g filter="url(#shadow)">' f'<circle cx="{C}" cy="{C+20}" r="{R+26}" fill="url(#gold)"/>' + ''.join(segs) + bulbs +
            f'<circle cx="{C}" cy="{C+20}" r="40" fill="url(#gold)" stroke="#8a4f08" stroke-width="3"/>' + crown(C, C + 22, 1) + '</g>'
            f'<path d="M{C-20} 50 h40 l-20 44 z" fill="#ff3b6b" stroke="#fff" stroke-width="3"/>')


TILES = [  # slug, drawer
    ('classic-slots', classic_slots), ('megaways', megaways), ('hold-and-win', hold_and_win), ('jackpots', jackpots),
    ('crash', crash), ('fish-games', fish), ('live-tables', live_tables), ('roulette', roulette),
    ('blackjack', blackjack), ('scratch-cards', scratch), ('bonus-buy', bonus_buy), ('daily-wheel', daily_wheel),
]


async def main():
    out = os.path.join(ROOT, 'img', 'games'); os.makedirs(out, exist_ok=True)
    exe = (glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome') or [None])[0]
    font = 'file://' + os.path.join(ROOT, 'fonts', 'adventor-bold.woff')
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=exe)
        pg = await b.new_page(viewport={'width': S, 'height': S}, device_scale_factor=1.5)
        for slug, draw in TILES:
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">{DEFS}{draw()}</svg>'
            await pg.set_content(f'<html><head><style>@font-face{{font-family:Adventor;src:url({font})}}body{{margin:0;background:#12082a}}</style></head><body>{svg}</body></html>')
            await pg.wait_for_timeout(150)
            png = await pg.screenshot(clip={'x': 0, 'y': 0, 'width': S, 'height': S})
            Image.open(io.BytesIO(png)).convert('RGB').resize((S, S), Image.LANCZOS).save(os.path.join(out, slug + '.webp'), 'WEBP', quality=84, method=6)
            print('wrote', slug)
        await b.close()


if __name__ == '__main__':
    asyncio.run(main())
