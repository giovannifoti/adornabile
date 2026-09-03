# Pubblicazione Adornabile su Render

Questa configurazione pubblica il sito come Web Service Node, necessario per carrello, Stripe, webhook e area admin.

## 1. Prima di pubblicare

Non caricare mai file con chiavi segrete:

- `.env`
- `prova.env`
- qualunque file `*.env`

Sono già ignorati da git.

## 2. Carica il progetto su GitHub

Dal repository locale:

```bash
git add .
git commit -m "Prepara ecommerce Adornabile per Render"
git push
```

Se non hai ancora creato il repository GitHub, crea prima un nuovo repository vuoto e segui i comandi che GitHub mostra nella pagina.

## 3. Crea il Web Service su Render

1. Vai su <https://dashboard.render.com>.
2. Clicca `New`.
3. Scegli `Blueprint`.
4. Collega il repository GitHub del sito.
5. Render leggerà `render.yaml` e creerà il servizio `adornabile-ecommerce`.

La configurazione usa:

```text
Build Command: npm install && npm run build
Start Command: npm start
Health Check Path: /api/health
Disk: /var/data
```

Il disco è necessario per conservare gli ordini salvati in `orders.json`.

## 4. Variabili ambiente da impostare su Render

Nel servizio Render vai su `Environment` e compila:

```env
PUBLIC_SITE_URL=https://adornabile.it
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_USERNAME=adornabile
ADMIN_PASSWORD=valeria8
ORDERS_DATA_DIR=/var/data/adornabile
```

Per testare online prima della modalità live puoi usare temporaneamente:

```env
STRIPE_SECRET_KEY=sk_test_...
PUBLIC_SITE_URL=https://il-tuo-url-render.onrender.com
```

## 5. Webhook Stripe online

Dopo il primo deploy:

1. Copia l'URL Render del sito.
2. Vai su Stripe Dashboard.
3. Apri `Developers` -> `Webhooks`.
4. Crea un endpoint:

```text
https://il-tuo-url-render.onrender.com/api/stripe/webhook
```

5. Seleziona questi eventi:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
```

6. Copia il signing secret `whsec_...`.
7. Inseriscilo in Render come `STRIPE_WEBHOOK_SECRET`.
8. Salva e redeploya.

## 6. Dominio adornabile.it

Quando il sito Render funziona:

1. Vai nel servizio Render.
2. Apri `Settings` -> `Custom Domains`.
3. Aggiungi `adornabile.it`.
4. Segui i record DNS mostrati da Render presso il gestore del dominio.
5. Aggiorna `PUBLIC_SITE_URL` a:

```env
PUBLIC_SITE_URL=https://adornabile.it
```

## 7. Admin

Area admin:

```text
https://adornabile.it/#admin
```

Credenziali iniziali:

```text
username: adornabile
password: valeria8
```

