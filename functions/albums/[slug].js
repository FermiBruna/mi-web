// Pàgina pública d'un àlbum: /albums/:slug
// Es genera aquí (i no com a fitxer fix) perquè, en compartir l'enllaç a Facebook o Pixelfed,
// la vista prèvia mostre la portada i el títol d'aquest àlbum concret.

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const dataCurta = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
};

const html = (cos, status = 200) =>
  new Response(cos, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });

const CSS = `
:root{--bg:#494949;--surface:#3a3a3a;--text:#f0f0f0;--muted:#ccc;--accent:#ffd84d}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Lato',sans-serif;line-height:1.5}
a{color:inherit}
header{max-width:1200px;margin:0 auto;padding:1.5rem 1.25rem .5rem}
.tornar{display:inline-block;text-decoration:none;color:var(--muted);font-size:.95rem;margin-bottom:1.25rem}
.tornar:hover{color:#fff}
.dalt{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}
.idiomes{display:flex;gap:.4rem;font-size:.85rem;color:var(--muted)}
.idiomes button{background:none;border:none;color:var(--muted);cursor:pointer;font:inherit;padding:.1rem .25rem}
.idiomes button.actiu{color:#fff;font-weight:700}
h1{font-family:'Playfair Display',serif;font-weight:600;font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.2}
.info{color:var(--muted);margin-top:.4rem;font-size:.95rem}
.graella{max-width:1200px;margin:1.5rem auto 3rem;padding:0 1.25rem;column-count:4;column-gap:1rem}
@media(max-width:1000px){.graella{column-count:3}}
@media(max-width:700px){.graella{column-count:2;column-gap:.6rem}}
.foto{break-inside:avoid;margin-bottom:1rem;border-radius:6px;overflow:hidden;background:var(--surface);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.3)}
@media(max-width:700px){.foto{margin-bottom:.6rem}}
.foto img{display:block;width:100%;height:auto;transition:transform .35s ease}
.foto:hover img{transform:scale(1.03)}
footer{text-align:center;color:var(--muted);font-size:.85rem;padding:2rem 1rem 3rem}
.visor{position:fixed;inset:0;background:rgba(20,20,20,.96);display:none;align-items:center;justify-content:center;z-index:10;touch-action:pan-y}
.visor.obert{display:flex}
.visor img{max-width:94vw;max-height:84vh;object-fit:contain;border-radius:4px;user-select:none}
.boto{position:absolute;background:rgba(255,255,255,.12);border:none;color:#fff;font-size:1.6rem;width:3rem;height:3rem;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none}
.boto:hover{background:rgba(255,255,255,.25)}
.tanca{top:1rem;right:1rem}
.ant{left:1rem;top:50%;transform:translateY(-50%)}
.seg{right:1rem;top:50%;transform:translateY(-50%)}
.barra{position:absolute;bottom:1rem;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:1rem;color:var(--muted);font-size:.95rem}
.descarrega{background:var(--accent);color:#222;border-radius:999px;padding:.5rem 1.1rem;text-decoration:none;font-weight:700;font-size:.9rem}
@media(max-width:700px){.ant,.seg{display:none}}
.buit{max-width:600px;margin:20vh auto;text-align:center;padding:0 1.25rem}
.buit h1{margin-bottom:1rem}
.buit a{display:inline-block;margin-top:1.5rem;color:var(--accent)}
`;

const CAP = (titol, extra = "") => `<!DOCTYPE html><html lang="ca"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titol)}</title>
<link rel="icon" href="/Logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
${extra}<style>${CSS}</style></head><body>`;

export async function onRequest({ request, env, params }) {
  const url = new URL(request.url);
  const slug = String(params.slug || "");
  const meta = await env.COMPTADORS.get("album:meta:" + slug, { type: "json" });

  if (!meta || !meta.complete || meta.expiresAt < Date.now()) {
    return html(
      CAP("Àlbum no disponible – Fermí Bruna") +
        `<div class="buit"><h1>Aquest àlbum ja no està disponible</h1>
         <p>Els àlbums d'esdeveniments es poden veure durant 15 dies.</p>
         <p style="margin-top:1rem;color:#ccc">Este álbum ya no está disponible · This album is no longer available</p>
         <a href="/">Fermí Bruna – Fotografia →</a></div></body></html>`,
      404
    );
  }

  const base = url.origin;
  const portada = `${base}/api/albums/${slug}/${meta.cover}/web.jpg`;
  const desc = `${meta.count} fotografies${meta.date ? " · " + meta.date : ""} · Fermí Bruna – Fotografia`;
  const og = `
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fermí Bruna – Fotografia">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(portada)}">
<meta property="og:url" content="${esc(base + "/albums/" + slug)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(portada)}">
`;

  let fotos = "";
  for (let n = 1; n <= meta.count; n++) {
    fotos += `<div class="foto" data-n="${n}"><img src="/api/albums/${slug}/${n}/thumb.jpg" alt="${esc(meta.title)} – ${n}" loading="lazy" decoding="async"></div>`;
  }

  const cos = `
<header>
  <div class="dalt"><a class="tornar" href="/">← Fermí Bruna · Fotografia</a>
  <div class="idiomes"><button data-l="ca">CAT</button>|<button data-l="es">ES</button>|<button data-l="en">EN</button></div></div>
  <h1>${esc(meta.title)}</h1>
  <p class="info">${meta.date ? esc(meta.date) + " · " : ""}${meta.count} <span data-t="fotos">fotografies</span> · <span data-t="fins">disponible fins al</span> ${dataCurta(meta.expiresAt)}</p>
</header>
<main class="graella">${fotos}</main>
<footer>© Fermí Bruna. <span data-t="peu">Fotografies per a ús personal; si en publiqueu alguna, si us plau, esmenteu l'autor.</span></footer>
<div class="visor" id="visor" aria-hidden="true">
  <button class="boto tanca" id="tanca" aria-label="Tanca">✕</button>
  <button class="boto ant" id="ant" aria-label="Anterior">‹</button>
  <img id="gran" alt="">
  <button class="boto seg" id="seg" aria-label="Següent">›</button>
  <div class="barra"><span id="comptador"></span><a class="descarrega" id="descarrega" href="#">⬇ <span data-t="baixa">Descarrega</span></a></div>
</div>
<script>
(function(){
  var slug=${JSON.stringify(slug)}, total=${meta.count}, actual=1;
  var visor=document.getElementById('visor'), gran=document.getElementById('gran');
  function mostra(n){
    actual=(n-1+total)%total+1;
    gran.src='/api/albums/'+slug+'/'+actual+'/web.jpg';
    document.getElementById('comptador').textContent=actual+' / '+total;
    document.getElementById('descarrega').href='/api/albums/'+slug+'/'+actual+'/web.jpg?dl=1';
    var seg=new Image(); seg.src='/api/albums/'+slug+'/'+(actual%total+1)+'/web.jpg';
  }
  function obri(n){ mostra(n); visor.classList.add('obert'); visor.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function tanca(){ visor.classList.remove('obert'); visor.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  document.querySelectorAll('.foto').forEach(function(f){ f.addEventListener('click',function(){ obri(+f.dataset.n); }); });
  document.getElementById('tanca').onclick=tanca;
  document.getElementById('ant').onclick=function(){ mostra(actual-1); };
  document.getElementById('seg').onclick=function(){ mostra(actual+1); };
  visor.addEventListener('click',function(e){ if(e.target===visor) tanca(); });
  document.addEventListener('keydown',function(e){
    if(!visor.classList.contains('obert')) return;
    if(e.key==='Escape') tanca(); else if(e.key==='ArrowLeft') mostra(actual-1); else if(e.key==='ArrowRight') mostra(actual+1);
  });
  var T={
    ca:{fotos:'fotografies',fins:'disponible fins al',peu:"Fotografies per a ús personal; si en publiqueu alguna, si us plau, esmenteu l'autor.",baixa:'Descarrega'},
    es:{fotos:'fotografías',fins:'disponible hasta el',peu:'Fotografías para uso personal; si publicáis alguna, por favor, mencionad al autor.',baixa:'Descargar'},
    en:{fotos:'photos',fins:'available until',peu:'Photos for personal use; if you share any, please credit the author.',baixa:'Download'}
  };
  function idioma(l){
    if(!T[l]) l='ca';
    document.documentElement.lang=l;
    document.querySelectorAll('[data-t]').forEach(function(e){ e.textContent=T[l][e.dataset.t]; });
    document.querySelectorAll('.idiomes button').forEach(function(b){ b.classList.toggle('actiu', b.dataset.l===l); });
  }
  document.querySelectorAll('.idiomes button').forEach(function(b){ b.onclick=function(){ idioma(b.dataset.l); }; });
  var q=new URLSearchParams(location.search).get('lang'), nav=(navigator.language||'').slice(0,2);
  idioma(q || (nav==='es'||nav==='en'?nav:'ca'));
  // Comptador de visites de la web: la visita a un àlbum també compta (una vegada al dia per navegador; ?yo l'exclou)
  try {
    var avui='visit_counted_'+new Date().toISOString().slice(0,10);
    if(localStorage.getItem('fb_no_contar')!=='1' && localStorage.getItem(avui)!=='1'){
      fetch('/api/comptador?clau=fermibruna_fotografia_visites',{method:'POST',cache:'no-store'})
        .then(function(r){ if(r.ok) localStorage.setItem(avui,'1'); }).catch(function(){});
    }
  } catch(e) {}
  var x0=null;
  visor.addEventListener('touchstart',function(e){ x0=e.touches[0].clientX; },{passive:true});
  visor.addEventListener('touchend',function(e){ if(x0===null) return; var dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>50) mostra(actual+(dx<0?1:-1)); x0=null; });
})();
</script>
</body></html>`;

  return html(CAP(`${meta.title} – Fermí Bruna`, og) + cos);
}
