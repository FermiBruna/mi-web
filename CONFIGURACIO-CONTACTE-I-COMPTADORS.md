# Configuració i estat de funcionalitats (Contacte, visites i m'agrada)

## 1) Formulari de contacte

### Estat actual
- El formulari de `#contacto` envia el missatge a **Web3Forms** mitjançant:
  - `POST https://api.web3forms.com/submit`
  - `access_key` incrustada al formulari.
- Si la clau és vàlida i activa, els missatges arriben al correu configurat al compte de Web3Forms.

### Què cal per tindre'l actiu en producció
1. Validar que la `access_key` siga correcta al panell de Web3Forms.
2. Revisar la safata de correu (i spam) del destinatari configurat.
3. Si es canvia de correu de recepció, actualitzar la clau al formulari.

---

## 2) Comptador de visites i 3) Botó "M'agrada"

### Estat actual (des de novembre de 2026)
- Els dos comptadors són **propis**: una funció de Netlify (`netlify/functions/comptador.mjs`)
  que guarda els números a **Netlify Blobs** (magatzem `comptadors`). No depenen de cap servei extern.
- Adreça: `/api/comptador?clau=...`
  - `GET` torna el valor; `POST` suma 1.
  - Claus: `fermibruna_fotografia_visites` i `fermibruna_fotografia_magrades`.
- La primera vegada es van inicialitzar amb els valors del servei antic
  (countapi.mileshilliard.com), que ja no s'utilitza.
- Visites: es compta una vegada al dia per navegador (via `localStorage`); l'administrador
  autenticat no compta.
- M'agrada: un per navegador (via `localStorage`).
- Si la funció falla, la web mostra un valor local de reserva.

---

## 4) Nota tècnica sobre Decap CMS

- La secció **Mirades amigues** (Juanjo/Juan) està maquetada directament a `index.html`.
- Per això **no ha calgut modificar** `datos.json` ni `admin/config.yml` per afegir Juan.
- `datos.json` i Decap continuen gestionant la galeria principal.

---

## 5) Recomanació de producció (opcional)

- Els comptadors ja estan migrats a una funció pròpia (vegeu el punt 2).
- El formulari continua amb Web3Forms; es podria substituir per una funció pròpia de contacte.
