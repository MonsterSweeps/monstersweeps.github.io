"""Build every web asset of the King (the MonsterHQ mascot) from the brand kit in brand/king-kit/.
    python3 tools/king-assets.py
Writes:
  img/stage/king-stage-{800,1200,1600,2000}.webp   hero key art (the King waving on the velvet stage)
  img/stage/stage-ambient.webp                     a heavily blurred copy used as the full-bleed glow behind the hero
  img/king/<pose>.webp, <pose>-sm.webp             transparent cutouts, trimmed to the figure
  logo-80.webp, logo-96/192/512.png, favicon-32/48.png, apple-touch-icon.png   the crest: King's head in a gold ring
  fonts/luckiest-guy.woff2, fonts/poppins-{600,800}.woff2                     Latin subsets
The art itself is never redrawn or recoloured: only trimmed, scaled, mirrored and (for the ambient glow) blurred.
Needs Pillow, numpy and fonttools (+ brotli)."""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(ROOT, 'brand', 'king-kit')
P = lambda *a: os.path.join(ROOT, *a)
os.makedirs(P('img', 'stage'), exist_ok=True)
os.makedirs(P('img', 'king'), exist_ok=True)


def save(im, path, q=84):
    im.save(path, 'WEBP', quality=q, method=6)
    print('wrote', os.path.relpath(path, ROOT), im.size)


def trim(im):
    a = np.array(im.split()[-1])
    a[a < 12] = 0
    return im.crop(Image.fromarray(a).getbbox())


# ---------- hero stage ----------
stage = Image.open(os.path.join(KIT, 'hero', 'king_stage_2000.webp')).convert('RGB')
for px in (640, 800, 1200, 1600, 2000):   # the edges are faded on the page, so a lighter encode costs nothing visible
    save(stage.resize((px, px), Image.LANCZOS), P('img', 'stage', f'king-stage-{px}.webp'), 74 if px <= 1200 else 80)
amb = stage.resize((120, 120), Image.LANCZOS).filter(ImageFilter.GaussianBlur(7)).resize((480, 480), Image.BICUBIC)
save(amb, P('img', 'stage', 'stage-ambient.webp'), 70)

# ---------- cutouts ----------
for f in sorted(os.listdir(os.path.join(KIT, 'king'))):
    if not f.endswith('.webp'):
        continue
    name = f[:-5].replace('_', '-')
    im = trim(Image.open(os.path.join(KIT, 'king', f)).convert('RGBA'))
    if name.startswith('turn'):
        continue
    full = im if im.height <= 760 or name.startswith('face') else im.resize((round(im.width * 760 / im.height), 760), Image.LANCZOS)
    if name in ('face-laugh', 'face-playful') and full.width > 1100:
        full = full.resize((1100, round(full.height * 1100 / full.width)), Image.LANCZOS)
    save(full, P('img', 'king', name + '.webp'))
    save(full.resize((full.width // 2, full.height // 2), Image.LANCZOS), P('img', 'king', name + '-sm.webp'))

# ---------- crest (logo + icons) ----------
face = trim(Image.open(os.path.join(KIT, 'king', 'face_happy.webp')).convert('RGBA'))


def crest(S, ring=True, pad_bg=False):
    """King's head inside a gold ring; crown and horns break out over the top of the ring."""
    k = 4
    s = S * k
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    cx, cy, r = s / 2, s * .56, s * .43
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    # velvet disc: bright royal top, deep night bottom
    t = np.clip((yy - (cy - r)) / (2 * r), 0, 1)[..., None]
    top, bot = np.array([126, 52, 224]), np.array([30, 6, 56])
    rgb = top * (1 - t) + bot * t
    disc = np.clip((r - d) * 1.0, 0, 1)
    if pad_bg:  # app icons: full square background, no transparency
        base = np.dstack([np.broadcast_to(np.array([18, 4, 31]), (s, s, 3)), np.full((s, s), 255)]).astype(np.uint8)
        im = Image.fromarray(base, 'RGBA')
    disc_im = Image.fromarray(np.dstack([rgb, disc * 255]).astype(np.uint8), 'RGBA')
    im.alpha_composite(disc_im)
    if ring:
        w = s * .045
        band = np.clip(1 - np.abs(d - r) / (w / 2), 0, 1) ** .6
        g = np.clip((yy - (cy - r)) / (2 * r), 0, 1)
        gold = np.dstack([255 - 23 * g, 246 - 96 * g, 170 - 155 * g])  # #FFF6AA -> #E8960F
        im.alpha_composite(Image.fromarray(np.dstack([gold, band * 255]).astype(np.uint8), 'RGBA'))
    # head: scaled so the face fills the disc and the crown rises above it
    fw = int(s * 1.04)
    fh = round(face.height * fw / face.width)
    f = face.resize((fw, fh), Image.LANCZOS)
    # the cutout ends in a straight line at the shoulders: fade its lowest quarter into the disc
    ramp = np.clip((fh - np.arange(fh, dtype=np.float32)) / (fh * .26), 0, 1) ** 1.3
    f.putalpha(Image.fromarray((np.array(f.split()[-1]) * ramp[:, None]).astype(np.uint8)))
    # keep only what sits inside the disc, plus everything above the disc's centre (crown, horns)
    fa = np.array(f.split()[-1]).astype(np.float32) / 255
    ox, oy = (s - fw) // 2, int(s * .015)
    fy, fx = np.mgrid[0:fh, 0:fw].astype(np.float32)
    inside = np.clip((r - .5 * w - np.sqrt((fx + ox - cx) ** 2 + (fy + oy - cy) ** 2)), 0, 1)
    above = (fy + oy) < cy
    keep = np.maximum(inside, above.astype(np.float32))
    f.putalpha(Image.fromarray((fa * keep * 255).astype(np.uint8)))
    im.alpha_composite(f, (ox, oy))
    return im.resize((S, S), Image.LANCZOS)


big = crest(1024)
for px, name in ((96, 'logo-96.png'), (192, 'logo-192.png'), (512, 'logo-512.png')):
    big.resize((px, px), Image.LANCZOS).save(P(name), optimize=True); print('wrote', name)
save(big.resize((80, 80), Image.LANCZOS), P('logo-80.webp'), 90)
save(big.resize((160, 160), Image.LANCZOS), P('logo-160.webp'), 88)
for px in (32, 48):
    crest(px * 4, ring=True).resize((px, px), Image.LANCZOS).save(P(f'favicon-{px}.png'), optimize=True); print('wrote favicon', px)
crest(180 * 2, pad_bg=True).resize((180, 180), Image.LANCZOS).convert('RGB').save(P('apple-touch-icon.png'), optimize=True)
print('wrote apple-touch-icon.png')

# ---------- fonts ----------
UNI = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+2713'
for src, out in (('LuckiestGuy-Regular.ttf', 'luckiest-guy.woff2'), ('Poppins-Bold.ttf', 'poppins-700.woff2'),
                 ('Poppins-ExtraBold.ttf', 'poppins-800.woff2')):
    subprocess.run([sys.executable, '-m', 'fontTools.subset', os.path.join(KIT, 'fonts', src), '--unicodes=' + UNI,
                    '--flavor=woff2', '--layout-features=kern,liga', '--output-file=' + P('fonts', out)], check=True)
    print('wrote fonts/' + out, os.path.getsize(P('fonts', out)))

# ---------- social share image (1200 x 630) ----------
from PIL import ImageFont
og = amb.resize((1200, 1200), Image.BICUBIC).crop((0, 285, 1200, 915)).convert('RGBA')
shade = np.zeros((630, 1200, 4), np.uint8); shade[..., :3] = (18, 4, 31)
shade[..., 3] = (np.clip(1 - np.linspace(0, 1, 1200) * 1.5, 0, 1) * 235).astype(np.uint8)[None, :]
og.alpha_composite(Image.fromarray(shade, 'RGBA'))
art = stage.resize((630, 630), Image.LANCZOS).convert('RGBA')
yy, xx = np.mgrid[0:630, 0:630].astype(np.float32)
rr = np.sqrt(((xx - 315) / 315) ** 2 + ((yy - 300) / 330) ** 2)
art.putalpha(Image.fromarray((np.clip((1 - rr) / .32, 0, 1) * 255).astype(np.uint8)))
og.alpha_composite(art, (600, 0))
fnt = lambda f, s: ImageFont.truetype(os.path.join(KIT, 'fonts', f), s)
def gold_text(img, xy, text, font):
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).text(xy, text, font=font, fill=255)
    g = np.linspace(0, 1, img.height)[:, None]
    bb = m.getbbox(); t = np.clip((np.arange(img.height) - bb[1]) / max(1, bb[3] - bb[1]), 0, 1)[:, None]
    col = np.dstack([255 - 23 * t + 0 * g, 246 - 96 * t + 0 * g, 170 - 155 * t + 0 * g]) * np.ones((1, img.width, 1))
    glow = m.filter(ImageFilter.GaussianBlur(14)).point(lambda v: v * .45)
    img.alpha_composite(Image.merge('RGBA', [Image.new('L', img.size, 232), Image.new('L', img.size, 150), Image.new('L', img.size, 15), glow]))
    img.alpha_composite(Image.fromarray(np.dstack([col, np.array(m)]).astype(np.uint8), 'RGBA'))
logo = big.resize((92, 92), Image.LANCZOS); og.alpha_composite(logo, (64, 48))
dr = ImageDraw.Draw(og)
dr.text((170, 72), 'Monster', font=fnt('LuckiestGuy-Regular.ttf', 40), fill=(255, 255, 255))
dr.text((170 + dr.textlength('Monster', font=fnt('LuckiestGuy-Regular.ttf', 40)), 72), 'Sweeps', font=fnt('LuckiestGuy-Regular.ttf', 40), fill=(255, 200, 70))
gold_text(og, (64, 196), 'One Monster.', fnt('Poppins-ExtraBold.ttf', 78))
gold_text(og, (64, 290), 'Three platforms.', fnt('Poppins-ExtraBold.ttf', 78))
dr.text((66, 410), 'Sweeps.Monster  ·  MonsterSweeps  ·  MonsterPay', font=fnt('Poppins-Bold.ttf', 27), fill=(210, 184, 255))
pill = fnt('Poppins-Bold.ttf', 22); x = 66
for label in ('21+ only', 'Four official sites', 'Play responsibly'):
    w = dr.textlength(label, font=pill) + 40
    dr.rounded_rectangle((x, 480, x + w, 526), radius=23, outline=(255, 200, 70), width=2, fill=(40, 12, 60))
    dr.text((x + 20, 488), label, font=pill, fill=(255, 246, 170)); x += w + 14
og.convert('RGB').save(P('og-image.jpg'), quality=86, optimize=True, progressive=True)
print('wrote og-image.jpg')
