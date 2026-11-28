/* MonsterSweeps homepage, "The King's Stage".
   - header glass on scroll
   - hero depth: stage glow, spotlight beams, key art and motes move at different depths with the pointer,
     phone tilt and scroll (one rAF loop that sleeps while the hero is off screen)
   - motes: <= 56 gold specks floating in 3D in the spotlight (canvas 2D, perspective-projected)
   - platform cards tilt in 3D under the pointer
   - MonsterSweeps (monstersweeps.net) shows "Opening soon" until products.casino.live is true in site-config.json
   - trust section, state checker, FAQ (one open at a time, smooth height), section reveals
   Reduced motion or data saver: nothing moves on its own. */
(function () {
  'use strict';
  var d = document, $ = function (s) { return d.querySelector(s); }, $$ = function (s) { return [].slice.call(d.querySelectorAll(s)); };
  var SAVE = !!(navigator.connection && navigator.connection.saveData);
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches || SAVE;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var SMALL = matchMedia('(max-width: 860px)').matches;
  var MS = window.MS || { ready: Promise.resolve({}), has: function () { return false; }, get: function () {}, apply: function () {} };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- header ---------- */
  var top = $('#top');
  function onS() { top.classList.toggle('sc', scrollY > 20); }
  addEventListener('scroll', onS, { passive: true }); onS();
  var m = $('#menu'), n = $('#nav');
  if (m && n) {
    m.addEventListener('click', function () { var o = n.classList.toggle('open'); m.setAttribute('aria-expanded', o); });
    n.addEventListener('click', function (e) { if (e.target.tagName === 'A') { n.classList.remove('open'); m.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---------- hero depth ---------- */
  var hero = $('#hero'), tilt = $('#kaTilt'), layers = $$('#stage3d [data-depth]'), cv = $('#motes');
  var ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, heroOn = true, raf = 0;
  if (FINE && !RM) hero.addEventListener('pointermove', function (e) {
    ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; wake();
  });
  if (!FINE && !RM && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null) return;
      ptr.x = clamp(e.gamma / 25, -1, 1); ptr.y = clamp((e.beta - 45) / 25, -1, 1); wake();
    }, { passive: true });
  }

  /* motes: specks of gold dust drifting up through the spotlight */
  var ctx = cv && cv.getContext && cv.getContext('2d'), motes = [], W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2), sprite;
  function makeSprite() {
    sprite = d.createElement('canvas'); sprite.width = sprite.height = 64;
    var g = sprite.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,250,215,1)'); r.addColorStop(.25, 'rgba(255,214,110,.75)'); r.addColorStop(1, 'rgba(255,190,60,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }
  function seed(m, fresh) {
    m.x = (Math.random() - .5) * 2.2; m.z = Math.random() * 2 + .4;
    m.y = fresh ? (Math.random() - .5) * 2.4 : 1.3;
    m.vy = -(.02 + Math.random() * .05); m.ph = Math.random() * 6.28; m.s = .6 + Math.random() * 1.2;
  }
  function size() {
    if (!ctx) return;
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  if (ctx) {
    makeSprite(); size(); addEventListener('resize', size);
    for (var i = 0, N = SMALL ? 28 : 56; i < N; i++) { var mo = {}; seed(mo, true); motes.push(mo); }
  }
  function drawMotes(dt, t) {
    ctx.clearRect(0, 0, W, H);
    // the beam's centre sits over the King: right of centre on desktop, centred on phones
    var cx = W * (SMALL ? .5 : .64), cy = H * .5, F = Math.min(W, H) * .9;
    for (var i = 0; i < motes.length; i++) {
      var p = motes[i];
      p.y += p.vy * dt; p.x += Math.sin(t * .0004 + p.ph) * .0009 * dt * 60 / 60;
      if (p.y < -1.3) seed(p, false);
      var k = F / (p.z + 1), sx = cx + (p.x - cur.x * .12 * p.z) * k, sy = cy + (p.y - cur.y * .08 * p.z) * k * .9;
      var r = p.s * k * .0045 + .35, a = clamp(1.25 - p.z * .4, .15, 1) * (.55 + .45 * Math.sin(t * .002 + p.ph));
      ctx.globalAlpha = a; ctx.drawImage(sprite, sx - r * 4, sy - r * 4, r * 8, r * 8);
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, still = 0;
  function frame(t) {
    raf = 0;
    var dt = last ? Math.min((t - last) / 1000, .05) : .016; last = t;
    cur.x += (ptr.x - cur.x) * .06; cur.y += (ptr.y - cur.y) * .06;
    var sy = Math.min(scrollY, innerHeight), sp = sy / innerHeight;
    for (var i = 0; i < layers.length; i++) {
      var dep = +layers[i].dataset.depth;
      layers[i].style.transform = 'translate3d(' + (-cur.x * dep * .35).toFixed(2) + 'px,' + (-cur.y * dep * .25 + sy * dep * -.004 * 60 / 60).toFixed(2) + 'px,0)';
    }
    if (tilt) {
      tilt.style.transform = 'translate3d(0,' + (sy * .18).toFixed(1) + 'px,0) rotateY(' + (cur.x * 7).toFixed(2) + 'deg) rotateX(' + (-cur.y * 5 + sp * 10).toFixed(2) + 'deg) scale(' + (1 - sp * .06).toFixed(3) + ')';
      tilt.style.setProperty('--gx', (50 + cur.x * 22).toFixed(1) + '%'); tilt.style.setProperty('--gy', (30 + cur.y * 16).toFixed(1) + '%');
    }
    if (ctx) drawMotes(dt, t);
    var moving = Math.abs(ptr.x - cur.x) + Math.abs(ptr.y - cur.y) > .002;
    still = moving ? 0 : still + 1;
    if (heroOn && !d.hidden && (ctx || still < 30)) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && !RM && heroOn) { last = 0; raf = requestAnimationFrame(frame); } }
  if (!RM) {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; if (heroOn) wake(); }).observe(hero);
    addEventListener('scroll', wake, { passive: true });
    d.addEventListener('visibilitychange', function () { if (!d.hidden) wake(); });
    wake();
  } else if (ctx) {
    drawMotes(0, 0);
  }

  /* ---------- 3D tilt cards ---------- */
  if (FINE && !RM) $$('[data-tilt]').forEach(function (c) {
    var inner = c.querySelector('.door-in'), r;
    c.addEventListener('pointerenter', function () { r = inner.getBoundingClientRect(); c.classList.add('live-tilt'); });
    c.addEventListener('pointermove', function (e) {
      if (!r) r = inner.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      inner.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); inner.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
    });
    c.addEventListener('pointerleave', function () { r = null; c.classList.remove('live-tilt'); inner.style.setProperty('--ry', '0deg'); inner.style.setProperty('--rx', '0deg'); });
  });

  /* ---------- config-driven bits ---------- */
  MS.ready.then(function () {
    // MonsterSweeps opens when products.casino.live is true
    $$('[data-launch]').forEach(function (card) {
      if (MS.get('products.' + card.dataset.launch + '.live') !== true) return;
      var st = card.querySelector('[data-launch-status]'), w = card.querySelector('[data-launch-wait]'), a = card.querySelector('[data-launch-link]');
      if (st) { st.textContent = 'Live now'; st.className = 'status live'; }
      if (w) w.remove(); if (a) a.hidden = false;
    });
    var rv = $('#revLink'), ru = MS.get('reviewsUrl');
    if (rv && /^https:\/\//i.test(ru || '')) rv.href = ru; else if (rv) rv.closest('.reviews').hidden = true;
    var dm = MS.get('officialDomains'), dl = $('#doms');
    if (dl && Array.isArray(dm) && dm.length) {
      var role = { 'monsters.win': 'Main site', 'sweeps.monster': 'Game platforms', 'monsterpay.net': 'Payments', 'monstersweeps.net': 'Casino and predictions' };
      dl.innerHTML = dm.map(function (x) { return '<li><b>' + esc(x) + '</b><span>' + esc(role[x] || '') + '</span></li>'; }).join('');
    }
    // state checker: needs at least one product with a state list
    var av = {}, names = { sweepsmonster: 'Sweeps.Monster', casino: 'Casino and predictions', monsterpay: 'MonsterPay' }, all = {}, box = $('#statecheck');
    Object.keys(names).forEach(function (k) { var a = MS.get('availability.' + k); if (Array.isArray(a) && a.length) { av[k] = a; a.forEach(function (st) { all[st] = 1; }); } });
    if (box && Object.keys(all).length) {
      var sel = $('#stSel'), res = $('#stRes');
      var US = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
      sel.insertAdjacentHTML('beforeend', US.map(function (x) { return '<option>' + x + '</option>'; }).join(''));
      sel.addEventListener('change', function () {
        var st = sel.value; if (!st) { res.innerHTML = ''; return; }
        res.innerHTML = Object.keys(av).map(function (k) { var ok = av[k].indexOf(st) > -1; return '<li class="' + (ok ? 'y' : 'n') + '">' + names[k] + ': ' + (ok ? 'available' : 'not available') + ' in ' + esc(st) + '</li>'; }).join('');
      });
      box.hidden = false;
    }
  });

  /* ---------- reveals: blocks rise in from a slight 3D tilt ---------- */
  if ('IntersectionObserver' in window && !RM) {
    var els = $$('.sec-head,.door,.seal-row,.tgrid>.tcard,.wrong,.faq-side,.faq-in>.col').filter(function (e) { return e.getBoundingClientRect().top > innerHeight; });
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('rv-in'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e, i) { e.classList.add('rv'); if (e.classList.contains('door')) e.style.transitionDelay = (i % 3) * 90 + 'ms'; ro.observe(e); });
  }

  /* ---------- FAQ: one open at a time, smooth height ---------- */
  var faqs = $$('#faqList details');
  function setOpen(x, open) {
    if (x.open === open) return;
    if (RM || !x.animate) { x.open = open; return; }
    var s = x.querySelector('summary'), h0 = x.offsetHeight;
    if (open) x.open = true;
    var h1 = open ? x.offsetHeight : s.offsetHeight;
    x.style.overflow = 'hidden';
    var an = x.animate({ height: [h0 + 'px', h1 + 'px'] }, { duration: 450, easing: 'cubic-bezier(.22,.8,.24,1)' });
    an.onfinish = an.oncancel = function () { x.style.overflow = ''; if (!open) x.open = false; };
  }
  faqs.forEach(function (x) {
    x.querySelector('summary').addEventListener('click', function (e) {
      e.preventDefault();
      var willOpen = !x.open;
      if (willOpen) faqs.forEach(function (o) { if (o !== x) setOpen(o, false); });
      setOpen(x, willOpen);
    });
  });

  var y = $('#yr'); if (y) y.textContent = new Date().getFullYear();
})();
