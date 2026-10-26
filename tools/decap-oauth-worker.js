/* GitHub login for Decap CMS (www.monsters.win/admin), as a Cloudflare Worker.
   GitHub Pages has no server, so this tiny worker does the one server-side step of GitHub OAuth:
   swapping the temporary `code` for an access token. Setup steps: _SETUP-NOTES.md ("Game tiles CMS").

   Worker settings (Settings -> Variables and Secrets):
     GITHUB_CLIENT_ID      the OAuth App's client ID
     GITHUB_CLIENT_SECRET  the OAuth App's client secret (add it as a Secret)
     ALLOWED_ORIGIN        https://www.monsters.win   (the site the CMS runs on)

   Routes: /auth (start login) and /callback (GitHub sends the user back here). */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = env.ALLOWED_ORIGIN || 'https://www.monsters.win';

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const gh = new URL('https://github.com/login/oauth/authorize');
      gh.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      gh.searchParams.set('redirect_uri', `${url.origin}/callback`);
      gh.searchParams.set('scope', url.searchParams.get('scope') || 'repo');
      gh.searchParams.set('state', state);
      return new Response(null, {
        status: 302,
        headers: {
          Location: gh.toString(),
          'Set-Cookie': `decap_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    if (url.pathname === '/callback') {
      const cookie = (req.headers.get('Cookie') || '').match(/(?:^|;\s*)decap_state=([^;]+)/);
      if (!cookie || cookie[1] !== url.searchParams.get('state')) return page(origin, 'error', { message: 'Login expired. Please try again.' });
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'monstersweeps-decap-auth' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: url.searchParams.get('code'),
          redirect_uri: `${url.origin}/callback`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.access_token) return page(origin, 'error', { message: data.error_description || 'GitHub did not return a token.' });
      return page(origin, 'success', { token: data.access_token, provider: 'github' });
    }

    return new Response('MonsterSweeps CMS auth', { status: 200 });
  },
};

/* Decap's popup handshake: say "authorizing", wait for the CMS window to answer, then hand over the
   result, only to the site's own origin. */
function page(origin, status, content) {
  const msg = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><meta charset="utf-8"><title>Signing in…</title><p>Signing in…</p><script>
  (function () {
    var origin = ${JSON.stringify(origin)}, msg = ${JSON.stringify(msg)};
    function onMsg(e) { if (e.origin !== origin) return; window.removeEventListener('message', onMsg); window.opener.postMessage(msg, origin); setTimeout(function () { window.close(); }, 300); }
    window.addEventListener('message', onMsg);
    if (window.opener) window.opener.postMessage('authorizing:github', origin);
  })();
  </script>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'decap_state=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax' },
  });
}
