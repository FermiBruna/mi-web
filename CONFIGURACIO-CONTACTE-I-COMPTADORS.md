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

## 2) Comptador de visites

### Estat actual
- Ara s'ha implementat un comptador compartit entre usuaris amb **CountAPI**:
  - namespace: `fermibruna-fotografia-com`
  - key: `visites-web`
- Es fa increment una vegada al dia per navegador (via `localStorage`) i es mostra el total global.
- Si CountAPI falla, hi ha *fallback* local amb `localStorage`.

### Dependència externa
- Servei: `https://api.countapi.xyz`

---

## 3) Botó/comptador de "M'agrada"

### Estat actual
- També s'ha connectat a **CountAPI** per a comptador global:
  - namespace: `fermibruna-fotografia-com`
  - key: `magrades-web`
- El botó només permet un "m'agrada" per navegador (guardat amb `localStorage`).
- Si CountAPI falla, usa un valor local de reserva.

### Dependència externa
- Servei: `https://api.countapi.xyz`

---

## 4) Nota tècnica sobre Decap CMS

- La secció **Mirades amigues** (Juanjo/Juan) està maquetada directament a `index.html`.
- Per això **no ha calgut modificar** `datos.json` ni `admin/config.yml` per afegir Juan.
- `datos.json` i Decap continuen gestionant la galeria principal.

---

## 5) Recomanació de producció (opcional)

Per a màxim control i evitar dependències gratuïtes externes, es recomana migrar:
- comptadors i likes a una funció serverless pròpia (Netlify Functions + base de dades),
- i mantenir Web3Forms o substituir-lo per una funció pròpia de contacte.
