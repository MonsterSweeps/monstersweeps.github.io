"""Clean the 2.5D Monster rig layers (rig/*.webp) cut from the brand artwork.

- drops stray scraps (keeps the main shape of each part)
- removes the ghost horn outlines and stray strokes left in body.webp
- removes the fur scraps stuck to the crown
- recolours the horns (and the horn stubs inside body.webp) to warm gold
- decontaminates edge colour and chokes the alpha slightly so no halo shows

Run it on the ORIGINAL layers (git history before the clean-up commit):
    python3 tools/clean-rig.py --src path/to/original/rig --out rig
Needs Pillow, numpy and scipy.
"""
import argparse, json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd


def load(src, n):
    return np.array(Image.open(os.path.join(src, n + '.webp')).convert('RGBA')).astype(np.float32)


def save(out, n, im):
    Image.fromarray(np.clip(im, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(out, n + '.webp'), 'WEBP', quality=90, method=6, exact=False)


def keep_main(a, th=24, min_frac=.02):
    """Zero every alpha island smaller than min_frac of the largest one."""
    lab, k = nd.label(nd.binary_dilation(a > th, iterations=2))
    if k < 2:
        return a
    sizes = nd.sum(np.ones_like(a), lab, range(1, k + 1))
    keep = np.isin(lab, 1 + np.flatnonzero(sizes >= sizes.max() * min_frac))
    return a * keep


def hsv(rgb):
    r, g, b = rgb[..., 0] / 255, rgb[..., 1] / 255, rgb[..., 2] / 255
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, np.where(mx > 0, d / (mx + 1e-6), 0), mx


def goldify(rgb, mask, ref=None):
    """Repaint as polished gold: luminance (stretched over the part, or over ref) drives a bronze->gold->cream ramp."""
    lum = (rgb[..., 0] * .3 + rgb[..., 1] * .59 + rgb[..., 2] * .11) / 255
    sel = (ref if ref is not None else mask) > .5
    lo, hi = np.percentile(lum[sel], [3, 99]) if sel.any() else (0, 1)
    t = np.clip((lum - lo) / max(hi - lo, 1e-3), 0, 1) ** 1.35
    stops = np.array([[58, 26, 4], [150, 88, 10], [232, 160, 32], [255, 204, 72], [255, 242, 196]], np.float32)
    t4 = t * 4
    i = np.clip(t4.astype(int), 0, 3)
    f = (t4 - i)[..., None]
    g = stops[i] * (1 - f) + stops[i + 1] * f
    m3 = np.clip(mask, 0, 1)[..., None].astype(np.float32)
    rgb[...] = rgb * (1 - m3) + g * m3


def decontaminate(im, th=230):
    """Give semi-transparent edge pixels the colour of the nearest solid pixel, then choke alpha a touch."""
    a = im[..., 3]
    solid = a >= th
    if solid.any():
        _, (iy, ix) = nd.distance_transform_edt(~solid, return_indices=True)
        edge = (a > 0) & ~solid
        im[..., :3][edge] = im[..., :3][iy[edge], ix[edge]] * .7 + im[..., :3][edge] * .3
    im[..., 3] = np.clip((a - 30) * 255 / 225, 0, 255)
    im[..., :3][im[..., 3] == 0] = 0
    return im


def layer_to_tex(M, src_name, dst_name, src_alpha):
    """Resample one layer's alpha into another layer's texture space (both are stretched over their rects)."""
    rs, rd = M['layers'][src_name]['rect'], M['layers'][dst_name]['rect']
    ts, td = M['layers'][src_name]['tex'], M['layers'][dst_name]['tex']
    # pixel in dst tex -> frame px -> src tex
    sx, sy = rd[2] / td[0], rd[3] / td[1]
    x0 = (rd[0] - rs[0]) * ts[0] / rs[2]
    y0 = (rd[1] - rs[1]) * ts[1] / rs[3]
    kx, ky = sx * ts[0] / rs[2], sy * ts[1] / rs[3]
    img = Image.fromarray(src_alpha.astype(np.uint8), 'L')
    # PIL affine maps output -> input: (x_in, y_in) = (a*x + b*y + c, d*x + e*y + f)
    return np.array(img.transform((td[0], td[1]), Image.AFFINE, (kx, 0, x0, 0, ky, y0), resample=Image.BILINEAR)).astype(np.float32)


def paint_eyelid(M, b):
    """The socket under the eye shows whenever he blinks: paint it as a closed, furry lid with a lash line."""
    r = M['layers']['body']['rect']; t = M['layers']['body']['tex']
    sx, sy = t[0] / r[2], t[1] / r[3]
    sr = M['layers']['sclera']['rect']
    cx, cy = (M['eye']['center'][0] - r[0]) * sx, (M['eye']['center'][1] - r[1]) * sy
    rx, ry = sr[2] / 2 * sx * 1.02, sr[3] / 2 * sy * 1.02
    H, W = b.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    e = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    m = np.clip((1.0 - e) / .08, 0, 1)                     # soft-edged socket mask
    ty = np.clip((yy - (cy - ry)) / (2 * ry), 0, 1)
    top, bot = np.array([150, 92, 242], np.float32), np.array([86, 36, 180], np.float32)
    lid = top * (1 - ty[..., None]) + bot * ty[..., None]
    lum = (b[..., 0] * .3 + b[..., 1] * .59 + b[..., 2] * .11) / 255
    lid *= (.85 + .3 * (lum - lum[m > .5].mean()))[..., None]  # keep a little of the painted texture
    d = np.clip(1 - e, 0, 1) ** .5                         # dome shading
    lid *= (.78 + .3 * d)[..., None]
    rng = np.random.default_rng(7)                         # streaky fur so the lid matches his coat
    fur = nd.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), (9, 2.2))
    lid *= (1 + fur / (fur.std() + 1e-6) * .045)[..., None]
    b[..., :3] = b[..., :3] * (1 - m[..., None]) + lid * m[..., None]
    # lash line: a gentle smile-curve through the middle, where the eye closes to
    img = Image.new('L', (W, H), 0); g = ImageDraw.Draw(img)
    w = max(6, int(ry * .07))
    box = [cx - rx * .8, cy - ry * .5, cx + rx * .8, cy + ry * .04]   # arc bottom sits on the line the eye closes to
    g.arc(box, 14, 166, fill=255, width=w)
    ax, ay = rx * .8, ry * .27
    for deg in (60, 90, 120):
        ang = np.radians(deg)
        x0, y0 = cx + np.cos(ang) * ax, cy - ry * .23 + np.sin(ang) * ay
        g.line([x0, y0, x0 + np.cos(ang) * w * 2.6, y0 + np.sin(ang) * w * 2.6], fill=255, width=max(4, w * 2 // 3))
    lash = nd.gaussian_filter(np.array(img, np.float32) / 255, 1.2)[..., None]
    b[..., :3] = b[..., :3] * (1 - lash) + np.array([34, 10, 70], np.float32) * lash


def stills(M, out, dest):
    """Flat transparent stills of the full rig (the no-WebGL fallback): mascot-720.webp and mascot-1200.webp."""
    FS = M['frame'][2]
    can = Image.new('RGBA', (FS, FS), (0, 0, 0, 0))
    for n in ['hornL', 'hornR', 'body', 'arm', 'sclera', 'iris', 'glint', 'crown']:
        r = M['layers'][n]['rect']
        can.alpha_composite(Image.open(os.path.join(out, n + '.webp')).convert('RGBA').resize((r[2], r[3]), Image.LANCZOS), (r[0], r[1]))
    x0, y0, x1, y1 = can.getbbox()
    side = max(x1 - x0, y1 - y0) + 40
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.alpha_composite(can.crop((x0, y0, x1, y1)), ((side - (x1 - x0)) // 2, (side - (y1 - y0)) // 2))
    for px in (720, 1200):
        sq.resize((px, px), Image.LANCZOS).save(os.path.join(dest, 'mascot-%d.webp' % px), 'WEBP', quality=88, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default='rig')
    ap.add_argument('--out', default='rig')
    ap.add_argument('--stills', default='.', help='where mascot-720/1200.webp go')
    o = ap.parse_args()
    M = json.load(open(os.path.join(o.src, 'rig.json')))
    L = {n: load(o.src, n) for n in ['body', 'arm', 'hornL', 'hornR', 'crown', 'sclera', 'iris', 'glint']}

    # horns: one clean shape each, recoloured gold
    for n in ('hornL', 'hornR'):
        im = L[n]
        im[..., 3] = keep_main(im[..., 3])
        goldify(im[..., :3], np.ones(im.shape[:2]))

    # body: kill the ghost outlines and the flat backdrop scraps around the horns, gild the horn stubs
    b = L['body']
    a = b[..., 3]
    solid = nd.binary_opening(a > 60, structure=np.ones((3, 3)), iterations=4)  # thin ring lines vanish, fur mass stays
    h, s, v = hsv(b[..., :3])
    fur = (h > 245) & (h < 292) & (s > .3)  # Monster's fur sits in a tight violet band (~265-280deg)
    flat = nd.uniform_filter(v, 9)
    flat = np.sqrt(np.maximum(nd.uniform_filter(v * v, 9) - flat * flat, 0)) < .025
    eye_y = (M['eye']['center'][1] - M['layers']['body']['rect'][1]) * M['layers']['body']['tex'][1] / M['layers']['body']['rect'][3]
    top = np.arange(a.shape[0])[:, None] < eye_y
    hms = [nd.binary_dilation(layer_to_tex(M, n, 'body', L[n][..., 3]) > 10, iterations=10) for n in ('hornL', 'hornR')]
    hue_violet = (h > 230) & (h < 300)
    # dark flat backdrop left behind the crown and horns: only big patches, so shadowed fur keeps its little dark spots
    bd = nd.binary_closing(top & flat & hue_violet & (v < .5) & (a > 0), iterations=2)
    lab, k = nd.label(bd)
    if k:
        sizes = nd.sum(np.ones_like(a), lab, range(1, k + 1))
        # ...and only patches touching the outside, never shadows inside the head (eye socket, brow)
        out_lab, _ = nd.label(a < 10)
        outside = nd.binary_dilation(out_lab == out_lab[0, 0], iterations=3)
        touch = np.unique(lab[outside & bd])
        big = 1 + np.flatnonzero(sizes > 6000)
        a[np.isin(lab, big[np.isin(big, touch)]) & bd] = 0
    for hm in hms:
        a[hm & ~solid & (s < .35)] = 0  # the pale ghost outline of the horn
        # the horn stubs painted into the body (brown / maroon / magenta, i.e. not fur violet) become gold too
        zone = nd.binary_dilation(hm, iterations=30)
        stub = zone & ~fur & (a > 0) & (s > .35)
        stub = nd.binary_opening(stub, iterations=1)
        stub = nd.binary_fill_holes(nd.binary_closing(stub, iterations=6)) & (a > 0)
        goldify(b[..., :3], nd.gaussian_filter(stub.astype(np.float32), 2.0), ref=stub)
    b[..., 3] = keep_main(a, min_frac=.05)
    paint_eyelid(M, b)

    # arm: main paw only
    L['arm'][..., 3] = keep_main(L['arm'][..., 3], min_frac=.1)

    # crown: keep only pixels inside the gold silhouette (gems are enclosed by gold; fur scraps are not)
    c = L['crown']
    h, s, v = hsv(c[..., :3])
    gold = (c[..., 3] > 60) & (h > 20) & (h < 65) & (s > .35)
    gold = nd.binary_closing(gold, iterations=4)
    sil = nd.binary_dilation(nd.binary_fill_holes(gold), iterations=2)
    c[..., 3] = keep_main(c[..., 3] * nd.gaussian_filter(sil.astype(np.float32), 1.2), min_frac=.1)

    for n in ('body', 'arm', 'hornL', 'hornR', 'crown', 'sclera', 'iris'):
        decontaminate(L[n])
    os.makedirs(o.out, exist_ok=True)
    for n, im in L.items():
        if n != 'glint':  # untouched; keep the original file
            save(o.out, n, im)
    stills(M, o.out, o.stills)


if __name__ == '__main__':
    main()
