# Mumbai Rent Intelligence Platform

A map-first, broker-free rental and flatmate-matching platform optimised for **Mumbai**. Drop a pin,
see real rent prices, filter by budget / BHK / furnishing, and contact owners directly on WhatsApp
— no middlemen.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS**, **Mapbox GL JS** for maps, and
**Supabase (Postgres + PostGIS + Storage + Auth)** for the backend.

> The app ships with sensible **demo-mode fallbacks**: if Supabase and/or Mapbox env vars are
> missing, the UI still renders and browses a curated set of sample Mumbai listings so you (or a
> reviewer) can experience the product before wiring up infra.

---

## ✨ Features

### MVP (live)

- **Interactive Mumbai map** with clustered rent-price pins, hover / click preview, and a synced
  list of nearby listings.
- **Filters** — budget range, BHK type, furnishing, and search radius. Listings and map update in
  real time as you pan or change filters.
- **Add a listing** flow — pin location on a map, fill a simple form (title, description, rent,
  deposit, BHK, furnishing, society tags, WhatsApp), and publish instantly.
- **Listing detail page** — location map, full details, society tags, a contextual price verdict
  ("in line with local average" / "~X% above" / etc.), similar listings nearby, and a **"Chat on
  WhatsApp"** deep link.
- **Matching** — score nearby listings against your budget, location, BHK, furnishing and society
  preferences. Results ranked 0–100 with reasons.
- **Rent Insight tool** — enter your current rent and location, get average / median / quartiles
  for your area, and a verdict ("overpaying" / "fair" / "underpaying"). Users can also contribute
  anonymous rent sightings to improve the dataset.

### Phase 2 stubs / scaffolding

- **Commute intelligence** — `/api/commute` proxies the Mapbox Isochrone API and returns 30 / 45 /
  60-minute polygons. UI surfacing is a follow-up.
- **Society intelligence** — tags (`bachelor_friendly`, `pet_friendly`, `vegetarian_only`, …) are
  already stored per-listing and factored into matching.
- **Verification** — `users.is_verified` column is live; phone-OTP flow is intended to be added via
  Supabase Auth.
- **Rich media** — `listings.images` is a `text[]` of Supabase Storage URLs; upload UI is a
  follow-up.

---

## 🧱 Architecture

```
src/
├─ app/
│  ├─ layout.tsx              # Root layout, demo-mode banner, nav
│  ├─ page.tsx                # Map explorer (main screen)
│  ├─ listings/new/page.tsx   # Add listing flow
│  ├─ listings/[id]/page.tsx  # Listing detail
│  ├─ insights/page.tsx       # Rent check (viral feature)
│  ├─ match/page.tsx          # Matching
│  └─ api/
│     ├─ listings/route.ts            # GET browse, POST create
│     ├─ listings/nearby/route.ts     # GET radius search
│     ├─ insights/route.ts            # GET aggregate + verdict, POST contribute
│     ├─ match/route.ts               # POST ranked matches
│     └─ commute/route.ts             # GET Mapbox isochrone proxy
├─ components/
│  ├─ Navbar.tsx
│  ├─ FiltersPanel.tsx
│  ├─ ListingCard.tsx
│  ├─ map/
│  │  ├─ MapExplorer.tsx      # Main map + sidebar
│  │  ├─ LocationPicker.tsx   # Pin-drop map for forms
│  │  └─ ListingMapPreview.tsx
│  └─ forms/
│     ├─ AddListingForm.tsx
│     ├─ RentInsightForm.tsx
│     └─ MatchForm.tsx
└─ lib/
   ├─ env.ts                  # Centralised env + demo-mode flags
   ├─ types.ts                # Shared domain types
   ├─ geo.ts                  # Haversine + Mumbai bounds helpers
   ├─ rate-limit.ts           # In-memory IP rate limiter
   ├─ validation.ts           # Request-body validators (no extra deps)
   ├─ format.ts               # ₹ and distance formatting
   ├─ mock-data.ts            # Demo listings + rent points
   ├─ listings-service.ts     # Data layer: Supabase preferred, mocks as fallback
   └─ supabase/{client,admin}.ts
supabase/
└─ migrations/0001_init.sql   # PostGIS schema + RLS + RPCs
```

**Separation of concerns**

- UI components are dumb; they never call Supabase directly.
- API route handlers are thin; they delegate to `lib/listings-service.ts`.
- `listings-service.ts` is the single gate to the database. It talks to Supabase when configured
  and silently falls back to the in-memory mocks otherwise, so every UI path renders in demo mode.

---

## 🚀 Getting started

### 1. Prerequisites

- **Node.js** 20 or newer (Node 22 works; an `engines` warning from one dev dependency is benign).
- A **Mapbox** account — [create a public access token](https://account.mapbox.com/access-tokens/).
- A **Supabase** project — [create one here](https://app.supabase.com/) (Free tier is plenty for
  MVP).

### 2. Install

```bash
git clone https://github.com/Sahilvvi/flatx.git
cd flatx
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox dashboard → Account → Tokens (a `pk.*` token is fine) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API → service_role (server-only) |

Optional (safe defaults are applied):

- `NEXT_PUBLIC_DEFAULT_LAT` / `NEXT_PUBLIC_DEFAULT_LNG` / `NEXT_PUBLIC_DEFAULT_ZOOM` — map centre
- `RATE_LIMIT_WINDOW` / `RATE_LIMIT_MAX` — write-endpoint rate limits

> **Tip:** If you just want to poke around the UI, you can skip Supabase entirely and only set the
> Mapbox token. The app will boot in demo mode with sample Mumbai listings.

### 4. Initialise the Supabase schema

In the Supabase dashboard, open the SQL editor and run
[`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). It will:

- Enable the `postgis` and `pgcrypto` extensions.
- Create `users`, `listings`, `rent_data_points`, and `matches` tables, each with a generated
  `geom geography(point, 4326)` column and a GIST index for fast radius queries.
- Create two helper RPCs: `listings_nearby(...)` and `rent_insight(...)` that back the map and
  insight pages.
- Enable RLS on all tables with a public-read policy for listings and rent data (writes go through
  API routes using the service-role key).

Prefer the CLI? With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 5. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

### 6. Quality gates

```bash
npm run lint       # ESLint (Next.js config)
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

---

## 🚀 Deployment

### Frontend → Vercel

1. Push this repo to GitHub.
2. Import it on [Vercel](https://vercel.com/new).
3. Add the environment variables from `.env.example` in **Project Settings → Environment
   Variables**. Remember to mark `SUPABASE_SERVICE_ROLE_KEY` as **not** exposed to the browser
   (Vercel defaults to Server only — keep it that way).
4. Deploy. The default `next build` works out of the box.

### Backend → Supabase

No separate backend to deploy — Supabase hosts Postgres, PostGIS, Storage and Auth. Running
`0001_init.sql` once per project is all the setup needed.

---

## 🔒 Security notes

- All write endpoints validate input (type, range, Mumbai bounding box) and apply a simple
  IP-scoped in-memory rate limit. Swap for Upstash / Redis before scaling horizontally.
- The service-role key is **only** imported from `src/lib/supabase/admin.ts` and used inside API
  routes (Node runtime). It is never bundled into client code.
- RLS is enabled on every table. Reads of listings / rent data are public; writes currently go
  through API routes under the service role. Add `auth.uid()`-scoped insert policies when
  client-side writes are enabled.
- Inputs are clamped to the Mumbai metropolitan bounding box to deter random spam from other
  regions.

---

## 📈 Where to go next

- Wire the commute-isochrone API into the Map Explorer (overlay 30 / 45 / 60-min polygons around a
  user-entered office location).
- Image upload via Supabase Storage on the Add Listing form.
- Phone OTP verification (Supabase Auth) + verified badge surfaced in the UI.
- Richer matching — shared lifestyle preferences (sleep schedule, food), flatmate ↔ flatmate
  mutual scoring.
- Swap the in-memory rate limiter for Upstash Redis when deploying to multiple serverless instances.
- Persist a `matches` row per user-listing pair so matches can be favourited / contacted / tracked.

---

## 📝 License

MIT — use, fork, ship.
