# NeedBridge - Detailed System README

NeedBridge is a disaster-response coordination platform. It connects:
- people/teams reporting emergency needs,
- coordinators triaging and assigning work,
- volunteers fulfilling those assignments,
- and an external deployed AI matching service that recommends the best volunteer candidates.

This README is intentionally detailed so future AI agents (and humans) can reason about architecture, data flow, and integration points without re-discovering context.

## 1) Repository Layout and Responsibilities

This repo currently has **two app surfaces**:

- `frontend/` - actively used full-stack app shell (React + Vite + serverless Express adapter for Netlify).
- `backend/` - separate Node/Express API project containing core need/assignment business logic and Supabase integration helpers.

At the time of writing, most user-facing UI logic and deployed matching integration are wired from `frontend/`.

## 2) High-Level Architecture

### Frontend application (`frontend/`)
- React SPA for coordinator and volunteer workflows.
- Uses Supabase JS client directly for core CRUD (needs, volunteers, assignments).
- Calls deployed matching service using authenticated JWT token from Supabase session.
- Includes Netlify serverless function wrapper for Express endpoints in `frontend/server`.

### Backend service (`backend/`)
- Express API with route/controller pattern.
- Implements urgency score calculation and server-side assignment creation logic.
- Intended to centralize logic around:
  - need creation + urgency scoring,
  - querying active needs,
  - creating assignments with duplicate protection + rollback.

### Data Layer
- Supabase is the shared persistence layer.
- Main tables/views referenced by code:
  - `needs`
  - `volunteers`
  - `assignments`
  - `organizations`
  - `outcomes`
  - `need_history`
  - `v_open_needs` (view used by backend active-need query)

### Matching Layer (deployed external service)
- A deployed matching API (configured via `VITE_MATCHING_URL`) returns ranked volunteer matches for a given need.
- Frontend sends Supabase JWT in `Authorization: Bearer <token>` header.

## 3) Detailed File/Module Guide

## Root
- `README.md` (this file): architecture and integration map.

## `frontend/` detailed map

### Runtime + build configuration
- `frontend/package.json`
  - `dev`: starts Vite dev server.
  - `build`: builds client + server bundle.
  - `start`: runs built server output.
- `frontend/netlify.toml`
  - Build output at `dist/spa`.
  - Redirects `/api/*` to Netlify function `/.netlify/functions/api/:splat`.
- `frontend/netlify/functions/api.ts`
  - Serverless handler adapter using `serverless-http`.
  - Wraps `createServer()` from `frontend/server/index.ts`.
- `frontend/server/index.ts`
  - Minimal Express server with sample routes (`/api/ping`, `/api/demo`).
  - Can host backend-only secure operations when needed.

### App shell and route entry points
- `frontend/client/App.tsx`
  - Router root.
  - Public routes:
    - `/` => main role-driven app shell (`Index`).
    - `/report` => public emergency intake form (`ReportEmergency`).
- `frontend/client/pages/Index.tsx`
  - In-memory role selector + pseudo-login switch for:
    - coordinator dashboard
    - volunteer dashboard

### Coordinator experience
- `frontend/client/pages/coordinator/CoordinatorDashboard.tsx`
  - Main coordinator shell with sidebar + topbar.
  - Switches among:
    - `Overview`
    - `NeedsBoard`
    - `Heatmap`
    - `VolunteerMatching`
    - `AssignmentStatus`

- `frontend/client/pages/views/Overview.tsx`
  - KPI/summary widgets (currently mock-heavy).
  - Table of recent needs with quick navigation to matching flow.

- `frontend/client/pages/views/NeedsBoard.tsx`
  - Pulls open needs via `fetchOpenNeeds()`.
  - Supports search/filter/sort.
  - "Run Match" action routes selected need to matching view.

- `frontend/client/pages/views/Heatmap.tsx`
  - Loads open needs and maps points by parsed `need.location`.
  - Visual urgency marker colors.
  - Includes "Run Match" trigger via custom window event.

- `frontend/client/pages/views/VolunteerMatching.tsx`
  - Core match orchestration UI:
    1. Load open needs + volunteer profiles.
    2. Call `runMatch(needId, topK)` to external deployed matching service.
    3. Display ranked volunteers with score + reasons.
    4. On "Assign":
       - `createAssignment(needId, volunteerId)`
       - `updateNeedStatus(needId, "assigned")`

- `frontend/client/pages/views/AssignmentStatus.tsx`
  - Kanban-style assignment state UI (currently local/mock state).

### Public emergency intake
- `frontend/client/pages/public/ReportEmergency.tsx`
  - Form captures title/category/zone/severity/people_affected.
  - Calls `createNeed()` from `frontend/client/lib/api.ts`.
  - On success, UI indicates matching/dispatch pipeline should follow.

### Volunteer experience
- `frontend/client/pages/volunteer/VolunteerDashboard.tsx`
  - Volunteer shell + top navigation + profile/notifications.
- `frontend/client/pages/volunteer/views/*`
  - `VolunteerHome.tsx`, `BrowseNeeds.tsx`, `Notifications.tsx`, etc.
  - Mostly presentation/demo logic right now.

### Frontend data-access layer
- `frontend/client/lib/supabase.ts`
  - Supabase browser client initialization.
  - Uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

- `frontend/client/lib/api.ts`
  - Main client-side API abstraction.
  - Provides:
    - need fetch/create/update
    - volunteer fetch
    - assignment create/update
    - outcomes/history fetch
    - `runMatch()` for deployed matching service.

### AI/model metadata artifacts
- `frontend/client/data/model_state.json`
  - Snapshot describing model pipeline (XGBoost, SGD residual, LambdaRank, Hungarian assignment sample).
  - Useful for explainability/docs/demo, not an executable runtime model in this repo.

- `frontend/client/data/assignments.json`
  - Assignment sample output style from model pipeline.

## `backend/` detailed map

### Entry + routing
- `backend/src/server.js`
  - Express app bootstrapping.
  - Registers:
    - `/api/needs`
    - `/api/assignments`

- `backend/src/routes/needsRoutes.js`
  - `POST /` => create need
  - `GET /active` => fetch active needs

- `backend/src/routes/assignmentsRoutes.js`
  - `POST /` => create assignment

- `backend/src/routes/volunteersRoutes.js`
  - `POST /` => volunteer registration
  - Note: not currently mounted in `server.js`.

### Controllers
- `backend/src/controllers/needsController.js`
  - Computes urgency score with `calculateUrgencyScore`.
  - Inserts need into Supabase.
  - Reads `v_open_needs` view for active needs query.

- `backend/src/controllers/assignmentsController.js`
  - Prevents duplicate assignments for same `(need_id, volunteer_id)`.
  - Inserts assignment with `status: pending`.
  - Updates related need to `status: assigned`.
  - Rolls back assignment insert if need status update fails.

- `backend/src/controllers/volunteersController.js`
  - Inserts volunteer record.
  - Contains a Supabase import path that should match actual config module naming.

### Utility + config
- `backend/src/utils/scoring.js`
  - Urgency formula:
    - category-based base score,
    - severity/vulnerability/people impact weighting,
    - integer + cap at 100.

- `backend/src/utils/seed.js`
  - Synthetic data seeder for organizations/volunteers/needs.

- `backend/src/config/supabase.js`
  - Service-role Supabase client for backend operations.

## 4) End-to-End Functional Flows

### Flow A: Public user reports emergency
1. User submits form at `/report`.
2. `ReportEmergency.tsx` calls `createNeed(...)`.
3. `frontend/client/lib/api.ts` writes row to Supabase `needs` table.
4. Need appears in coordinator views (`NeedsBoard`, `Heatmap`, etc.).

### Flow B: Coordinator runs AI matching
1. Coordinator picks open need in `VolunteerMatching`.
2. UI calls `runMatch(needId, topK)`.
3. `runMatch()`:
   - reads Supabase session JWT,
   - sends POST to `${VITE_MATCHING_URL}/match`,
   - includes `Authorization: Bearer <JWT>`,
   - payload: `{ need_id, top_k }`.
4. Matching API returns ranked `matches` (volunteer ID + score + reasons).
5. UI renders suggested volunteers in descending relevance.

### Flow C: Coordinator confirms assignment
1. Coordinator clicks `Assign` on a recommended volunteer.
2. Frontend inserts assignment row into `assignments`.
3. Frontend marks need status as `assigned`.
4. Assignment status appears in workflow views (currently mix of real + mock UIs depending on page).

## 5) Deployed Matching Algorithm Integration (Important)

This is the critical connection requested for future AI-agent context.

### Where the integration lives
- Primary implementation: `frontend/client/lib/api.ts` in `runMatch()`.
- Primary consumer UI: `frontend/client/pages/views/VolunteerMatching.tsx`.

### Connection contract
- **Endpoint**: `${VITE_MATCHING_URL}/match`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <supabase_access_token>`
- **Body**:
  - `need_id`: target need UUID
  - `top_k`: number of recommendations to return

### Auth model
- Frontend reads current Supabase session via `supabase.auth.getSession()`.
- Uses session access token as bearer JWT for matching service.
- If no session token exists, `runMatch()` throws error and match cannot execute.

### Deployment behavior assumptions
- `VITE_MATCHING_URL` should point to deployed environment (for example, Render-hosted API).
- Default fallback is local: `http://localhost:8000`.
- UI already warns that first request may be slow due to cold start.

### Expected response shape (used by UI)
- `matches`: array of objects with:
  - `volunteer_id`
  - `score` (0-1 expected in current rendering logic)
  - `reasons` (string list for explainability)

### Post-match handoff
- The algorithm itself only ranks/recommends.
- Final commitment (assignment + status changes) is done by app layer after human coordinator confirms.

## 6) Environment Variables

### Frontend (`frontend/.env` style)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MATCHING_URL` (deployed matching service base URL)

### Backend (`backend/.env`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `PORT` (optional; defaults to 3000)

## 7) Local Development

### Frontend app
From `frontend/`:

```bash
npm install
npm run dev
```

### Backend app (separate service)
From `backend/`:

```bash
npm install
node src/server.js
```

### Typical local topology
- Frontend UI via Vite (and optionally Netlify emulation if desired).
- Backend API optional depending on whether you are using direct Supabase client calls.
- Matching API either:
  - deployed URL via `VITE_MATCHING_URL`, or
  - local model service at `http://localhost:8000`.

## 8) Current State Notes (for future AI agents)

- Some coordinator/volunteer screens are still mock-driven while others read live Supabase data.
- `frontend/client/lib/api.ts` currently performs direct client-side writes to Supabase for core entities.
- `backend/` contains more robust server-style logic (urgency scoring, duplicate-check assignment flow), but integration between this service and frontend is partial/in-progress.
- The deployed matching integration is active and intentionally externalized from Supabase CRUD.

When future agents extend this project, verify whether the intended architecture is:
1) direct frontend-to-Supabase with thin server layer, or  
2) fully API-driven via `backend/` for business rule centralization.

This decision affects where validation, scoring, and authorization checks should live.

## 9) Suggested Next Documentation Enhancements

- Add a database schema section (table columns, enums, indexes, RLS rules).
- Add sequence diagrams for report -> match -> assign -> outcome lifecycle.
- Add explicit matching API OpenAPI snippet (request/response examples).
- Add deployment matrix (Frontend host, Backend host, Matching host, Supabase project).

