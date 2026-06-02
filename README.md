# STRATUM.ai — IELTS Writing

AI-powered IELTS Writing practice: Task 1 & Task 2 analysis (GPT-4o), band-style feedback, study plan analytics, topic/template bank, and optional email practice reminders.

**Repository:** [github.com/Shahboz1997/startum-writing-ai](https://github.com/Shahboz1997/startum-writing-ai)

## Stack

| Layer | Technology |
|--------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router), React 19 |
| Styling | Tailwind CSS 4, Framer Motion, `@wrksz/themes` |
| Auth | [Auth.js / NextAuth v5](https://authjs.dev) (credentials + optional Google) |
| Database | PostgreSQL (e.g. Supabase) via [Prisma 7](https://www.prisma.io) + `@prisma/adapter-pg` |
| AI | OpenAI API (`gpt-4o` / `gpt-4o-mini`) |
| Deploy | [Vercel](https://vercel.com) (recommended), PWA via `@ducanh2912/next-pwa` |
| Tests | ESLint, Playwright E2E, GitHub Actions CI |

Static writing bank data lives in `data/topics.json` and `data/templates.json` and is exposed through **Next.js API routes only** (no separate bank server).

## Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase Session + Transaction pooler URIs work well)
- OpenAI API key with access to the models above

## Local setup

```bash
git clone https://github.com/Shahboz1997/startum-writing-ai.git
cd startum-writing-ai
npm ci

# Required: copy the committed template ( .env* is gitignored except .env.example )
cp .env.example .env.local          # Windows: copy .env.example .env.local

# Edit .env.local — fill at least:
#   DATABASE_URL, DIRECT_URL, AUTH_SECRET, OPENAI_API_KEY, NEXTAUTH_URL
# Optional for full features: CRON_SECRET, EMAIL_USER, EMAIL_PASS, ADMIN_EMAILS

npx prisma migrate deploy
npm run dev
```

All variables are documented inline in [`.env.example`](.env.example).

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run dev:clean` | Clear `.next` and start dev |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright (`e2e/login-check-history.spec.js`) |
| `npx prisma migrate deploy` | Apply migrations |
| `npx prisma studio` | Browse DB (optional) |

E2E variables are documented in `.env.e2e.example`. With `E2E_MOCK_OPENAI=1`, `/api/check` returns a deterministic mock (no OpenAI call).

## Environment variables

The repo ships **[`.env.example`](.env.example)** (tracked in git). Private files like `.env.local` stay ignored via `.env*` + `!.env.example` in [`.gitignore`](.gitignore).

Summary:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | App DB (pooler, port 6543 for Supabase Transaction mode) |
| `DIRECT_URL` | Yes* | Prisma migrations (`prisma migrate`) |
| `AUTH_SECRET` | Prod | Session/JWT signing (or `NEXTAUTH_SECRET`, not both) |
| `NEXTAUTH_URL` | Prod | Site origin, e.g. `http://127.0.0.1:3000` |
| `OPENAI_API_KEY` | Yes** | Essay check & AI features |
| `CRON_SECRET` | Cron | Bearer token for `/api/cron/*` |
| `EMAIL_USER` / `EMAIL_PASS` | Reminders | SMTP for practice emails |
| `BANK_ADMIN_KEY` | Prod POST bank | Header `x-bank-admin-key` for `POST /api/templates` |
| `AUTH_GOOGLE_*` | Optional | Google sign-in |

\* `prisma.config.js` falls back to `DATABASE_URL` if `DIRECT_URL` is unset.  
\** Not required when `E2E_MOCK_OPENAI=1` for Playwright only.

## Writing bank API

All bank endpoints are **same-origin Next routes** (see `src/lib/bankCore.js`):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/topics` | Filter exam topics (`type`, `subtype`, `dateFrom`, `dateTo`, `q`) |
| `GET` | `/api/bank/topic/:id` | Topic detail for `/topics/:id` |
| `GET` | `/api/templates` | Filter writing templates |
| `GET` | `/api/templates/:id` | Single template |
| `POST` | `/api/templates` | Add template (admin key in production) |

Client code uses `bankApiUrl()` from `src/lib/bankClient.js` (relative `/api/...` paths).

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Set environment variables from `.env.example` (Production + Preview as needed).
3. Build command: `npm run build` (default). Install runs `prisma generate` via `postinstall`.
4. Run migrations against production once:  
   `npx prisma migrate deploy` (locally with production `DIRECT_URL`, or CI job).
5. Set `NEXTAUTH_URL` / `AUTH_URL` to your production origin (no path suffix).
6. Add Google OAuth redirect URIs for that origin if using Google login.

### PWA

PWA is wired in `next.config.mjs` (`@ducanh2912/next-pwa`). It is **disabled in development** and enabled for production builds. Service worker rules exclude `/api/auth/*` from caching so OAuth is not broken.

## Cron — practice reminders

Schedule is defined in [`vercel.json`](vercel.json):

```json
{ "path": "/api/cron/practice-reminders", "schedule": "0 12 * * *" }
```

- **Endpoint:** `GET /api/cron/practice-reminders`
- **Auth:** `Authorization: Bearer <CRON_SECRET>` (Vercel sends this automatically when `CRON_SECRET` is set in the project).
- **Email:** Requires `EMAIL_USER` and `EMAIL_PASS` (SMTP). Users opt in under Settings.

Manual trigger:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://YOUR_DOMAIN/api/cron/practice-reminders"
```

On Vercel Hobby, cron frequency is limited (typically once per day per job).

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and on pushes to `main` / `master`:

1. **lint** — `npm run lint`
2. **build** — `npm run build` (placeholder DB URL on CI)
3. **test** — `prisma migrate deploy`, E2E user seed, `npm run test:e2e`

Required GitHub Actions secrets for the test job: `DATABASE_URL`, `AUTH_SECRET`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` (optional `DIRECT_URL`).

## User library sync

Logged-in users sync **word list** and **favorite templates** to Postgres (`WordListItem`, `FavoriteTemplate`). On login, `UserLibrarySync` merges localStorage with the server and writes back. Guests keep using localStorage only.

| API | Description |
|-----|-------------|
| `GET/PUT /api/user/word-list` | Vocabulary items (`{ items: [...] }`) |
| `GET/PUT /api/user/favorite-templates` | `{ templateIds: number[] }` |

Apply migration: `npx prisma migrate deploy`

## Project layout (short)

```
src/app/          Next.js routes (pages + /api/*)
src/components/   UI (writer, dashboard, bank, auth)
src/lib/          Shared logic (prisma, ielts check, bank, credits)
data/             topics.json, templates.json
prisma/           schema + migrations
e2e/              Playwright specs
```

## License

Private project (`"private": true` in `package.json`). All rights reserved unless stated otherwise by the repository owner.
