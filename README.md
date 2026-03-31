# Full Stack Challenge: Interactive Product Analytics Dashboard

## Overview

This repository implements a **full‑stack product analytics dashboard**. Product managers can explore how features are used through interactive charts and advanced filtering.  
The twist is that the dashboard **visualizes its own usage**: every time a user changes a filter or clicks a chart, that interaction is tracked and fed back into the analytics.

The stack is:
- **Frontend**: React 18 + Vite + TypeScript, Tailwind/shadcn‑ui, Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Auth**: Supabase email/password auth with JWT
- **Data Storage**: Supabase Postgres tables `profiles` (user metadata) and `feature_clicks` (tracked events)

---

## Features vs. Requirements Mapping

- **Authentication**
  - Email/password login screen built with Supabase Auth.
  - Filters are persisted in cookies so they survive browser refreshes (`startDate`, `endDate`, `age`, `gender`).

- **Filters**
  - **Date range picker**: calendar with presets (Today, Yesterday, Last 7 Days, This Month, Custom Range).
  - **Age filter**: `<18`, `18-40`, `>40`, plus “All”.
  - **Gender filter**: `Male`, `Female`, `Other`, plus “All`.

- **Bar chart – Feature Usage**
  - X‑axis: `feature_name` (e.g. `date_filter`, `gender_filter`, `bar_chart_click`).
  - Y‑axis: total click count for each feature.
  - Clicking a bar selects that feature and triggers fetch of the time series.

- **Line chart – Time Trend**
  - X‑axis: date (grouped by day).
  - Y‑axis: click count for the **selected feature**.
  - If no feature is selected, the line chart is empty.

- **Self‑tracking**
  - Every relevant UI interaction calls a Supabase Edge Function to **track the event**, e.g.:
    - Changing any filter (`startDate`, `endDate`, `age`, `gender`).
    - Clicking a bar in the feature usage chart.
    - Refreshing the dashboard.

- **Data seeding**
  - Supabase Edge Function `seed` creates demo users + 100 random feature click events over the last 30 days.
  - The “Seed Data” button in the UI calls this function so the dashboard is never empty on first run.

---

## Architecture

### Data Model (Postgres via Supabase)

- **Users / Profiles**
  - Supabase Auth manages core `auth.users`.
  - A `profiles` table extends each user with:
    - `user_id` (UUID, PK/FK to `auth.users`)
    - `username` (text)
    - `age` (integer)
    - `gender` (text: `Male`, `Female`, `Other`)

- **Feature Clicks**
  - Table `feature_clicks`:
    - `id` (PK)
    - `user_id` (FK → `auth.users`)
    - `feature_name` (text) — e.g. `date_filter`, `gender_filter`, `age_filter`, `bar_chart_click`, `line_chart_hover`, `dashboard_refresh`
    - `clicked_at` (timestamptz)

This matches the challenge’s **User** and **Feature Clicks** models, implemented using Supabase’s auth schema plus extra tables.

### Backend API (Supabase Edge Functions)

Instead of a custom Node server, backend endpoints are implemented as **Supabase Edge Functions**:

- `track` 
  - `POST /functions/v1/track`
  - Authenticated via the Supabase JWT from the frontend.
  - Persists a new row in `feature_clicks` with the current user and `feature_name`.

- `analytics`
  - `GET /functions/v1/analytics`
  - Authenticated via `Authorization: Bearer <access_token>`.
  - Query params:
    - `start_date`, `end_date` (ISO strings)
    - `age` (`all`, `<18`, `18-40`, `>40`)
    - `gender` (`all`, `Male`, `Female`, `Other`)
    - `feature_name` (optional; when provided, line chart is computed)
  - Returns:
    - `barChartData`: aggregated total clicks per `feature_name`.
    - `lineChartData`: aggregated clicks per day for the selected feature (if `feature_name` is given).

- `seed`
  - `POST /functions/v1/seed`
  - Uses Supabase **service role** key.
  - Creates ~10 demo users and ~100 click events spread across 30 days.

These functions satisfy the challenge’s requirements for `/track` and `/analytics` API behavior, mapped onto Supabase URLs.

### Frontend

Key pieces:

- `src/pages/AuthPage.tsx` – login form using Supabase auth (email/password).
- `src/pages/Dashboard.tsx` – main dashboard layout:
  - Header with “Seed Data” and “Refresh” buttons and logout.
  - Loads/saves filters from cookies (`loadFilters` / `saveFilters`).
  - Calls `fetchAnalytics` to update bar and line chart data.
- `src/components/FilterBar.tsx`
  - Date range picker with presets + Apply/Cancel.
  - Age and Gender dropdowns.
  - On every change, updates filters, persists them in cookies, and tracks the interaction.
- `src/components/FeatureBarChart.tsx`
  - Recharts bar chart of total clicks per feature.
  - Click handler selects a feature and triggers a new analytics fetch.
- `src/components/TrendLineChart.tsx`
  - Recharts line chart showing daily counts for the selected feature.

---

## Running the Project Locally

### Prerequisites

- Node.js 18+ and npm (or pnpm/yarn).
- A Supabase project (free tier is fine).

### 1. Clone and install

```bash
git clone <your-repo-url>
cd feature-insights-main
npm install
```

### 2. Configure Supabase & environment

Create a Supabase project and:

1. **Create tables** in the SQL editor (or adapt from below):
   - `profiles` with columns: `user_id uuid primary key references auth.users(id)`, `username text`, `age int`, `gender text`.
   - `feature_clicks` with columns: `id bigserial primary key`, `user_id uuid references auth.users(id)`, `feature_name text`, `clicked_at timestamptz`.
2. **Enable Edge Functions** and deploy the `track`, `analytics`, and `seed` functions (copy from `supabase/functions/*`).

Then create `.env` in the project root 

```bash
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173
```

> In Supabase dashboard, set your redirect URL to `http://localhost:5173` for email/password login.

### 3. Run the dev server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.  
Log in with a seeded demo user (see next section) or create a new one in the Supabase auth UI.

---

## Seeding Data

The project includes a Supabase Edge Function `seed` that:
- Creates ~10 demo users (`demo1@analytics.test`, …) with password `password123`.
- Inserts ~100 random feature click records over the last 30 days across multiple features and users.

### Option A – From the dashboard UI

1. Start the dev server and log in.
2. Click the **“Seed Data”** button in the top-right of the dashboard header.
3. Wait for the toast confirmation showing how many clicks/users were created.

### Option B – Call the function directly

You can also invoke the function with a tool like curl or from the Supabase SQL/Functions panel:

```bash
curl -X POST "https://<your-supabase-project>.supabase.co/functions/v1/seed" \
  -H "Authorization: Bearer <service-role-or-access-token>"
```

After seeding, reload the dashboard and you should see non‑empty bar and line charts.

---

## How Tracking Works

- The frontend uses a small helper `trackEvent(featureName: string)` (see `src/lib/analytics.ts`).
- Each time the user interacts with a key control, the app calls `trackEvent` with a feature name such as:
  - `date_filter`, `age_filter`, `gender_filter`
  - `bar_chart_click` when clicking a bar
  - `dashboard_refresh` on manual refresh
- The `track` Edge Function:
  - Authenticates the user via Supabase.
  - Writes a new record into `feature_clicks` with the current timestamp.
- The `analytics` Edge Function:
  - Reads all matching `feature_clicks` joined with `profiles`.
  - Aggregates into:
    - **Bar chart**: counts per `feature_name`.
    - **Line chart**: counts per day for a single `feature_name` (if selected).

Filters are also stored in a cookie so that on refresh, the dashboard reloads with the same **date range, age, and gender**.

---

Basic steps:

1. Run `npm run build` and deploy the `dist` folder to your hosting provider.
2. Configure environment variables on the host:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_REDIRECT_URL`
3. Make sure your Supabase **Allowed Redirect URLs** and **CORS** settings include your production domain.

> - Live demo: "https://product-analytics-dashboard-iota.vercel.app/"

---

## Scaling Essay: Handling 1 Million Writes per Minute

If this dashboard needed to handle **1,000,000 write events per minute** (~16.7k writes/sec), I would change the backend architecture as follows:

- **Decouple writes from the main database**
  - Instead of writing each click directly to Postgres, the `track` function would enqueue events into a **durable, horizontally scalable log** such as Kafka, Kinesis, or a managed message queue (e.g. Google Pub/Sub).
  - The Edge Function remains lightweight: validate + enqueue → respond.

- **Stream ingestion workers**
  - A fleet of stateless consumers would read from the queue and **batch insert** events into storage:
    - Either:
      - A partitioned Postgres table (time‑partitioned, with write‑optimized indexes), or
      - A separate **analytics warehouse** (e.g. BigQuery, ClickHouse, or Redshift) optimized for large aggregations.

- **Pre‑aggregation and rollups**
  - Introduce **materialized views** or rollup tables that continuously aggregate:
    - Counts per `feature_name` per time bucket (minute/hour/day).
    - Counts per age/gender group.
  - The `/analytics` endpoint would query these rollup tables rather than raw click rows, making reads fast and predictable even under heavy write load.

- **Sharding and partitioning**
  - Partition `feature_clicks` by time (e.g. monthly) and, if necessary, by feature or tenant.
  - This keeps indexes manageable and allows hot partitions to live on faster storage.

- **Caching layer**
  - For dashboards that repeatedly query the same ranges (e.g. “Last 7 Days”), use a cache such as Redis or CDN‑backed responses to avoid recomputing identical aggregations.

Overall, the key change is to **treat writes as an event stream**, using a queue + workers + rollups, and have the dashboard read from **pre‑aggregated, analytics‑friendly storage** instead of the raw OLTP table. This architecture can scale orders of magnitude beyond 1M writes per minute while keeping the dashboard responsive.

