/* MonsterSweeps site config: every business value comes from /data/site-config.json.
   MS.ready      promise that resolves with the config (or {} if it cannot be loaded)
   MS.has(key)   true only for a real value: not missing, not "TODO", not an empty list ("popup.ctaText" style paths work)
   MS.get(key)   the value, or undefined when MS.has is false
   MS.cta(url, campaign)  url + utm_source=monsters.win&utm_medium=site&utm_campaign=<campaign>
   MS.apply(root) wires a part of the page: [data-cfg] text, [data-needs] visibility, play-site links, social links */
(function () {
  'use strict';
  var d = document, FALLBACK = 'https://monstersweeps.net/', cfg = {};
  function dig(k) { return String(k).split('.').reduce(function (o, p) { return o == null ? o : o[p]; }, cfg); }
  function real(v) {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0 && v.every(real);
    if (typeof v === 'string') return v.trim() !== '' && !/^todo\b/i.test(v.trim());
    return true;
  }
  function has(k) { return real(dig(k)); }
  function get(k) { return has(k) ? dig(k) : undefined; }
  function httpUrl(u, fb) { u = String(u || '').trim(); return /^https:\/\//i.test(u) ? u : fb; }
  function cta(url, campaign) {
    try {
      var u = new URL(httpUrl(url, FALLBACK));
      u.searchParams.set('utm_source', 'monsters.win'); u.searchParams.set('utm_medium', 'site');
      u.searchParams.set('utm_campaign', String(campaign || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'site');
      return u.toString();
    } catch (e) { return FALLBACK; }
  }
  function campaignOf(a) {
    if (a.dataset.cta) return a.dataset.cta;
    var s = a.closest('[data-campaign],section[id],header,footer,.ms-bar,.ms-sheet');
    if (s) { if (s.dataset.campaign) return s.dataset.campaign; if (s.id && s.tagName === 'SECTION') return s.id; if (s.tagName === 'HEADER') return 'header'; if (s.tagName === 'FOOTER') return 'footer'; if (s.classList.contains('ms-bar')) return 'mobile_bar'; if (s.classList.contains('ms-sheet')) return 'mobile_menu'; }
    return (location.pathname.replace(/\.html$/, '').replace(/^\/|\/$/g, '') || 'home');
  }
  var SOCIAL = [['facebook', 'Facebook'], ['telegram', 'Telegram'], ['messenger', 'Messenger']];
  function socialLinks(cls) {
    return SOCIAL.filter(function (s) { return /^https:\/\//i.test(get('social.' + s[0]) || ''); }).map(function (s) {
      return '<a class="' + cls + '" href="' + get('social.' + s[0]).replace(/"/g, '%22') + '" target="_blank" rel="noopener">' + s[1] + '</a>';
    });
  }
  function apply(root) {
    root = root || d;
    [].forEach.call(root.querySelectorAll('[data-cfg]'), function (el) { var v = get(el.dataset.cfg); if (v !== undefined) el.textContent = Array.isArray(v) ? v.join(', ') : v; });
    [].forEach.call(root.querySelectorAll('[data-needs]'), function (el) { el.hidden = !el.dataset.needs.split(/\s+/).every(has); });
    // every link to the play site gets the register/login URL from config plus UTM parameters
    [].forEach.call(root.querySelectorAll('a[href^="https://monstersweeps.net"],a[data-cta]'), function (a) {
      if (a.dataset.utm) return;
      var login = a.dataset.to === 'login' || /^\s*log ?in\s*$/i.test(a.textContent);
      var base = a.dataset.href || get(login ? 'loginUrl' : 'registerUrl') || FALLBACK;
      a.href = cta(base, campaignOf(a)); a.dataset.utm = '1';
    });
    // community links: footers and headers, only for networks that have a real URL
    var links = socialLinks('');
    if (links.length) {
      [].forEach.call(root.querySelectorAll('.foot-in,.gfoot-in'), function (f) {
        if (f.querySelector('.community')) return;
        var n = d.createElement('nav'); n.className = 'community'; n.setAttribute('aria-label', 'Community');
        n.innerHTML = '<h3>Community</h3><ul>' + links.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>'; f.appendChild(n);
      });
      [].forEach.call(root.querySelectorAll('.acts,.bar-cta,.gcta'), function (h) {
        if (h.querySelector('.soc')) return;
        var s = d.createElement('span'); s.className = 'soc'; s.innerHTML = socialLinks('soc-a').join(''); h.insertBefore(s, h.firstChild);
      });
    }
  }
  var ready = (window.fetch ? fetch('/data/site-config.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }) : Promise.resolve({}))
    .catch(function () { return {}; })
    .then(function (j) { cfg = j && typeof j === 'object' ? j : {}; apply(d); return cfg; });
  window.MS = { ready: ready, has: has, get: get, cta: cta, apply: apply, socialLinks: socialLinks };
})();
