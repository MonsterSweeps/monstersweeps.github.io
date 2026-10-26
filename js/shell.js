/* MonsterSweeps mobile shell, shared by every page.
   On phones and small tablets (<= 860px): a slim bottom bar with "Play free" and "Menu" that stays in thumb reach
   (hides while you scroll down to read, comes back when you scroll up or reach the end), and a full-screen menu
   sheet. The page headers' own "Menu" buttons open the same sheet. Styles live in /css/tokens.css (.ms-*). */
(function () {
  'use strict';
  var d = document, PLAY = 'https://monstersweeps.net/';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LINKS = [
    ['Home', '/'], ['How it works', '/#how'], ['Rewards and tiers', '/#rewards'], ['VIP Club', '/vip.html'],
    ['Refer a Friend', '/refer-a-friend.html'], ['Leaderboard', '/leaderboard.html'], ['Blog and guides', '/blog/'], ['Help and contact', '/contact.html']
  ];
  var here = location.pathname.replace(/index\.html$/, '');

  function el(html) { var t = d.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  var bar = el('<div class="ms-bar" role="navigation" aria-label="Quick actions">' +
    '<a class="ms-play" href="' + PLAY + '">Play free</a>' +
    '<button class="ms-menu" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="ms-sheet"><span class="ms-burger" aria-hidden="true"><i></i><i></i><i></i></span>Menu</button></div>');

  var items = LINKS.map(function (l) {
    var on = l[1] === here || (l[1] === '/blog/' && here.indexOf('/blog/') === 0);
    var cur = on ? ' aria-current="' + (l[1] === here ? 'page' : 'true') + '"' : '';
    return '<li><a href="' + l[1] + '"' + cur + '>' + l[0] + '</a></li>';
  }).join('');
  var sheet = el('<div class="ms-sheet" id="ms-sheet" role="dialog" aria-modal="true" aria-label="Menu" hidden>' +
    '<div class="ms-scrim" data-close></div>' +
    '<div class="ms-panel">' +
      '<div class="ms-head"><a class="ms-brand" href="/"><img src="/mark.svg" width="34" height="34" alt=""><span>Monster<b>Sweeps</b></span></a>' +
      '<button class="ms-x" type="button" data-close aria-label="Close menu">&times;</button></div>' +
      '<nav aria-label="Site"><ul class="ms-list">' + items + '</ul></nav>' +
      '<div class="ms-acts"><a class="ms-play" href="' + PLAY + '">Claim your free spin</a><a class="ms-login" href="' + PLAY + '">Log in</a></div>' +
      '<p class="ms-safe"><b>21+</b> only &middot; <a href="/responsible-gaming.html">Play responsibly</a> &middot; Free help 24/7: <a href="tel:18006973738">1-800-MY-RESET</a></p>' +
    '</div></div>');

  d.body.appendChild(bar); d.body.appendChild(sheet);
  d.documentElement.classList.add('has-msbar');

  /* ---- open / close with focus trap and scroll lock ---- */
  var opener = null, btn = bar.querySelector('.ms-menu');
  function focusables() { return [].slice.call(sheet.querySelectorAll('a[href],button')); }
  function open(from) {
    opener = from || btn; sheet.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('on'); });
    d.documentElement.classList.add('ms-lock'); btn.setAttribute('aria-expanded', 'true');
    var f = sheet.querySelector('[aria-current]') || focusables()[0]; if (f) f.focus({ preventScroll: true });
  }
  function close() {
    if (sheet.hidden) return;
    sheet.classList.remove('on'); d.documentElement.classList.remove('ms-lock'); btn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { sheet.hidden = true; }, RM ? 0 : 220);
    if (opener) opener.focus({ preventScroll: true });
  }
  btn.addEventListener('click', function () { open(btn); });
  sheet.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
    else if (e.target.closest('a')) close();
  });
  d.addEventListener('keydown', function (e) {
    if (sheet.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      var f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  /* the headers' own Menu buttons open the sheet instead of their old drop-downs */
  d.addEventListener('click', function (e) {
    var hb = e.target.closest('#menu, #gmenu');
    if (!hb) return;
    e.preventDefault(); e.stopPropagation(); open(hb);
  }, true);

  /* ---- bottom bar: hide while reading down, show on the way back up and at the end ---- */
  var lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    var y = scrollY, end = y + innerHeight >= d.documentElement.scrollHeight - 80;
    if (end || y < 120 || y < lastY - 6) bar.classList.remove('ms-off');
    else if (y > lastY + 6) bar.classList.add('ms-off');
    lastY = y;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
})();
