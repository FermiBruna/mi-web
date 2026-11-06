// Inici de sessió de Decap CMS amb GitHub (pas 2): GitHub torna ací amb un codi,
// el canviem per un token i el passem a la finestra de Decap que ha obert el popup.
const pagina = (estat, contingut) => `<!doctype html><html><body><script>
(function () {
  var missatge = 'authorization:github:${estat}:' + JSON.stringify(${JSON.stringify(contingut)});
  function rebre(e) {
    window.opener.postMessage(missatge, e.origin);
    window.removeEventListener('message', rebre, false);
    setTimeout(function () { window.close(); }, 500);
  }
  window.addEventListener('message', rebre, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script><p>Pots tancar aquesta finestra.</p></body></html>`;

const html = (body, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = (request.headers.get("cookie") || "").match(/decap_oauth_state=([^;]+)/);
  if (!code || !state || !cookie || cookie[1] !== state) {
    return html(pagina("error", { message: "Sessió no vàlida. Torna-ho a provar." }), 400);
  }
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "user-agent": "mi-web-decap-auth" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });
  const dades = await r.json().catch(() => ({}));
  if (!dades.access_token) {
    return html(pagina("error", { message: dades.error_description || "GitHub no ha donat accés." }), 401);
  }
  return html(pagina("success", { token: dades.access_token, provider: "github" }));
}
