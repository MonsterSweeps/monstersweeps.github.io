/* MonsterSweeps welcome popup. Everything comes from popup{} in /data/site-config.json.
   Shows once per visitor after 6 seconds or 40% scroll, whichever comes first; a dismissal is remembered for
   7 days. Never on legal or responsible-gaming pages, never when popup.enabled is false, and never when either
   banner image is missing or fails to load. Close with the X, Esc or a click on the backdrop; focus stays inside
   while it is open. Styles: .wp-* in /css/tokens.css. */
(function () {
  'use strict';
  var d = document, KEY = 'ms_welcome_dismissed', DAYS = 7;
  if (/^\/(terms|sweepstakes-rules|privacy-policy|responsible-gaming)(\.html)?\/?$/.test(location.pathname)) return;
  if (!window.MS) return;
  function dismissed() { try { var t = +localStorage.getItem(KEY); return t && Date.now() - t < DAYS * 864e5; } catch (e) { return false; } }
  function remember() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  function local(u) { u = String(u || ''); return /^\/[^\/]/.test(u) || /^https:\/\//i.test(u) ? u : ''; }
  function attr(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  MS.ready.then(function (cfg) {
    var p = cfg && cfg.popup;
    if (!p || p.enabled !== true || dismissed()) return;
    if (!MS.has('popup.desktopImage') || !MS.has('popup.mobileImage') || !MS.has('popup.ctaText') || !MS.has('popup.alt')) return;
    var desk = local(p.desktopImage), mob = local(p.mobileImage); if (!desk || !mob) return;
    // both banners must really load before anything is scheduled
    var okN = 0, failed = false;
    [desk, mob].forEach(function (src) { var i = new Image(); i.onload = function () { if (++okN === 2 && !failed) arm(); }; i.onerror = function () { failed = true; }; i.src = src; });

    function arm() {
      var shown = false, timer = setTimeout(show, 6000);
      function onScroll() { var h = d.documentElement.scrollHeight - innerHeight; if (h > 0 && scrollY / h >= .4) show(); }
      addEventListener('scroll', onScroll, { passive: true });
      function show() {
        if (shown || dismissed()) return; shown = true; clearTimeout(timer); removeEventListener('scroll', onScroll);
        if (d.documentElement.classList.contains('ms-lock')) return;   // the menu is open: do not stack dialogs
        open();
      }
    }
    function open() {
      var el = d.createElement('div'); el.className = 'wp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', p.alt);
      el.innerHTML = '<div class="wp-scrim" data-close></div><div class="wp-card">' +
        '<button class="wp-x" type="button" data-close aria-label="Close">&times;</button>' +
        '<picture><source media="(max-width: 640px)" srcset="' + attr(mob) + '"><img class="wp-img" src="' + attr(desk) + '" alt="' + attr(p.alt) + '"></picture>' +
        '<div class="wp-foot"><a class="wp-cta" href="' + attr(MS.cta(p.ctaUrl, 'welcome_popup')) + '" data-utm="1">' + attr(p.ctaText) + '</a>' +
        '<p class="wp-legal">21+ only. No purchase necessary. <a href="/sweepstakes-rules.html">Terms apply</a>.</p></div></div>';
      var last = d.activeElement; d.body.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('on'); });
      d.documentElement.classList.add('wp-lock');
      function f() { return [].slice.call(el.querySelectorAll('a[href],button')); }
      el.querySelector('.wp-cta').focus({ preventScroll: true });
      function close() {
        remember(); el.classList.remove('on'); d.documentElement.classList.remove('wp-lock'); d.removeEventListener('keydown', key, true);
        setTimeout(function () { el.remove(); }, 220); if (last && last.focus) last.focus({ preventScroll: true });
      }
      function key(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'Tab') { var a = f(), first = a[0], end = a[a.length - 1];
          if (!el.contains(d.activeElement)) { e.preventDefault(); first.focus(); }
          else if (e.shiftKey && d.activeElement === first) { e.preventDefault(); end.focus(); }
          else if (!e.shiftKey && d.activeElement === end) { e.preventDefault(); first.focus(); } }
      }
      d.addEventListener('keydown', key, true);
      el.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); else if (e.target.closest('.wp-cta')) remember(); });
    }
  });
})();
