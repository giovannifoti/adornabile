# Pubblicazione gratuita su Netlify

Questa è la strada più rapida senza server a pagamento: Netlify pubblica il sito statico, esegue le API con Netlify Functions e salva gli ordini con Netlify Blobs.

## 1. Carica il progetto su GitHub

Se il repository è già collegato a GitHub, basta fare push delle modifiche. In caso contrario crea un repository GitHub e carica questa cartella.

## 2. Crea il sito su Netlify

1. Accedi a Netlify.
2. Crea un nuovo sito importando il repository GitHub.
3. Lascia che Netlify legga `netlify.toml`.
4. Verifica queste impostazioni:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

## 3. Variabili ambiente su Netlify

Nel pannello Netlify vai in `Site configuration` → `Environment variables` e aggiungi:

```text
STRIPE_SECRET_KEY=la tua chiave secret Stripe
STRIPE_PUBLISHABLE_KEY=la tua chiave pubblica Stripe
PUBLIC_SITE_URL=https://nome-sito.netlify.app
ADMIN_USERNAME=il tuo username admin
ADMIN_PASSWORD=la tua password admin
```

La variabile `STRIPE_WEBHOOK_SECRET` si aggiunge dopo aver creato il webhook Stripe.

## 4. Webhook Stripe

Dopo il primo deploy su Netlify:

1. Copia l'URL del sito Netlify.
2. Entra nella Dashboard Stripe.
3. Vai in `Developers` → `Webhooks`.
4. Crea un endpoint con questo URL:

```text
https://nome-sito.netlify.app/api/stripe/webhook
```

5. Seleziona questi eventi:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
```

6. Copia il signing secret che inizia con `whsec_`.
7. Aggiungilo su Netlify come:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

8. Rifai il deploy del sito.

## 5. Area admin

L'area admin non è mostrata nel menu pubblico. Si apre manualmente da:

```text
https://nome-sito.netlify.app/admin
```

Usa le credenziali impostate nelle variabili ambiente `ADMIN_USERNAME` e `ADMIN_PASSWORD`.

## Nota importante

Con le chiavi `test` Stripe il flusso funziona senza incassare denaro reale. Per ricevere pagamenti veri servono le chiavi `live` e l'account Stripe attivato; Stripe applica comunque le sue commissioni per transazione.
