/* MonsterSweeps demo Fortune Wheel (3D, needs js/engine.js). */
(function () {
  'use strict';
  var X = window.MSE; if (!X) return;
  var Engine = X.Engine, cyl = X.cyl, torus = X.torus, disc = X.disc, sphere = X.sphere, hex = X.hex, srgb = X.srgb,
      lerp = X.lerp, clamp = X.clamp, MAT = X.MAT, coinTexture = X.coinTexture, RM = X.RM, COARSE = X.COARSE;
  /* ---------------- Fortune Wheel ---------------- */
  var SEG = [['+25 XP', '#ffc23d', '#3a1d00'], ['Free play', '#6d33e6', '#fff'], ['+50 XP', '#ffd76e', '#3a1d00'], ['Voucher', '#4a1fb8', '#fff'],
             ['+10 XP', '#ffc23d', '#3a1d00'], ['Free play', '#6d33e6', '#fff'], ['+100 XP', '#ffd76e', '#3a1d00'], ['Voucher', '#4a1fb8', '#fff']];
  function wheelTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 1024; var g = c.getContext('2d'), R = 512, n = SEG.length;
    for (var i = 0; i < n; i++) {
      var a0 = (i / n) * Math.PI * 2 - Math.PI / 2 - Math.PI / n, a1 = a0 + Math.PI * 2 / n;
      var gr = g.createRadialGradient(R, R, 60, R, R, R); gr.addColorStop(0, SEG[i][1]); gr.addColorStop(1, shade(SEG[i][1], -.25));
      g.fillStyle = gr; g.beginPath(); g.moveTo(R, R); g.arc(R, R, R, a0, a1); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(20,6,40,.55)'; g.lineWidth = 6; g.stroke();
      g.save(); g.translate(R, R); g.rotate((a0 + a1) / 2); g.fillStyle = SEG[i][2];
      g.font = 'bold 62px Adventor, "Arial Black", sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(SEG[i][0], R - 70, 4); g.restore();
    }
    var ig = g.createRadialGradient(R, R, 0, R, R, R); ig.addColorStop(.0, 'rgba(255,255,255,.18)'); ig.addColorStop(.45, 'rgba(255,255,255,0)'); ig.addColorStop(1, 'rgba(0,0,0,.25)');
    g.fillStyle = ig; g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.fill();
    return c;
  }
  function shade(h, a) { var c = hex(h).map(function (v) { return Math.round(clamp(v + a, 0, 1) * 255); }); return 'rgb(' + c.join(',') + ')'; }

  function initWheel() {
    var cv = document.getElementById('wheel3d'); if (!cv) return;
    var E; try { E = new Engine(cv, { fov: .5, eye: [0, .55, 8.4], target: [0, .05, 0], dpr: COARSE ? 1.5 : 2 }); } catch (e) { return; }
    var tilt = E.group(null, [0, 0, 0], [-.22, 0, 0]), spin = E.group(tilt);
    var tex = E.texture(wheelTexture());
    E.add(E.mesh(disc(1.62, 96)), { col: [1, 1, 1], rough: .45, tex: tex }, spin, [0, 0, .07]);
    E.add(E.mesh(cyl(1.7, 1.7, .16, 96, false)), { col: srgb('#2a1160'), rough: .5 }, spin, [0, 0, 0], [Math.PI/2, 0, 0]);
    E.add(E.mesh(torus(1.68, .1, 18, 120)), MAT.gold, tilt, [0, 0, .06], [Math.PI/2, 0, 0]);
    var pegG = E.mesh(cyl(.035, .035, .16, 12, true));
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 + Math.PI / 8; E.add(pegG, MAT.gold, spin, [Math.cos(a) * 1.5, Math.sin(a) * 1.5, .14], [Math.PI/2, 0, 0]); }
    var bulbs = [], bG = E.mesh(sphere(.055, 14, 10));
    for (var j = 0; j < 24; j++) { var b = j / 24 * Math.PI * 2, m = { col: srgb('#fff1c2'), rough: .1, emit: .2 }; E.add(bG, m, tilt, [Math.cos(b) * 1.68, Math.sin(b) * 1.68, .17]); bulbs.push(m); }
    // hub = a gold crown coin
    var hub = E.group(tilt, [0, 0, .12]);
    E.add(E.mesh(cyl(.34, .38, .1, 48, true)), MAT.gold, hub, [0, 0, 0], [Math.PI/2, 0, 0]);
    E.add(E.mesh(disc(.33, 48)), { col: [1, 1, 1], rough: .3, metal: .4, emit: .16, tex: E.texture(coinTexture()) }, hub, [0, 0, .056]);
    // pointer
    var ptr = E.group(tilt, [0, 1.82, .22]);
    E.add(E.mesh(cyl(0, .17, .38, 4, true)), { col: srgb('#ff3b6b'), rough: .25, emit: .1 }, ptr, [0, -.05, 0], [Math.PI, Math.PI/4, 0], [1, 1, .5]);
    E.add(E.mesh(sphere(.12, 20, 14)), MAT.gold, ptr, [0, .17, 0]);
    var P = E.points(90), sp = []; P.count = 0;

    var btn = document.getElementById('spinBtn'), out = document.getElementById('spinOut');
    var ang = 0, from = 0, to = 0, t0 = 0, dur = 4600, busy = false, tick = 0, lastPeg = 0, mx = 0, my = 0, vis = true;
    cv.parentNode.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); my = clamp(-((e.clientY - r.top) / r.height * 2 - 1), -1, 1); });
    function go() {
      if (busy) return; busy = true; btn.disabled = true; out.textContent = 'Spinning…';
      var k = Math.floor(Math.random() * SEG.length), cur = ((ang % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
      var target = k * (Math.PI * 2 / SEG.length); // segment k sits at the top when spin angle == k*step
      from = ang; to = ang + (Math.PI * 2) * (RM ? 1 : 6) + ((target - cur) + Math.PI*2) % (Math.PI*2) + (Math.random() - .5) * .35;
      t0 = performance.now(); dur = RM ? 10 : 4600; spin.k = k;
    }
    btn && btn.addEventListener('click', go); cv.addEventListener('click', go);
    var running = true, last = performance.now();
    function frame(now) {
      if (!running) return;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (busy) {
        var t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 4); ang = lerp(from, to, e);
        var peg = Math.floor((ang + Math.PI / 8) / (Math.PI / 4)); if (peg !== lastPeg) { lastPeg = peg; tick = 1; }
        if (t >= 1) {
          busy = false; btn.disabled = false; var s = SEG[spin.k][0];
          out.textContent = 'Demo result: ' + s + '. Claim your real daily spin after you sign up.';
          sp = []; for (var q = 0; q < P.max; q++) { var a2 = Math.random() * Math.PI * 2, v = .02 + Math.random() * .05; sp.push({ x: 0, y: 1.6, z: .5, vx: Math.cos(a2) * v, vy: Math.sin(a2) * v + .03, life: 0, c: Math.random() < .6 ? [1, .75, .25] : [.75, .5, 1] }); }
        }
      }
      tick = Math.max(0, tick - dt * 6);
      spin.r = [0, 0, ang];
      ptr.r = [0, 0, Math.sin(tick * Math.PI) * -.35];
      tilt.r = [-.22 - my * .08, mx * .18, 0];
      var tt = now / 1000; bulbs.forEach(function (m, i) { var on = busy ? ((i + Math.floor(tt * 14)) % 3 === 0) : (Math.sin(tt * 2 + i * .7) > .2); m.emit = on ? 2.4 : .25; });
      P.count = sp.length;
      for (var i = 0; i < sp.length; i++) { var s2 = sp[i]; s2.life += dt; s2.vy -= .0018; s2.x += s2.vx; s2.y += s2.vy; P.pos[i*3] = s2.x; P.pos[i*3+1] = s2.y; P.pos[i*3+2] = s2.z; P.size[i] = .14 * Math.max(0, 1 - s2.life / 1.8); P.col[i*3] = s2.c[0]; P.col[i*3+1] = s2.c[1]; P.col[i*3+2] = s2.c[2]; }
      if (sp.length && sp[0].life > 1.8) sp = [];
      E.render(P);
      if (vis || busy) requestAnimationFrame(frame); else running = false;
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }).observe(cv);
    requestAnimationFrame(frame);
    window.__wheel = { go: go };
  }

  function boot() { initWheel(); }
  if (document.fonts && document.fonts.load) Promise.race([document.fonts.load('bold 40px Adventor'), new Promise(function (r) { setTimeout(r, 1200); })]).then(boot, boot);
  else boot();
})();
