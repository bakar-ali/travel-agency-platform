# Tour Management & Booking Platform

A full-stack tour agency platform with **PDF-driven catalog ingestion**, a **public e-commerce showcase**, and an **internal calendar operations dashboard**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Calendar | FullCalendar (day / week / month views) |
| Database | SQLite (local) via Prisma ORM — swap to PostgreSQL for production |
| PDF Parsing | `pdf-parse` |
| Icons | Lucide React |

## Docker Deployment (Server)

On your server after pulling from GitHub:

```bash
git clone https://github.com/bakar-ali/travel-agency-platform.git
cd travel-agency-platform

# Copy and edit environment variables
cp .env.example .env
nano .env   # set DATABASE_URL, INSTAGRAM URLs

# Build and run
docker compose up -d --build
```

The container automatically runs `prisma db push` and seeds tours from `data/tours.json` on startup.

App will be available at **http://your-server:3000**

### Dokploy deployment

1. Set these environment variables in the Dokploy UI:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_INSTAGRAM_URL`
   - `INSTAGRAM_URL`
2. In domain settings, route traffic to **container port `3000`** (internal port).
3. Redeploy — the compose file uses `expose` only, so it won't conflict with other apps bound to host port 3000.

### Required `.env` on server

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXT_PUBLIC_INSTAGRAM_URL="https://www.instagram.com/yourpage"
INSTAGRAM_URL="https://www.instagram.com/yourpage"
```

---

```bash
# Install dependencies
npm install

# Initialize database
npm run db:push

# Parse local PDFs → export JSON (PDFs stay on your machine only)
npm run db:export

# Seed database from data/tours.json (used locally and on server)
npm run db:ingest

# Seed demo bookings for calendar dashboard
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public catalog and [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for operations.

## Environment Variables

Copy `.env` and configure:

```env
DATABASE_URL="file:./dev.db"           # SQLite (local)
# DATABASE_URL="postgresql://..."      # PostgreSQL (production)
NEXT_PUBLIC_INSTAGRAM_URL="https://www.instagram.com/yourpage"
INSTAGRAM_URL="https://www.instagram.com/yourpage"
```

---

## 1. PDF Parsing & Ingestion Strategy

**PDFs are local only** — they live in `/tours/` on your dev machine, are gitignored, and are never deployed to GitHub or the server.

### Workflow

1. Place brochure PDFs in `/tours/` (local only)
2. Run `npm run db:export` — parses PDFs and writes `data/tours.json`
3. Commit `data/tours.json` to Git — this is what gets deployed
4. Server runs `npm run db:ingest` (seeds from JSON, no PDFs needed)

### Library: `pdf-parse` (dev dependency)

### Script Structure

```
scripts/
├── parse-tour-pdf.ts       # Core PDF parser
├── export-tours-json.ts    # Local: PDFs → data/tours.json
├── seed-tours-from-json.ts # Seed DB from JSON (npm run db:ingest)
├── seed-tours.mjs          # Plain Node seed (Docker startup)
└── ingest-pdfs.ts          # Local dev: PDFs → DB directly
data/
└── tours.json              # Committed parsed tour catalog
```

### Extraction Pipeline

| Field | Source |
|-------|--------|
| Title, Duration, Destination | Filename + `PLAN FOR XX DAYS` header |
| Tour Type | Filename (`Group`, `Private`, `Custom`) |
| Places / Highlights | `Places Covered` section |
| Itinerary | Regex on `Day XX:` blocks |
| Inclusions | `Services included` block |
| Exclusions | `Services Not Include` block |
| Pricing | `Package Price:` PKR amounts |

### Upsert Flow

```
/tours/*.pdf → parse-tour-pdf.ts → ingest-pdfs.ts → Prisma → SQLite/PostgreSQL
```

Run on every deploy or when brochures update:

```bash
npm run db:ingest
```

---

## 2. Database Schema

```prisma
Tour          — catalog listings (title, destination, itinerary JSON, etc.)
PricingTier   — GROUP / PRIVATE / CUSTOM pricing per tour
Customer      — contact details
Booking       — scheduled departures linked to tour + customer
```

### Enums

- **TourType**: `GROUP` | `PRIVATE` | `CUSTOM`
- **PaymentStatus**: `PAID` | `PARTIAL` | `PENDING`

### PostgreSQL Migration

Change `provider` in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then: `npm run db:push` or use `prisma migrate dev`.

---

## 3. UI/UX Layout

### Public Showcase (`/`)

```
┌─────────────────────────────────────────────┐
│  Header: Logo | Tours | Operations | CTA    │
├─────────────────────────────────────────────┤
│  HERO: Gradient + headline + Instagram CTA  │
├─────────────────────────────────────────────┤
│  Trust badges (Licensed, Guides, Destinations)│
├─────────────────────────────────────────────┤
│  TOUR GRID (3-col responsive cards)         │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ img  │ │ img  │ │ img  │                │
│  │ title│ │ title│ │ title│                │
│  │ price│ │ price│ │ price│                │
│  └──────┘ └──────┘ └──────┘                │
└─────────────────────────────────────────────┘
```

### Tour Detail (`/tours/[slug]`)

```
┌─────────────────────────────────────────────┐
│  Full-width hero image + title badges       │
├──────────────────────┬──────────────────────┤
│  Overview            │  PRICING SIDEBAR     │
│  Places covered      │  Group / Private /   │
│  Day-by-day itinerary│  Custom tiers        │
│  Inclusions │ Excl.  │  [Book Now → IG]     │
└──────────────────────┴──────────────────────┘
```

### Operations Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────┐
│  Stats: Bookings | Paid | Pending | Revenue │
├─────────────────────────────────────────────┤
│  Filters: Search | Type | Payment | Dest.   │
├─────────────────────────────────────────────┤
│  FULLCALENDAR (Month / Week / Day toggle)   │
│  Color = payment status, border = tour type │
├─────────────────────────────────────────────┤
│  MODAL on click: tour, customer, financial  │
└─────────────────────────────────────────────┘
```

### Instagram CTA

All **Book Now** and **Inquire** buttons redirect to Instagram with a pre-filled inquiry message containing the tour name.

---

## 4. Development Roadmap

| Phase | Task | Status |
|-------|------|--------|
| 1 | Project scaffold (Next.js + Tailwind + Prisma) | ✅ |
| 2 | PDF parser + `/tours` ingestion script | ✅ |
| 3 | Database schema + seed data | ✅ |
| 4 | Public catalog + tour detail pages | ✅ |
| 5 | Calendar dashboard + booking modal | ✅ |
| 6 | Filters, search, API routes | ✅ |
| 7 | PostgreSQL / Supabase production deploy | 🔲 |
| 8 | Auth for dashboard (NextAuth / Clerk) | 🔲 |
| 9 | Real booking form → DB (replace demo seed) | 🔲 |
| 10 | CI: auto-ingest PDFs on brochure update | 🔲 |

---

## Project Structure

```
c:\travel\
├── tours/                    # Source PDF brochures (16 files)
├── scripts/
│   ├── parse-tour-pdf.ts
│   └── ingest-pdfs.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── app/
    │   ├── page.tsx          # Public catalog
    │   ├── tours/[slug]/     # Tour detail
    │   ├── dashboard/        # Operations calendar
    │   └── api/              # REST endpoints
    ├── components/
    │   ├── tours/
    │   ├── dashboard/
    │   └── layout/
    └── lib/
        ├── db.ts
        ├── prisma.ts
        └── instagram.ts
```

## License

Memorable Days Tourism (SMC-Private) Limited — Gov. License #0303371
