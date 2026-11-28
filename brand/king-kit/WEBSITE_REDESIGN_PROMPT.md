# MASTER PROMPT — monsters.win redesign: "The King's Stage"

You are redesigning the **monsters.win** homepage (Monsters Tech Inc. — the brand hub for Sweeps.Monster, MonsterSweeps and MonsterPay). The code is in the GitHub repo this session is connected to. Our mascot has just been upgraded from a flat cartoon to a premium, cute, movie-quality "King" (purple one-eyed monster, gold horns, gold crown with purple gems). The site must now match the new King and our new brand video.

---

## 0. How to work (important)

1. **Inspect first, change nothing yet.** Find the stack (framework, build tool, hosting/deploy config, where the homepage and its styles/assets live). Open https://monsters.win/ and compare with the code.
2. Report back: stack, file map of the homepage, how deploys happen, and a short implementation plan following this prompt. **Wait for me to say "go".**
3. Work on a **new branch** (e.g. `redesign/kings-stage`). Never push to `main`, never trigger a production deploy, never change DNS/hosting settings. Finish with a **pull request** + screenshots (desktop 1440px and mobile 390px).
4. Run the site locally and check it in a browser before you call anything done.

---

## 1. Hard rules (do not break)

- **Content stays the same.** Keep every headline, paragraph, FAQ, link, the four official domains, legal/footer text, support email and the help line (**1-800-MY-RESET**) exactly as they are. This is a **design** change. Do not add new claims, offers, bonuses, odds or promises.
- **21+ only.** The site says 21+; keep it everywhere. Do not change age wording.
- **Safety content stays prominent:** "Is it really us?", "We never ask for your wallet PIN or one-time codes", verification and "If something goes wrong" must remain easy to find — make them *more* visible, not less.
- **Premium, not childish.** The King is cute but this is a 21+ gaming brand: no toy/nursery styling, no kid-targeted visuals. Think "royal show", velvet, spotlight, gold.
- **The mascot must stay on-model:** exactly ONE eye (green), TWO gold horns on the sides of the head, ONE gold crown with purple gems, chubby round purple fur body. Never distort, recolor or AI-regenerate him in code.
- Accessibility: WCAG AA contrast, keyboard focus states, alt text on every King image, `prefers-reduced-motion` turns all motion off.
- Performance: Lighthouse mobile ≥ 85 performance, LCP < 2.5 s. Lazy-load everything below the fold.

---

## 2. Brand assets (all on this PC — copy into the repo, do not hot-link local paths)

**Everything you need is bundled in one folder: `C:\Users\shad0w\Desktop\@mascot_\website_kit\`**
```
website_kit/
  hero/        king_stage_2000.webp, _1600.webp, _1200.webp, _800.webp, king_stage_1600.jpg (fallback)  <- master key art
  king/webp/   <pose>.webp (web size) + <pose>_sm.webp (half size)   <- transparent cutouts, USE THESE on the site
  king/png/    <pose>.png  (lossless originals, don't ship — re-export from these if you need other sizes)
  brand/       logo_monster.png
  fonts/       LuckiestGuy-Regular.ttf, Poppins-*.ttf  (convert to WOFF2 and self-host)
  video/       levelup_MASTER.mp4 (brand video, 61 MB — compress before shipping, modal/link only)
```
Copy `hero/` and `king/webp/` into the repo (e.g. `public/brand/`). The tables below describe each file (original locations listed for reference).

Copy into the repo's public/static folder, e.g. `public/brand/king/`, convert to **WebP/AVIF**, and export responsive sizes (e.g. 480 / 960 / 1600 px). Keep originals out of the repo if they are > 2 MB.

### Hero / key art
| File | What it is |
|---|---|
| `C:\Users\shad0w\Desktop\@mascot_\master_cute.webp` | **MASTER key art** (2000×2000). The King waving on a purple velvet-curtain stage with chandeliers, gold bokeh, spotlight. Use as the hero image / background plate. |
| `C:\Users\shad0w\Desktop\@monster_\levelup_MASTER.mp4` | Brand video "MonsterHQ Is Leveling Up" (18.6 s, 1080×1920, has voice + burned-in captions). Optional: a **muted, captions-free segment** is not available — if you use it, use it only as a "Watch the video" modal/link, not as an autoplay background. |
| `C:\Users\shad0w\Desktop\@Videos_\monster_top4\assets\logo_monster.png` | Current MonsterSweeps logo (check it matches the site's logo; keep the site's existing logo if different). |

### Transparent King cutouts (PNG with alpha, background already removed) — use these for cards, interactive bits, 2.5D
Folder: `C:\Users\shad0w\Desktop\@Videos_\monster_top4\assets\king\`
| File | Pose |
|---|---|
| `turn_front.png` | Turnaround — front, neutral, smiling |
| `turn_3q.png` | Turnaround — three-quarter |
| `turn_side.png` | Turnaround — side (near-profile, facing right) |
| `turn_back.png` | Turnaround — back |
| `pose_wave.png` | Waving hello |
| `pose_cheer.png` | Both arms up, cheering |
| `pose_thumbs_up.png` | Thumbs up |
| `pose_king.png` | Hands on hips, proud king |
| `pose_point_right.png` | Pointing to the right |
| `pose_point_left.png` | Pointing to the left |
| `pose_dance.png`, `pose_dance_2.png` | Happy dance |
| `face_happy.png`, `face_surprised.png`, `face_proud.png`, `face_excited.png` | Head-and-shoulders expressions |
| `face_laugh.png`, `face_playful.png` | High-res (2048 px) head-and-shoulders: laughing / cheeky with tongue out |

Note: the full-body cutouts are ~650–1160 px tall — don't display them larger than their native size on desktop (they'll go soft). `face_laugh`/`face_playful` are 2048 px and can go big.

### Reference only (do not ship)
- Character sheets: `C:\Users\shad0w\Desktop\@mascot_\character_turn.jpg`, `character_pose.jpg`, `character_pose_2.jpg`, `character_expression.png`, `character_side.png`, `character_laughing.png`, `character_playful.png`
- Same images with grey backgrounds (training dataset): `C:\Users\shad0w\Desktop\@mascot_\dataset\`
- If you need another pose cut out from the dataset: `python C:\Users\shad0w\Desktop\@Videos_\monster_top4\tools\cut_king.py <dataset_name_without_ext>` → writes to the `assets\king\` folder.

### Fonts (from our videos — use for display headings only if they fit; keep body text readable)
`C:\Users\shad0w\Desktop\@Videos_\monster_top4\assets\fonts\` → `LuckiestGuy-Regular.ttf` (chunky display, use sparingly), `Poppins-Black/ExtraBold/Bold/Medium.ttf`. Self-host as WOFF2 with `font-display: swap`.

---

## 3. Design system

| Token | Value | Use |
|---|---|---|
| `--royal` | `#6E24D2` | primary purple |
| `--deep` | `#280846` | text strokes, deep panels |
| `--night` | `#12041F` | page background |
| `--gold` | `#FFC846` | accents, buttons, icons |
| `--gold-grad` | `linear-gradient(180deg,#FFF6AA,#E8960F)` | headline text fill, primary buttons |
| `--velvet` | `radial-gradient(ellipse at top,#4A1690 0%,#1B0633 60%,#0C0216 100%)` | section backdrops |
| Glass panel | `rgba(255,255,255,0.05)` + 1px gold border at 25% + 16px blur | cards |

Look & feel: royal purple + gold, velvet curtains, spotlight cones, drifting gold dust, soft bloom. Rounded 24px cards with thin gold borders. Buttons: gold gradient pill with a moving shine on hover. Motion is smooth and slow (ease-out, 400–700 ms), never bouncy-cheap.

---

## 4. Page plan (same sections, new design)

1. **Header** — slim, sticky, glass blur on scroll; logo left, Menu right (keep existing nav items).
2. **Hero — "The Stage"**
   - Background: `master_cute.webp` as a full-bleed stage plate (object-fit: cover; art-direct the crop so the King is never cut on mobile — on mobile put the King below the headline).
   - Headline "One Monster. Three platforms." in gold gradient; sub-lines and the two buttons exactly as today; the three trust chips (21+ only · Four official sites · Play responsibly) as small gold-outline pills.
   - Effects: spotlight cone from the top, slow drifting gold dust (canvas, ≤ 60 particles, pauses when off-screen), gentle mouse/gyro **parallax** (curtains move less than the King).
3. **Meet the King — 2.5D turntable (new, small section)**
   - Use the 4 transparent turnaround cutouts (`turn_front`, `turn_3q`, `turn_side`, `turn_back`, mirror `turn_3q` for the other 3/4 if needed) as a **drag-to-spin / scroll-scrubbed turntable** with quick crossfades + a subtle CSS 3D tilt and a gold floor ring + shadow under him. Caption: keep it purely brand ("Meet the King of MonsterHQ") — no claims.
   - This is our "3D" moment that is guaranteed on-model. See section 5 for optional real 3D.
4. **Our platforms** — three premium gold-trim cards (same text/links), each with a King cutout peeking over the top edge: Sweeps.Monster → `pose_thumbs_up`, MonsterSweeps → `pose_cheer`, MonsterPay → `pose_king`. Hover: card lifts, gold shine sweeps across, King does a tiny 6px hop (off with reduced motion).
5. **Who we are / "Is it really us?" — the Royal Seal**
   - The four official addresses as large gold "seal" badges (monsters.win, sweeps.monster, monsterspay.net, monstersweeps.net).
   - The PIN/OTP warning in a high-contrast callout with a shield icon. `pose_point_left` or `face_proud` beside it.
6. **Verification, in plain words** — a 3-step horizontal timeline (stacks on mobile) using the existing three bullet texts verbatim.
7. **If something goes wrong** — same three steps, numbered gold circles; help-line box stays clearly visible.
8. **FAQ** — accordion restyled (gold chevrons, smooth height animation), same questions/answers.
9. **Footer** — same links and legal text, restyled; small `face_happy` King near the logo.

---

## 5. 3D — two tiers

**Tier 1 (ship this): 2.5D, zero risk.** Turntable from the turnaround cutouts + layered parallax hero + CSS `perspective` tilt on cards. No WebGL needed; works on every phone.

**Tier 2 (optional, only after Tier 1 is done and I approve): real 3D model.**
- Generate a GLB of the King with **Meshy multi-image-to-3D** from `turn_front.png`, `turn_3q.png`, `turn_side.png`, `turn_back.png` (Meshy CLI needs Node.js ≥ 22.12 and a Meshy login; it costs Meshy credits — **ask me before spending**).
- Show it with `<model-viewer>` (auto-rotate, camera-controls, environment lighting, poster = `turn_front.webp`), lazy-loaded, desktop only by default; mobile falls back to the Tier 1 turntable.
- **Quality gate:** fur and the single eye are hard in real-time 3D. Only ship the GLB if it is clearly on-model and cute (one eye, two side horns, one crown, round body). If it looks off, scary or lumpy, keep Tier 1 and tell me — do not ship a bad 3D King.
- Keep GLB ≤ 5 MB (Draco/Meshopt compression, 2K textures max).

---

## 6. Done means

- [ ] All original content/links/legal text present and unchanged (diff the visible text before vs after).
- [ ] 21+ wording intact; help line and "never ask for PIN/OTP" visible without hunting.
- [ ] King appears on-model everywhere; every image has alt text.
- [ ] Desktop 1440 + mobile 390 screenshots attached to the PR; no layout breaks at 768.
- [ ] Reduced motion respected; Lighthouse mobile perf ≥ 85, accessibility ≥ 95.
- [ ] PR open on `redesign/kings-stage` with a short summary + before/after screenshots. Nothing deployed to production.
