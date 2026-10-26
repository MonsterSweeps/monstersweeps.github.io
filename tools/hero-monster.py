"""Export the homepage hero Monster from the official artwork (brand/monster-official.jpg).
The art is used untouched; only its square edges get a soft radial fade so it melts into the page background.
    python3 tools/hero-monster.py      # writes hero-monster-600/900/1400.webp
Needs Pillow and numpy."""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = Image.open(os.path.join(ROOT, 'brand', 'monster-official.jpg')).convert('RGB')
W, H = src.size
ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
cx, cy = W * .5, H * .53                       # centre of the figure (slightly below the middle)
r = np.sqrt(((xs - cx) / (W * .5)) ** 2 + ((ys - cy) / (H * .505)) ** 2)
alpha = np.clip((1.0 - r) / .30, 0, 1) ** 1.4   # fully solid in the middle, fades over the outer ~30%
art = Image.fromarray(np.dstack([np.array(src), (alpha * 255).astype(np.uint8)]), 'RGBA')
for px in (600, 900, 1400):
    art.resize((px, px), Image.LANCZOS).save(os.path.join(ROOT, f'hero-monster-{px}.webp'), 'WEBP', quality=86, method=6)
    print('wrote', f'hero-monster-{px}.webp')
