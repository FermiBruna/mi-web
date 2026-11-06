// Comptador propi de la web (visites i m'agrada) per a Cloudflare Pages.
// Guarda els números a Workers KV (enllaç "COMPTADORS" a la configuració del projecte).
//   GET  /api/comptador?clau=...  -> torna el valor actual
//   POST /api/comptador?clau=...  -> suma 1 i torna el valor nou
// VALORS_INICIALS: els números que portava el comptador de Netlify el dia del canvi.

const VALORS_INICIALS = {
  fermibruna_fotografia_visites: 0, // s'actualitza el dia de la migració
  fermibruna_fotografia_magrades: 0,
};

const respon = (cos, status = 200) =>
  new Response(JSON.stringify(cos), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequest({ request, env }) {
  const clau = new URL(request.url).searchParams.get("clau");
  if (!Object.hasOwn(VALORS_INICIALS, clau)) return respon({ error: "clau no vàlida" }, 400);
  if (request.method !== "GET" && request.method !== "POST") return respon({ error: "mètode no permès" }, 405);

  const guardat = await env.COMPTADORS.get(clau);
  let valor = guardat === null ? VALORS_INICIALS[clau] : Number(guardat) || 0;

  if (request.method === "POST") {
    valor += 1;
    await env.COMPTADORS.put(clau, String(valor));
  } else if (guardat === null) {
    await env.COMPTADORS.put(clau, String(valor));
  }
  return respon({ clau, valor });
}
