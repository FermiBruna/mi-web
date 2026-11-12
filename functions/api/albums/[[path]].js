// Àlbums temporals (15 dies) guardats a Workers KV (enllaç COMPTADORS, prefix "album:").
//
// Públic:
//   GET    /api/albums                         -> llista d'àlbums actius
//   GET    /api/albums/:slug                   -> dades d'un àlbum
//   GET    /api/albums/:slug/:n/thumb.jpg      -> miniatura   (…/web.jpg = foto gran, ?dl=1 per descarregar)
// Només Fermí (sessió obtinguda amb el login de GitHub):
//   POST   /api/albums/login   {token}         -> {session}
//   POST   /api/albums         {title, date}   -> crea l'àlbum (encara no visible)
//   PUT    /api/albums/:slug/foto/:n/:size     -> puja una foto (cos = JPEG)
//   POST   /api/albums/:slug/publica {count, cover}
//   DELETE /api/albums/:slug

const DIES = 15;
const USUARI = "fermibruna";
const INDEX = "album:index";

const json = (cos, status = 200) =>
  new Response(JSON.stringify(cos), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const slugify = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’´`·]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "album";

async function llegirIndex(kv) {
  const llista = (await kv.get(INDEX, { type: "json" })) || [];
  const ara = Date.now();
  return llista.filter((a) => a.expiresAt > ara);
}

async function sessio(request, env) {
  const clau = request.headers.get("x-session");
  if (!clau) return null;
  return await env.COMPTADORS.get("album:session:" + clau);
}

export async function onRequest({ request, env, params }) {
  const kv = env.COMPTADORS;
  const url = new URL(request.url);
  const parts = params.path || [];
  const m = request.method;

  // ---------- Públic ----------
  if (m === "GET" && parts.length === 0) {
    const llista = (await llegirIndex(kv)).sort((a, b) => b.createdAt - a.createdAt);
    return json(llista);
  }

  if (m === "GET" && parts.length === 3 && /^\d+$/.test(parts[1]) && /^(thumb|web)\.jpg$/.test(parts[2])) {
    const cache = caches.default;
    const clauCache = new Request(url.toString(), { method: "GET" });
    const desat = await cache.match(clauCache);
    if (desat) return desat;

    const [slug, n, fitxer] = parts;
    const mida = fitxer.replace(".jpg", "");
    const dades = await kv.getWithMetadata(`album:img:${slug}:${Number(n)}:${mida}`, { type: "arrayBuffer" });
    if (!dades.value) return new Response("No trobada", { status: 404 });
    const capçaleres = {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=86400",
    };
    if (url.searchParams.has("dl")) {
      capçaleres["content-disposition"] = `attachment; filename="${slug}-${String(n).padStart(3, "0")}.jpg"`;
    }
    const resposta = new Response(dades.value, { headers: capçaleres });
    await cache.put(clauCache, resposta.clone());
    return resposta;
  }

  if (m === "GET" && parts.length === 1) {
    const meta = await kv.get("album:meta:" + parts[0], { type: "json" });
    if (!meta || meta.expiresAt < Date.now()) return json({ error: "no existeix" }, 404);
    if (!meta.complete && !(await sessio(request, env))) return json({ error: "no existeix" }, 404);
    return json(meta);
  }

  // ---------- Login ----------
  if (m === "POST" && parts[0] === "login") {
    const { token } = await request.json().catch(() => ({}));
    let login = null;
    if (env.ALBUMS_DEV_LOGIN && token === "dev" && url.hostname === "localhost") {
      login = USUARI;
    } else if (token) {
      const r = await fetch("https://api.github.com/user", {
        headers: { authorization: `Bearer ${token}`, "user-agent": "mi-web-albums", accept: "application/vnd.github+json" },
      });
      if (r.ok) login = String((await r.json()).login || "").toLowerCase();
    }
    if (login !== USUARI) return json({ error: "Aquest compte no té permís." }, 403);
    const clau = crypto.randomUUID();
    await kv.put("album:session:" + clau, login, { expirationTtl: 6 * 3600 });
    return json({ session: clau });
  }

  // ---------- Només amb sessió ----------
  if (!(await sessio(request, env))) return json({ error: "Cal entrar amb GitHub." }, 401);

  if (m === "POST" && parts.length === 0) {
    const { title, date } = await request.json().catch(() => ({}));
    if (!title || !String(title).trim()) return json({ error: "Falta el títol." }, 400);
    const base = slugify(title);
    let slug = base;
    for (let i = 2; await kv.get("album:meta:" + slug); i++) slug = `${base}-${i}`;
    const ara = Date.now();
    const meta = {
      slug,
      title: String(title).trim().slice(0, 120),
      date: String(date || "").trim().slice(0, 60),
      count: 0,
      cover: 1,
      createdAt: ara,
      expiresAt: ara + DIES * 86400 * 1000,
      complete: false,
    };
    await kv.put("album:meta:" + slug, JSON.stringify(meta), { expiration: Math.floor(meta.expiresAt / 1000) });
    return json(meta);
  }

  if (m === "PUT" && parts.length === 4 && parts[1] === "foto" && /^\d+$/.test(parts[2]) && /^(thumb|web)$/.test(parts[3])) {
    const [slug, , n, mida] = parts;
    const meta = await kv.get("album:meta:" + slug, { type: "json" });
    if (!meta) return json({ error: "Àlbum inexistent." }, 404);
    const cos = await request.arrayBuffer();
    if (cos.byteLength < 100 || cos.byteLength > 8 * 1024 * 1024) return json({ error: "Mida de foto no vàlida." }, 400);
    await kv.put(`album:img:${slug}:${Number(n)}:${mida}`, cos, { expiration: Math.floor(meta.expiresAt / 1000) });
    return json({ ok: true });
  }

  if (m === "POST" && parts.length === 2 && parts[1] === "publica") {
    const slug = parts[0];
    const meta = await kv.get("album:meta:" + slug, { type: "json" });
    if (!meta) return json({ error: "Àlbum inexistent." }, 404);
    const { count, cover } = await request.json().catch(() => ({}));
    meta.count = Math.max(0, Number(count) || 0);
    meta.cover = Math.min(Math.max(1, Number(cover) || 1), meta.count || 1);
    meta.complete = true;
    await kv.put("album:meta:" + slug, JSON.stringify(meta), { expiration: Math.floor(meta.expiresAt / 1000) });
    const index = (await llegirIndex(kv)).filter((a) => a.slug !== slug);
    index.push({ slug, title: meta.title, date: meta.date, count: meta.count, cover: meta.cover, createdAt: meta.createdAt, expiresAt: meta.expiresAt });
    await kv.put(INDEX, JSON.stringify(index));
    return json(meta);
  }

  if (m === "DELETE" && parts.length === 1) {
    const slug = parts[0];
    const meta = await kv.get("album:meta:" + slug, { type: "json" });
    const index = (await llegirIndex(kv)).filter((a) => a.slug !== slug);
    await kv.put(INDEX, JSON.stringify(index));
    await kv.delete("album:meta:" + slug);
    if (meta) {
      for (let n = 1; n <= meta.count; n++) {
        await kv.delete(`album:img:${slug}:${n}:thumb`);
        await kv.delete(`album:img:${slug}:${n}:web`);
      }
    }
    return json({ ok: true });
  }

  return json({ error: "Petició no vàlida." }, 400);
}
