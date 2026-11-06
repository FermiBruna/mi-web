// Inici de sessió de Decap CMS amb GitHub (pas 1): envia l'usuari a GitHub.
// Necessita les variables GITHUB_CLIENT_ID i GITHUB_CLIENT_SECRET (Configuració → Variables i secrets).
export async function onRequest({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) return new Response("Falta GITHUB_CLIENT_ID", { status: 500 });
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const scope = url.searchParams.get("scope") || "repo";
  const github = new URL("https://github.com/login/oauth/authorize");
  github.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  github.searchParams.set("redirect_uri", `${url.origin}/api/callback`);
  github.searchParams.set("scope", scope);
  github.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      location: github.toString(),
      "set-cookie": `decap_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
