# GrainCRM

A full-featured CRM system built for grain merchandising companies — Corn, Soybeans, and Rice.

## Features

- **Contacts** — full CRUD, search/filter, status tracking, company info, detail view
- **Commodity Lists** — separate lists for Corn, Soybeans, and Rice with interest levels and estimated volumes; contacts can be added/removed freely
- **Deals** — grain contracts with bushel quantity, price/bushel, computed total value, and status
- **Interactions** — log calls, emails, meetings, and notes per contact
- **Analytics** — per-commodity dashboards with charts (monthly volume, value, deal counts, pie breakdowns)
- **Dashboard** — company-wide summary with recent contacts and deals

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Icons | Lucide React |

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string
```

### 3. Run migrations

```bash
npm run db:migrate
```

### 4. (Optional) Seed demo data

```bash
npm run db:seed
```

### 5. Start dev server

```bash
npm run dev
# Visit http://localhost:3000
```

---

## Deploy to Railway

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/grain-crm.git
git push -u origin main
```

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your `grain-crm` repository

### Step 3 — Add PostgreSQL

Click **+ New** → **Database** → **Add PostgreSQL**. Railway automatically injects `DATABASE_URL`.

### Step 4 — Deploy

Railway detects the `railway.toml` and automatically:
1. Installs dependencies
2. Generates Prisma client & builds Next.js
3. On start: runs `prisma migrate deploy` then `next start`

Your app is live at the Railway-provided domain.

### Step 5 — (Optional) Seed demo data

Via Railway shell or Railway CLI:

```bash
npm run db:seed
```

---

## Database Schema

```
Contact          — name, email, phone, company, title, address, status
CommodityContact — links Contact to Corn/Soybeans/Rice with interest level & estimated volume
Interaction      — call/email/meeting/note logs per contact
Deal             — grain contracts: quantity, price/bushel, total value, status, date
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |

---

## Old Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
