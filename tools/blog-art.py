"""Draw the four blog illustrations (img/*.webp): royal purple scenes with coin-gold objects, no mascot.

    python3 tools/blog-art.py            # writes img/<slug>.webp
Needs Pillow and Playwright (uses the Chromium in /opt/pw-browsers when present).
"""
import asyncio, glob, io, math, os
from PIL import Image
from playwright.async_api import async_playwright

DEFS = '''
<defs>
  <radialGradient id="bg" cx="70%" cy="10%" r="95%"><stop offset="0" stop-color="#4a1fa8"/><stop offset=".45" stop-color="#2a1162"/><stop offset="1" stop-color="#12082a"/></radialGradient>
  <radialGradient id="ember" cx="12%" cy="100%" r="60%"><stop offset="0" stop-color="#ffc23d" stop-opacity=".22"/><stop offset="1" stop-color="#ffc23d" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".55"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".4" stop-color="#ffc23d"/><stop offset=".8" stop-color="#d8901a"/><stop offset="1" stop-color="#8a4f08"/></linearGradient>
  <linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#ffc23d"/><stop offset="1" stop-color="#b77a10"/></linearGradient>
  <linearGradient id="goldEdge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a5a0a"/><stop offset=".35" stop-color="#f0a21c"/><stop offset=".6" stop-color="#ffd76e"/><stop offset="1" stop-color="#9a5a0a"/></linearGradient>
  <linearGradient id="violet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9adff"/><stop offset=".45" stop-color="#8b5cf6"/><stop offset="1" stop-color="#3a1a86"/></linearGradient>
  <linearGradient id="violetEdge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1162"/><stop offset=".5" stop-color="#7b4ae8"/><stop offset="1" stop-color="#2a1162"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a32b8" stop-opacity=".55"/><stop offset="1" stop-color="#24104f" stop-opacity=".55"/></linearGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#05000f" flood-opacity=".6"/></filter>
</defs>'''


def backdrop(w, h, seed):
    stars = []
    for i in range(26):
        x = (math.sin(i * 12.9898 + seed) * 43758.5453) % 1 * w
        y = (math.sin(i * 78.233 + seed * 3) * 12345.678) % 1 * h
        r = .8 + (i % 4) * .45
        col = '#ffd76e' if i % 3 else '#c9adff'
        stars.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="{col}" opacity="{.35 + (i % 5) * .12:.2f}"/>')
    return (f'<rect width="{w}" height="{h}" fill="url(#bg)"/><rect width="{w}" height="{h}" fill="url(#ember)"/>' + ''.join(stars))


def sparkle(x, y, s=1, col='#fff3c4'):
    return (f'<path transform="translate({x} {y}) scale({s})" d="M0 -14 C1.5 -3 3 -1.5 14 0 C3 1.5 1.5 3 0 14 C-1.5 3 -3 1.5 -14 0 C-3 -1.5 -1.5 -3 0 -14Z" fill="{col}"/>')


def coin_stack(x, y, n, rx=34, ry=11, th=9, face='url(#gold)', edge='url(#goldEdge)', mark=True):
    """A stack of n coins seen from the side; (x, y) is the centre of the bottom coin's lower rim."""
    out = []
    for i in range(n):
        cy = y - i * th
        dx = (i % 3 - 1) * 2.5
        out.append(f'<path d="M{x-rx+dx} {cy-th} v{th} a{rx} {ry} 0 0 0 {2*rx} 0 v-{th}" fill="{edge}" stroke="#5a3004" stroke-opacity=".35"/>')
        out.append(f'<ellipse cx="{x+dx}" cy="{cy-th}" rx="{rx}" ry="{ry}" fill="{face}" stroke="#fff3c4" stroke-opacity=".5"/>')
    if mark:
        top = y - (n - 1) * th - th
        out.append(f'<ellipse cx="{x}" cy="{top}" rx="{rx*.62}" ry="{ry*.62}" fill="none" stroke="#8a4f08" stroke-opacity=".45" stroke-width="2"/>')
    return ''.join(out)


def crown(x, y, s=1, fill='url(#goldV)'):
    return (f'<g transform="translate({x} {y}) scale({s})"><path d="M-21 11 L-24 -11 L-11 0 L0 -16 L11 0 L24 -11 L21 11 Z M-21 14 H21 V19 H-21 Z" fill="{fill}" stroke="#8a4f08" stroke-width="1.2"/>'
            '<circle cx="-24" cy="-13.5" r="3.2" fill="#ffe08a"/><circle cx="0" cy="-18.5" r="3.4" fill="#ffe08a"/><circle cx="24" cy="-13.5" r="3.2" fill="#ffe08a"/>'
            '<path d="M0 -4 L5 2 L0 8 L-5 2 Z" fill="#7b3fe4"/></g>')


def wheel_scene(w, h):
    cx, cy, R = w * .44, h * .52, 150
    segs = []
    cols = ['url(#goldV)', '#6d33e6', '#ffd76e', '#4a1fb8'] * 2
    for i in range(8):
        a0, a1 = (i / 8) * 2 * math.pi - math.pi / 2, ((i + 1) / 8) * 2 * math.pi - math.pi / 2
        x0, y0, x1, y1 = cx + R * math.cos(a0), cy + R * math.sin(a0), cx + R * math.cos(a1), cy + R * math.sin(a1)
        segs.append(f'<path d="M{cx} {cy} L{x0:.1f} {y0:.1f} A{R} {R} 0 0 1 {x1:.1f} {y1:.1f} Z" fill="{cols[i]}"/>')
    bulbs = ''.join(f'<circle cx="{cx + (R+12)*math.cos(i/24*2*math.pi):.1f}" cy="{cy + (R+12)*math.sin(i/24*2*math.pi):.1f}" r="4.2" fill="#fff6d0"/>' for i in range(24))
    return (backdrop(w, h, 1) + f'<circle cx="{cx}" cy="{cy}" r="{R+60}" fill="url(#halo)"/>'
            f'<g filter="url(#shadow)"><circle cx="{cx}" cy="{cy}" r="{R+22}" fill="url(#gold)"/><circle cx="{cx}" cy="{cy}" r="{R+4}" fill="#2a1162"/>' + ''.join(segs) + bulbs +
            f'<circle cx="{cx}" cy="{cy}" r="30" fill="url(#gold)" stroke="#8a4f08" stroke-width="2"/>' + crown(cx, cy + 2, .78) + '</g>'
            f'<path d="M{cx-16} {cy-R-34} h32 l-16 34 z" fill="#ff3b6b" stroke="#fff" stroke-width="2.5" filter="url(#shadow)"/>'
            + coin_stack(w * .83, h * .86, 7) + coin_stack(w * .72, h * .9, 4) + sparkle(w * .86, h * .2, 1.2) + sparkle(w * .12, h * .25, .8))


def balance_scene(w, h):
    cx, top = w / 2, h * .2
    beam_y = top + 40
    lx, rx = cx - 165, cx + 165
    pan = lambda x, y: (f'<path d="M{x} {beam_y+4} L{x-58} {y} M{x} {beam_y+4} L{x+58} {y}" stroke="#ffd76e" stroke-width="2.5" opacity=".8"/>'
                        f'<path d="M{x-80} {y} h160 a80 22 0 0 1 -160 0 z" fill="url(#gold)" stroke="#8a4f08"/>')
    return (backdrop(w, h, 2) + f'<circle cx="{cx}" cy="{h*.5}" r="200" fill="url(#halo)"/>'
            f'<g filter="url(#shadow)">'
            f'<path d="M{cx-60} {h*.92} h120 l-24 -26 h-72 z" fill="url(#gold)" stroke="#8a4f08"/>'
            f'<rect x="{cx-7}" y="{beam_y}" width="14" height="{h*.66 - 4}" rx="6" fill="url(#goldEdge)"/>'
            f'<rect x="{lx-6}" y="{beam_y-6}" width="{rx-lx+12}" height="12" rx="6" fill="url(#gold)" stroke="#8a4f08"/>'
            f'<circle cx="{cx}" cy="{beam_y}" r="14" fill="url(#gold)" stroke="#8a4f08"/>'
            + pan(lx, h * .62) + pan(rx, h * .62) +
            coin_stack(lx, h * .62 - 2, 5) +
            coin_stack(rx, h * .62 - 2, 5, face='url(#violet)', edge='url(#violetEdge)') +
            '</g>' + crown(cx, top - 6, .9) + sparkle(w * .12, h * .2, 1) + sparkle(w * .9, h * .3, .8, '#c9adff'))


def tiers_scene(w, h):
    base = h * .86
    cols = ['#d9915a', '#d5dbe8', '#ffc23d', '#8fd6ff', '#c9adff']
    bw, gap = 74, 16
    x0 = (w - (5 * bw + 4 * gap)) / 2
    bars = []
    for i, c in enumerate(cols):
        bh = 60 + i * 40
        x = x0 + i * (bw + gap)
        bars.append(f'<rect x="{x}" y="{base-bh}" width="{bw}" height="{bh}" rx="14" fill="url(#glass)" stroke="{c}" stroke-width="2"/>'
                    f'<rect x="{x}" y="{base-bh}" width="{bw}" height="10" rx="5" fill="{c}" opacity=".9"/>'
                    f'<path transform="translate({x+bw/2} {base-bh+30})" d="M0 -11 L11 -2 L0 13 L-11 -2 Z" fill="{c}"/>')
    gx, gy = x0 + 4 * (bw + gap) + bw / 2, base - (60 + 4 * 40) - 64
    gem = (f'<g transform="translate({gx} {gy})" filter="url(#shadow)"><circle r="46" fill="url(#halo)"/>'
           '<path d="M-30 -10 L-16 -28 H16 L30 -10 L0 34 Z" fill="url(#violet)"/>'
           '<path d="M-30 -10 H30 L0 34 Z" fill="#8b5cf6"/><path d="M-16 -28 L-8 -10 L8 -10 L16 -28 Z" fill="#e2d2ff"/>'
           '<path d="M-8 -10 L0 34 L8 -10 Z" fill="#ffc23d" opacity=".85"/></g>')
    return (backdrop(w, h, 3) + f'<ellipse cx="{w/2}" cy="{base+6}" rx="{w*.38}" ry="14" fill="#05000f" opacity=".45"/>' + ''.join(bars) + gem
            + sparkle(w * .12, h * .2, 1) + sparkle(w * .2, h * .55, .6, '#c9adff'))


def shield_scene(w, h):
    cx, cy = w / 2, h * .5
    shield = f'M{cx} {cy-140} L{cx+110} {cy-100} V{cy-10} C{cx+110} {cy+70} {cx+55} {cy+115} {cx} {cy+140} C{cx-55} {cy+115} {cx-110} {cy+70} {cx-110} {cy-10} V{cy-100} Z'
    ticks = ''.join(f'<line x1="{cx + 52*math.cos(i/12*2*math.pi):.1f}" y1="{cy-12 + 52*math.sin(i/12*2*math.pi):.1f}" x2="{cx + 44*math.cos(i/12*2*math.pi):.1f}" y2="{cy-12 + 44*math.sin(i/12*2*math.pi):.1f}" stroke="#2a1162" stroke-width="{3 if i % 3 == 0 else 1.5}"/>' for i in range(12))
    toggle = lambda x, y, on: (f'<rect x="{x}" y="{y}" width="64" height="32" rx="16" fill="{"#3fd27a" if on else "#3a1a86"}" stroke="#c9adff" stroke-opacity=".4"/>'
                               f'<circle cx="{x + (46 if on else 18)}" cy="{y+16}" r="12" fill="#fff"/>')
    return (backdrop(w, h, 4) + f'<circle cx="{cx}" cy="{cy}" r="190" fill="url(#halo)"/>'
            f'<g filter="url(#shadow)"><path d="{shield}" fill="url(#gold)" stroke="#8a4f08" stroke-width="2"/>'
            f'<path d="{shield}" fill="url(#violet)" transform="translate({cx} {cy}) scale(.84) translate({-cx} {-cy})"/>'
            f'<circle cx="{cx}" cy="{cy-12}" r="60" fill="#fff6e0" stroke="url(#gold)" stroke-width="7"/>' + ticks +
            f'<line x1="{cx}" y1="{cy-12}" x2="{cx}" y2="{cy-50}" stroke="#2a1162" stroke-width="5" stroke-linecap="round"/>'
            f'<line x1="{cx}" y1="{cy-12}" x2="{cx+28}" y2="{cy+4}" stroke="#2a1162" stroke-width="5" stroke-linecap="round"/>'
            f'<circle cx="{cx}" cy="{cy-12}" r="6" fill="#ffc23d"/>'
            f'<circle cx="{cx+56}" cy="{cy+62}" r="26" fill="#3fd27a" stroke="#fff" stroke-width="4"/>'
            f'<path d="M{cx+43} {cy+62} l9 9 l17 -18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>'
            + toggle(w * .1, h * .3, True) + toggle(w * .1, h * .3 + 46, False) + toggle(w * .8, h * .62, True)
            + sparkle(w * .86, h * .2, 1) + sparkle(w * .16, h * .82, .7, '#c9adff'))


SCENES = {  # slug: (height, drawer); width is 640 for all, heights match the old files
    'sweepstakes-casino-101': (411, wheel_scene),
    'social-casino-vs-sweepstakes-casino': (403, balance_scene),
    'xp-tiers-and-vip-explained': (412, tiers_scene),
    'responsible-play-toolkit': (420, shield_scene),
}


async def main(out='img'):
    exe = (glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome') or [None])[0]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=exe)
        pg = await b.new_page(viewport={'width': 640, 'height': 420}, device_scale_factor=2)
        for slug, (h, draw) in SCENES.items():
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="{h}" viewBox="0 0 640 {h}">{DEFS}{draw(640, h)}</svg>'
            await pg.set_content(f'<html><body style="margin:0;background:#12082a">{svg}</body></html>')
            png = await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 640, 'height': h})
            Image.open(io.BytesIO(png)).convert('RGB').resize((640, h), Image.LANCZOS).save(os.path.join(out, slug + '.webp'), 'WEBP', quality=86, method=6)
            print('wrote', slug)
        await b.close()


if __name__ == '__main__':
    asyncio.run(main())
