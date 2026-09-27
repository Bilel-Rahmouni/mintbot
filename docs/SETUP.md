# MintBot — Owner setup guide

Everything you need to do, in order, to get MintBot running locally and what to prepare for production. All commands are run by you; nothing here is automated.

## 1. Prerequisites

- **Node.js 20+** — check with `node -v`
- **Docker Desktop** (easiest way to run Postgres) — or a free hosted Postgres from Supabase/Neon
- **OpenAI account** — you need an API key with billing enabled (the bot uses `gpt-4o-mini` and `text-embedding-3-small`, both cheap)
- **Stripe account** — only needed when you want to charge customers; everything works on the Free plan without it

## 2. Database

Run Postgres with the pgvector extension:

```bash
docker run -d --name mintbot-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mintbot \
  -p 5432:5432 \
  pgvector/pgvector:pg17
```

To check it's running: `docker ps` should show `mintbot-db`.

Alternative without Docker: create a free project on [Supabase](https://supabase.com) or [Neon](https://neon.tech) and copy the connection string — both include pgvector.

## 3. Backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

| Variable | What to put | Required now? |
| --- | --- | --- |
| `DATABASE_URL` | Keep the default if you used the Docker command above | Yes |
| `JWT_SECRET` | Any long random string (e.g. run `openssl rand -hex 32`) | Yes |
| `OPENAI_API_KEY` | From https://platform.openai.com/api-keys | Yes |
| `STRIPE_SECRET_KEY` | From Stripe dashboard → Developers → API keys | Later |
| `STRIPE_WEBHOOK_SECRET` | See Stripe section below | Later |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` | See Stripe section below | Later |
| `PORT`, `DASHBOARD_URL`, `API_URL` | Keep defaults for local dev | No |

Then:

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

You should see `MintBot API running on http://localhost:4000`. Leave this terminal running.

## 4. Widget bundles

```bash
cd widget
npm install
npm run build
```

This produces `dist/widget.js` (chat bubble) and `dist/form.js` (inline forms). The backend serves them at `http://localhost:4000/widget.js` and `/form.js`. Re-run `npm run build` whenever you change widget code.

## 5. Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:5173.

## 6. First end-to-end test

1. Sign up in the dashboard.
2. Create a bot, add a source (a real website URL works best), wait for the status to turn **Ready**.
3. Test it in the **Playground** tab.
4. Create a form under **Forms** — it starts with name/email/message fields.
5. Open `widget/demo/index.html`, replace `REPLACE_WITH_BOT_KEY` and `REPLACE_WITH_FORM_KEY` with the keys shown in each Embed tab, then open the file in a browser. Chat with the bot and submit the form.
6. Check the form's **Submissions** and **Insights** tabs in the dashboard. (The map stays empty locally — IP geolocation can't resolve `localhost`.)

## 7. Stripe (when you're ready to charge)

1. In the Stripe dashboard (test mode first), go to **Product catalog → Add product** and create:
   - "MintBot Starter" — recurring, $19/month
   - "MintBot Pro" — recurring, $49/month
2. Copy each price ID (`price_...`) into `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO` in `backend/.env`, and set `STRIPE_SECRET_KEY`.
3. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and forward webhooks while developing:

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

4. Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` and restart the backend.
5. Test an upgrade from the Billing screen using Stripe's test card `4242 4242 4242 4242`.
6. In Stripe → Settings → **Customer portal**, enable the portal so customers can cancel/manage subscriptions.

## 8. Going to production (checklist for later)

- Host the backend (Railway, Render, Fly.io, a VPS…) with a managed Postgres that has pgvector.
- Set production env vars: real `DATABASE_URL`, a fresh `JWT_SECRET`, live Stripe keys, `DASHBOARD_URL` and `API_URL` set to your real domains.
- Deploy the dashboard as a static site (Vercel/Netlify: build command `npm run build`, output `dist/`) with `VITE_API_URL` pointing at the API domain.
- Build the widget and deploy `dist/` files with the backend (already wired — they're served from the API domain), or put them behind a CDN.
- Add a production webhook endpoint in Stripe (Developers → Webhooks → your API URL + `/api/billing/webhook`, events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) and use its signing secret.
- Switch Stripe to live mode and recreate the two prices there.
- Run migrations on the production DB: `npx prisma migrate deploy`.

## Troubleshooting

| Symptom | Likely fix |
| --- | --- |
| Backend crashes on start with "Missing required env var" | Fill that variable in `backend/.env` |
| `prisma migrate dev` fails about `vector` | Your Postgres doesn't have pgvector — use the `pgvector/pgvector` Docker image or Supabase/Neon |
| Source stuck on **Failed** | The site blocked the crawler or had no readable text — try another URL or paste text instead |
| Widget shows nothing on the demo page | Rebuild the widget (`npm run build` in `widget/`), confirm the backend is running, and check the bot key |
| Chat answers "temporarily unavailable" | Monthly message quota reached — see Billing |
| Upgrade doesn't change the plan | Webhook not running — start `stripe listen` and check `STRIPE_WEBHOOK_SECRET` |
