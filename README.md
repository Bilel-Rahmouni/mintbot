# MintBot

A website toolkit SaaS: clients train a chatbot on their own website or docs and collect form submissions — both embedded with a script tag — and pay via Stripe.

- **[docs/SETUP.md](docs/SETUP.md)** — full owner checklist: prerequisites, env vars, Stripe, production
- **[docs/EMBEDDING.md](docs/EMBEDDING.md)** — customer-facing guide for adding the chat widget and forms to a website

## Apps

| Folder | What it is | Runs on |
| --- | --- | --- |
| `backend/` | Express + TypeScript API, Prisma, Postgres + pgvector, OpenAI, Stripe, IP geolocation | http://localhost:4000 |
| `dashboard/` | React client dashboard (auth, bots, forms + charts/map insights, billing) | http://localhost:5173 |
| `widget/` | Embeddable chat widget + form widget (Preact, Shadow DOM) | served by the backend at `/widget.js` and `/form.js` |

## Setup

### 1. Postgres with pgvector

Easiest with Docker:

```bash
docker run -d --name mintbot-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mintbot \
  -p 5432:5432 \
  pgvector/pgvector:pg17
```

(Or use a Supabase/Neon connection string — both ship with pgvector.)

### 2. Backend

```bash
cd backend
cp .env.example .env    # then fill in OPENAI_API_KEY (Stripe keys optional to start)
npm install
npx prisma migrate dev --name init
npm run dev
```

### 3. Widget

```bash
cd widget
npm install
npm run build           # outputs dist/widget.js and dist/form.js, served by the backend
```

### 4. Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:5173, create an account, create a bot, add a source (website URL or pasted text), then grab the embed snippet from the bot's Embed tab.

## Embedding on a client site

Chat widget (floating bubble):

```html
<script
  src="http://localhost:4000/widget.js"
  data-bot-id="mb_xxxxxxxxxxxx"
  defer
></script>
```

Form (renders inline where the div is placed):

```html
<div data-mintbot-form="mf_xxxxxxxxxxxx"></div>
<script src="http://localhost:4000/form.js" defer></script>
```

`widget/demo/index.html` is a ready-made test page — put real keys in it and open it in a browser. Form submissions appear in the dashboard under the form's Submissions and Insights tabs (charts + map; location comes from IP geolocation via ipwho.is, which won't resolve for localhost traffic).

## Stripe (optional until you sell plans)

1. Create two recurring prices in the Stripe dashboard (Starter $19/mo, Pro $49/mo) and put their IDs in `backend/.env` as `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO`, plus your `STRIPE_SECRET_KEY`.
2. Forward webhooks locally:

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

3. Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart the backend.

Without Stripe configured, everything works on the Free plan.

## Plans

| Plan | Price | Bots | Forms | Chat messages / mo | Form submissions / mo | Crawled pages / source |
| --- | --- | --- | --- | --- | --- | --- |
| Free | $0 | 1 | 1 | 50 | 50 | 20 |
| Starter | $19 | 3 | 3 | 2,000 | 1,000 | 200 |
| Pro | $49 | 10 | 10 | 10,000 | 5,000 | 1,000 |

Limits live in `backend/src/config/plans.ts`.
