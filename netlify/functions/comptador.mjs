// Comptador propi de la web (visites i m'agrada), guardat a Netlify Blobs.
//   GET  /api/comptador?clau=...  -> torna el valor actual
//   POST /api/comptador?clau=...  -> suma 1 i torna el valor nou
// La primera vegada que s'usa cada clau, agafa el valor del comptador antic
// (countapi.mileshilliard.com) perquè no es perda cap número.

import { getStore } from "@netlify/blobs";

const CLAUS = {
  fermibruna_fotografia_visites: 665,
  fermibruna_fotografia_magrades: 8,
};

const respon = (cos, status = 200) =>
  new Response(JSON.stringify(cos), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

async function valorInicial(clau) {
  let valor = CLAUS[clau];
  try {
    const r = await fetch(`https://countapi.mileshilliard.com/api/v1/get/${clau}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const n = Number((await r.json()).value);
      if (Number.isFinite(n) && n > valor) valor = n;
    }
  } catch {
    // si el servei antic no respon, usem el valor guardat a CLAUS
  }
  return valor;
}

export default async (req) => {
  const clau = new URL(req.url).searchParams.get("clau");
  if (!Object.hasOwn(CLAUS, clau)) return respon({ error: "clau no vàlida" }, 400);
  if (req.method !== "GET" && req.method !== "POST") return respon({ error: "mètode no permès" }, 405);

  const store = getStore({ name: "comptadors", consistency: "strong" });

  for (let intent = 0; intent < 8; intent++) {
    const actual = await store.getWithMetadata(clau, { type: "json" });

    if (!actual) {
      // Primera vegada: crear la clau amb el valor inicial
      const inicial = await valorInicial(clau);
      const valor = req.method === "POST" ? inicial + 1 : inicial;
      const res = await store.setJSON(clau, valor, { onlyIfNew: true });
      if (res.modified) return respon({ clau, valor });
      continue; // una altra petició l'ha creada alhora: tornem a llegir
    }

    const valor = Number(actual.data) || 0;
    if (req.method === "GET") return respon({ clau, valor });

    // Increment segur encara que arriben dues visites al mateix moment
    const res = await store.setJSON(clau, valor + 1, { onlyIfMatch: actual.etag });
    if (res.modified) return respon({ clau, valor: valor + 1 });
  }

  return respon({ error: "massa peticions simultànies" }, 503);
};

export const config = { path: "/api/comptador" };
