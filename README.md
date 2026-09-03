# Adornabile Handmade

Ecommerce per bouquet in cera profumata Adornabile, realizzato con React, Vite, Stripe Checkout e area admin ordini.

## Comandi locali

```bash
npm install
npm run server
```

Il sito locale si apre su `http://localhost:4173`.

## Pubblicazione

La pubblicazione gratuita è configurata per Netlify con:

- frontend statico in `dist`
- API in `netlify/functions`
- ordini salvati con Netlify Blobs
- pagamenti tramite Stripe Checkout

I passaggi sono in `DEPLOY_NETLIFY.md`.
