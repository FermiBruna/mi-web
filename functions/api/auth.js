// Inici de sessió de Decap CMS amb GitHub (pas 1): envia l'usuari a GitHub.
// Necessita les variables GITHUB_CLIENT_ID i GITHUB_CLIENT_SECRET (Configuració → Variables i secrets).
// L'ID del client és públic (no és secret); si existeix la variable GITHUB_CLIENT_ID, té prioritat.
export const CLIENT_ID_PER_DEFECTE = "Ov23liZJnY8hXE97j0Ip";

export async function onRequest({ request, env }) {
  const clientId = env.GITHUB_CLIENT_ID || CLIENT_ID_PER_DEFECTE;
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const scope = url.searchParams.get("scope") || "repo";
  const github = new URL("https://github.com/login/oauth/authorize");
  github.searchParams.set("client_id", clientId);
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
