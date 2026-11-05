/* MonsterSweeps homepage "Royal Lair": one transparent 3D layer between the gold-dust nebula and the page.
   Each station is pinned to a section of the page and read from the DOM every frame, so the 3D always lines up
   with the content at any screen size; deeper objects drift a little slower than the page (parallax).
     hero     slow ring of crown coins and violet gems behind Monster
     how      three floating icons (ID badge, wheel, wallet) that rise in with the three steps
     rewards  five gem-coloured pillars standing exactly behind the tier buttons; the chosen tier glows
     redeem   a gentle stream of coins dropping into a wallet
     join     two crown coins turning beside the closing headline
   Needs js/engine.js. Phones: fewer objects and 30fps. A struggling device drops resolution, then switches to a
   still scene that only redraws on scroll. Reduced motion or data saver: still scene. No WebGL: nothing is drawn
   and the page keeps its normal look (html.lair3d is only set once the scene runs). */
(function () {
  'use strict';
  function init() {
    var X = window.MSE; if (!X) return;
    var d = document, PI = Math.PI;
    var SAVE = !!(navigator.connection && navigator.connection.saveData);
    var STILL = matchMedia('(prefers-reduced-motion: reduce)').matches || SAVE;
    var SMALL = matchMedia('(max-width: 860px), (pointer: coarse)').matches;
    var cv = d.createElement('canvas');
    cv.id = 'lair3d'; cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
    d.body.appendChild(cv);   // after the nebula canvas, so it paints above it
    var E;
    try { E = new X.Engine(cv, { fov: .5, eye: [0, 0, 10], target: [0, 0, 0], dpr: SMALL ? 1.25 : 1.6 }); }
    catch (e) { cv.remove(); return; }
    d.documentElement.classList.add('lair3d');

    /* ---------- shared meshes and materials ---------- */
    var srgb = X.srgb, coinTex = E.texture(X.coinTexture());
    var M = {
      coin: { col: srgb('#ffc23d'), rough: .3, metal: .4, emit: .16, tex: coinTex },
      edge: { col: srgb('#e8a92a'), rough: .3, metal: .6, emit: .1 },
      gold: { col: srgb('#ffc23d'), rough: .25, metal: .8, emit: .08 },
      gem:  { col: srgb('#8b5cf6'), rough: .08, metal: .25, emit: .38, sheen: .3, sheenCol: [.8, .6, 1] },
      royal:{ col: srgb('#3a1a86'), rough: .45, metal: .2, emit: .06, rim: [.45, .3, .9] },
      white:{ col: srgb('#fff6e0'), rough: .2, emit: .5 }
    };
    var G = {
      rim: E.mesh(X.cyl(.19, .19, .045, 40, false)), face: E.mesh(X.disc(.19, 40)),
      gem: E.mesh(X.sphere(.13, 4, 2)),                 // 4 x 2 sphere = octahedron
      hex: E.mesh(X.cyl(.5, .5, 1, 6, true)),
      box: E.mesh(X.box(1, 1, 1)),
      ring: E.mesh(X.torus(.22, .035, 12, 48)),
      dot: E.mesh(X.disc(.5, 28))
    };
    function coin(parent) {
      var g = E.group(parent);
      E.add(G.rim, M.edge, g, [0, 0, 0], [PI / 2, 0, 0]);
      E.add(G.face, M.coin, g, [0, 0, .023]); E.add(G.face, M.coin, g, [0, 0, -.023], [0, PI, 0]);
      return g;
    }

    /* ---------- page px -> world (camera fixed at z=10 looking at the origin) ---------- */
    var W = innerWidth, H = innerHeight, TAN = Math.tan(.25);
    function hh(z) { return (10 - z) * TAN; }
    function toWorld(px, py, z) { var h = hh(z); return [(px / W * 2 - 1) * h * (W / H), -(py / H * 2 - 1) * h, z]; }
    function pxk(z) { return 2 * hh(z) / H; }        // world units per CSS px at depth z
    function $(s) { return d.querySelector(s); }
    function $$(s) { return [].slice.call(d.querySelectorAll(s)); }
    function near(r) { return r.bottom > -H * .3 && r.top < H * 1.3; }
    function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
    function inview(r) { return ease((H - r.top) / (H * .55)); }   // 0 below the fold -> 1 once well in view

    var stations = [];

    /* hero: ring of coins and gems orbiting behind Monster */
    (function () {
      var el = $('.hero .mascot'); if (!el) return;
      var root = E.group(null), items = [], n = SMALL ? 7 : 11;
      for (var i = 0; i < n; i++) {
        var gem = i % 3 === 2, it = gem ? E.add(G.gem, M.gem, root) : coin(root);
        it.a0 = i / n * PI * 2; it.sp = .6 + (i % 4) * .15; it.gem = gem; items.push(it);
      }
      stations.push({ root: root, step: function (t) {
        var r = el.getBoundingClientRect(); if (!near(r)) return false;
        var z = -2, k = pxk(z), c = toWorld(r.left + r.width / 2, r.top + r.height * .53, z);
        var rx = r.width * .52 * k, ry = r.height * .2 * k;
        root.p = [c[0], c[1], 0];
        items.forEach(function (it) {
          var a = it.a0 + t * .16;
          it.p = [Math.cos(a) * rx, Math.sin(a) * ry + Math.sin(a * 2 + it.a0) * .08, z + Math.sin(a) * 1.4];
          var s = it.gem ? 1.1 : 1.25; it.s = [s, s, s];
          it.r = it.gem ? [0, t * it.sp, .3] : [.25, t * it.sp, 0];
        });
        return true;
      } });
    })();

    /* how it works: an icon floats in above each step card */
    (function () {
      var cards = $$('#how .steps li'); if (cards.length < 3) return;
      var icons = [];
      // 1 ID badge
      var a = E.group(null);
      E.add(G.box, M.royal, a, [0, 0, 0], [0, 0, 0], [.62, .42, .06]);
      E.add(G.dot, M.gold, a, [-.14, .02, .035], [0, 0, 0], [.2, .2, 1]);
      E.add(G.box, M.gold, a, [.12, .07, .035], [0, 0, 0], [.2, .035, .01]);
      E.add(G.box, M.gold, a, [.12, -.02, .035], [0, 0, 0], [.16, .03, .01]);
      E.add(G.box, M.gold, a, [.12, -.1, .035], [0, 0, 0], [.2, .03, .01]);
      icons.push(a);
      // 2 Fortune Wheel
      var b = E.group(null);
      E.add(G.ring, M.gold, b, [0, 0, 0], [PI / 2, 0, 0], [1.25, 1.25, 1.25]);
      E.add(G.face, M.coin, b, [0, 0, 0], [0, 0, 0], [1.25, 1.25, 1.25]);
      E.add(G.gem, M.gem, b, [0, .37, .03], [0, 0, PI / 4], [.45, .7, .45]);
      icons.push(b);
      // 3 wallet with a coin peeking out
      var w = E.group(null);
      coin(w).p = [.08, .2, -.02];
      E.add(G.box, M.royal, w, [0, 0, 0], [0, 0, 0], [.64, .42, .16]);
      E.add(G.box, M.gold, w, [.24, 0, .09], [0, 0, 0], [.14, .12, .02]);
      icons.push(w);
      var root = E.group(null); icons.forEach(function (g) { g.parent = root; });
      stations.push({ root: root, step: function (t) {
        var sec = $('#how').getBoundingClientRect(); if (!near(sec)) return false;
        cards.forEach(function (li, i) {
          var r = li.getBoundingClientRect(), p = inview(r), z = -.6, k = pxk(z);
          var c = toWorld(r.right - Math.min(64, r.width * .16), r.top - (SMALL ? 30 : 40), z);
          var g = icons[i], s = (SMALL ? .62 : .82) * (.65 + .35 * p);
          g.p = [c[0], c[1] - (1 - p) * 90 * k + Math.sin(t * .9 + i * 2) * .03, z];
          g.s = [s, s, s];
          g.r = [-.18 + Math.sin(t * .5 + i) * .05, -.35 + Math.sin(t * .4 + i) * .25, Math.sin(t * .7 + i) * .04];
        });
        return true;
      } });
    })();

    /* rewards: gem pillars standing exactly behind the tier buttons (the buttons stay the real, tappable controls) */
    (function () {
      var stairs = $$('#rewards .stair'); if (!stairs.length) return;
      var root = E.group(null), cols = [];
      stairs.forEach(function (b) {
        var c = (b.style.getPropertyValue('--c') || '#ffc23d').trim();
        var mat = { col: srgb(c), rough: .18, metal: .55, emit: .1, sheen: .25, sheenCol: X.hex(c), rim: X.hex(c).map(function (v) { return v * .5; }) };
        var g = E.group(root), body = E.add(G.hex, mat, g), top = E.add(G.gem, { col: srgb(c), rough: .05, metal: .3, emit: .6 }, g);
        cols.push({ btn: b, g: g, body: body, top: top, mat: mat });
      });
      stations.push({ root: root, step: function (t) {
        var sec = $('#rewards').getBoundingClientRect(); if (!near(sec)) return false;
        var grow = ease((H - sec.top) / (H * .7));
        cols.forEach(function (o, i) {
          var r = o.btn.getBoundingClientRect(), z = -.25, k = pxk(z);
          var w = r.width * k * .78, h = Math.max(.02, r.height * k * (.25 + .75 * grow)), base = toWorld(r.left + r.width / 2, r.bottom, z);
          var on = o.btn.getAttribute('aria-pressed') === 'true';
          o.g.p = [base[0], base[1] + h / 2, z]; o.g.r = [.12, .5 + Math.sin(t * .3) * .08, 0];
          o.body.s = [w, h, w * .9];
          o.mat.emit = on ? .42 + Math.sin(t * 2.4) * .08 : .1;
          o.top.visible = on;
          var gs = w * 1.6; o.top.p = [0, h / 2 + gs * .22 + Math.sin(t * 1.6) * .03, 0]; o.top.s = [gs, gs * 1.4, gs]; o.top.r = [0, t * 1.2, 0];
        });
        return true;
      } });
    })();

    /* MonsterPay: a few coins drift down into a wallet at the side of the section */
    (function () {
      var sec = $('#redeem'), copy = $('#redeem .col.two > div'); if (!sec || !copy || SMALL) return;   // phones: no free space beside the text
      var root = E.group(null), wal = E.group(root), drops = [];
      E.add(G.box, M.royal, wal, [0, 0, 0], [0, 0, 0], [1.1, .72, .24]);
      E.add(G.box, M.gold, wal, [0, .3, .125], [0, 0, 0], [1.1, .06, .01]);
      E.add(G.box, M.gold, wal, [.42, 0, .13], [0, 0, 0], [.22, .18, .02]);
      for (var i = 0; i < 5; i++) { var c = coin(root); c.ph = i / 5; drops.push(c); }
      stations.push({ root: root, step: function (t) {
        var r = sec.getBoundingClientRect(); if (!near(r)) return false;
        var cr = copy.getBoundingClientRect(), z = -1.2, k = pxk(z);
        var c = toWorld(cr.left + cr.width * .32, cr.bottom + 135, z), fall = 80 * k;
        wal.p = [c[0], c[1], z]; wal.r = [.15, -.45 + Math.sin(t * .4) * .1, 0]; var ws = .8; wal.s = [ws, ws, ws];
        drops.forEach(function (o) {
          var f = (t * .11 + o.ph) % 1;
          o.p = [c[0] + Math.sin(o.ph * 9) * .25 * ws, c[1] + .25 * ws + (1 - f) * fall, z + .02];
          var s = .9 * ws * Math.min(1, (1 - f) * 6); o.s = [s, s, s];
          o.r = [t * 1.3 + o.ph * 5, t * .8, 0];
        });
        return true;
      } });
    })();

    /* closing call to action: two crown coins turning beside the headline */
    (function () {
      var h = $('#join h2'); if (!h) return;
      var root = E.group(null), a = coin(root), b = coin(root);
      stations.push({ root: root, step: function (t) {
        var r = h.getBoundingClientRect(); if (!near(r)) return false;
        var z = -1.4, k = pxk(z), s = SMALL ? 1.35 : 2.6, off = SMALL ? 0 : r.width / 2 + 90;
        if (SMALL) {
          var c = toWorld(W / 2, r.top - 62, z); a.p = c; a.s = [s, s, s]; a.r = [.15, t * .5, 0]; b.visible = false;
        } else {
          a.p = toWorld(r.left + r.width / 2 - off, r.top + r.height / 2, z); b.p = toWorld(r.left + r.width / 2 + off, r.top + r.height / 2, z);
          a.s = b.s = [s, s, s]; a.r = [.15, t * .5, .1]; b.r = [.15, -t * .5 + 1.2, -.1]; b.visible = true;
        }
        return true;
      } });
    })();

    if (!stations.length) { cv.remove(); d.documentElement.classList.remove('lair3d'); return; }

    /* ---------- pointer / tilt: everything leans a touch ---------- */
    var lx = 0, ly = 0, tx = 0, ty = 0;
    if (!STILL) {
      addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { tx = e.clientX / W * 2 - 1; ty = e.clientY / H * 2 - 1; } }, { passive: true });
      // phone tilt only where the browser does not ask for permission (iPhones do, so they simply skip this)
      if (SMALL && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
        addEventListener('deviceorientation', function (e) {
          if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
        }, { passive: true });
      }
    }

    /* ---------- loop ---------- */
    var t0 = performance.now(), frozenT = 4.2, running = false, last = 0, step = SMALL ? 1000 / 30 : 0, live = !STILL, wasEmpty = false;
    function draw(now) {
      W = innerWidth; H = innerHeight;
      var t = live ? (now - t0) / 1000 : frozenT, any = false;
      lx += (tx - lx) * .06; ly += (ty - ly) * .06;
      stations.forEach(function (s) {
        var on = s.step(t); s.root.visible = !!on; if (on) { any = true; s.root.r = [ly * .05, lx * .08, 0]; }
      });
      if (any || !wasEmpty) E.render();   // one last clear when everything has scrolled away, then idle
      wasEmpty = !any;
    }
    /* quality guard, as in the nebula: half resolution first, then a still scene */
    var lvl = 0, sN = 0, sT = 0, slow = SMALL ? 42 : 25, dpr0 = E.dprMax;
    function guard(now) {
      if (lvl > 1) return;
      if (!sT) { sT = now; sN = 0; return; }
      sN++; if (now - sT < 2000) return;
      var avg = (now - sT) / sN; sT = 0;
      if (avg <= slow) { lvl = 2; return; }
      if (lvl === 0) { lvl = 1; E.dprMax = dpr0 * .6; }
      else { lvl = 3; live = false; running = false; frozenT = (now - t0) / 1000; draw(now); }
    }
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (step && now - last < step) return;
      last = now; draw(now); guard(now);
    }
    function start() { if (!live || running || d.hidden) return; running = true; requestAnimationFrame(frame); }
    // still mode keeps the 3D lined up with the page by redrawing on scroll and resize only
    var queued = false;
    function redraw() { if (live || queued) return; queued = true; requestAnimationFrame(function (n) { queued = false; draw(n); }); }
    addEventListener('scroll', redraw, { passive: true }); addEventListener('resize', redraw, { passive: true });
    d.addEventListener('click', function () { setTimeout(redraw, 30); }, true);   // a tier tap changes which pillar glows
    d.addEventListener('visibilitychange', function () { sT = 0; if (d.hidden) running = false; else start(); });
    if (live) start(); else draw(performance.now());
    window.__lair3d = { get running() { return running; }, get level() { return lvl; }, draw: function () { draw(performance.now()); } };
  }
  function boot() { if (window.requestIdleCallback) requestIdleCallback(init, { timeout: 1500 }); else setTimeout(init, 300); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
