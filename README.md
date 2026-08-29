# SCRB-Sanket — State Crime Intelligence & Analytical Platform

**SCRB-Sanket** is an advanced **State Crime Intelligence & Analytical Platform** designed for the Smart India Hackathon (SIH). It transforms traditional crime dashboards and isolated FIR data into a unified, evidence-grounded spatiotemporal intelligence engine powered by Express, Prisma, PostgreSQL, and React.

> ⚠️ **DEMO & EVALUATION ENVIRONMENT**: All FIR records, person profiles, coordinates, and case references in this repository are **100% algorithmically generated synthetic data**. No real police records or personal data are included.

---

## Key Features

- 📊 **Statewide Crime Intelligence Overview**: Real-time aggregate statistics, KPI cards, and district/crime-type breakdowns.
- 🔍 **Natural Language Intelligence Search**: Multi-signal investigation search across FIR descriptions, MO attributes, and police station records.
- 🔗 **Case Correlation Engine**: Explainable multi-signal correlation scoring (0–100%) evaluating spatial proximity, temporal windows, crime classification, suspect co-occurrence, and MO signatures.
- 🧬 **Modus Operandi Intelligence**: Automated MO attribute extraction (Entry Method, Weapon Used, Target Premises, Time Window, Escape Method) with similar MO pattern matching.
- 🚨 **Anomaly & Early Warning Center**: Statistical control limit surge detection, temporal concentration, spatial clustering, and automated priority alert triggers (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- 📈 **Explainable Area Risk Scoring**: District-level risk scoring (0–100) with additive contributing factor breakdowns (no black-box scores).
- 🕸️ **Advanced Network & Link Analysis**: Multi-entity relational graph mapping (Person, FIR, Location, Police Station, Group) with 1-hop and 2-hop relational expansion.
- 🤖 **Evidence-Grounded AI Assistant**: Backend-only Gemini AI assistant that strictly cites verified FIR database IDs and evidence records without fabricating facts.
- 💼 **Investigation Workspace Canvas**: Persisted investigative workspaces (`#INV-001`) with attached cases, suspects, findings, and investigative notes.
- 📋 **Automated Intelligence Briefs**: Generates official 11-section structured intelligence reports ready for printing/export.
- 🏙️ **Socioeconomic Contextual Analysis**: Statistical association dashboard pairing demographic indicators (population density, urbanization, literacy) with crime density.
- 🔒 **Audit Logging & Role-Based Access Control**: Persistent audit logging for supervisor/admin compliance reviews.

---

## Architecture

```text
React 19 + TypeScript + Vite + React Query + Tailwind CSS
                          ↓ (Vite Proxy /api)
             Express 5 + Node.js Backend Server
                          ↓
              Signed JWT Demo Auth Middleware
                          ↓
             Prisma ORM (Prisma Client v6.4.0)
                          ↓
       PostgreSQL Database (or In-Memory Fallback Engine)
```

### Authentication Architecture
- Self-contained, lightweight signed JWT token authentication (`DEMO_AUTH_SECRET`).
- Zero external third-party authentication dependencies (Firebase completely removed).
- Server-side role authorization (`investigator`, `supervisor`, `admin`).

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **pnpm**: `v9.x` or `v11.x`
- **PostgreSQL**: `v14+` (running on `localhost:5432`)
- **Git**: `v2.x`

---

## Installation & Setup Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SCRB-Sanket
```

### 2. Install Workspace Dependencies
```bash
pnpm install
```

---

## PostgreSQL Setup & Database Seeding

### 1. Create Local Database
Open PostgreSQL terminal (psql) or pgAdmin and create the database:
```sql
CREATE DATABASE scrb_sanket;
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the `server` directory:
```bash
cp server/.env.example server/.env
```

Ensure `server/.env` contains your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scrb_sanket?schema=public"
PORT=5000
DEMO_AUTH_SECRET="scrb_sanket_secret_key_2026"
```

### 3. Generate Prisma Client & Push Schema
```bash
cd server
npx prisma@6.4.0 generate --schema=prisma/schema.prisma
npx prisma@6.4.0 db push --schema=prisma/schema.prisma
```

### 4. Seed Synthetic Dataset
Populates 520 synthetic FIR records, 60 Persons of Interest, and 3 demo user profiles:
```bash
pnpm run db:seed
```

---

## Environment Variables

### Server (`server/.env.example`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scrb_sanket?schema=public"
PORT=5000
DEMO_AUTH_SECRET="scrb_sanket_secret_key_2026"
GEMINI_API_KEY="your-gemini-api-key-optional"
```

### Frontend (`artifacts/scrb-sanket/.env.example`)
```env
VITE_SARVAM_API_KEY=
PORT=26259
BASE_PATH=/
```

---

## Running the Application

### Option A: Run Full Development Environment (Recommended)
Starts both Express backend (`http://localhost:5000`) and Vite frontend (`http://localhost:5173`):
```bash
pnpm dev:all
```

### Option B: Run Services Individually
```bash
# Terminal 1: Backend Server (Port 5000)
pnpm --filter server run dev

# Terminal 2: Frontend App (Port 5173)
pnpm --filter @workspace/scrb-sanket run dev
```

---

## Demo Credentials

The platform includes 3 pre-seeded demo roles with passcode **`scrb2024`**:

| Role | Demo Email | Passcode | Name | District / Scope |
|---|---|---|---|---|
| **Investigator** | `investigator@scrb.demo` | `scrb2024` | Insp. R. Kumar | Bengaluru Urban |
| **Supervisor** | `supervisor@scrb.demo` | `scrb2024` | DSP M. Nair | Bengaluru Urban |
| **Admin** | `admin@scrb.demo` | `scrb2024` | SP J. Reddy | SCRB HQ |

---

## API Endpoint Reference

### Metadata & Health
- `GET /health` & `GET /api/healthz` — Health check status
- `GET /api/meta/districts` — List supported Karnataka districts
- `GET /api/meta/crime-types` — List supported crime categories

### Authentication
- `POST /api/auth/login` — Authenticate demo credentials, returns JWT token & profile
- `POST /api/auth/logout` — Logout session
- `GET /api/auth/me` — Retrieve current authenticated profile

### FIR & Crime Analytics
- `GET /api/firs` — Query FIR records with filters (district, crimeType, date range, pagination)
- `GET /api/firs/summary` — Aggregate YTD totals, open/closed cases, top hotspot, status breakdown
- `GET /api/firs/hotspots` — Geospatial hotspot intensity coordinates for mapping
- `GET /api/firs/trends` — Monthly time series & predictive trend forecasting
- `GET /api/firs/by-district` — Crime volume breakdown per district
- `GET /api/firs/by-type` — Incident counts categorized by crime type
- `GET /api/firs/early-warnings` — Rapid alert triggers for elevated crime trends

### Intelligence & Advanced Analytics (`/api/intelligence/*`)
- `GET /api/intelligence/correlations` — Explainable multi-signal FIR correlation scoring
- `GET /api/intelligence/network` — Multi-entity network graph (Person, FIR, Location, Group, 1/2 hops)
- `GET /api/intelligence/mo` — Modus Operandi attribute extraction & similar case matching
- `GET /api/intelligence/anomalies` — Statistical control limit surge detection & severity alerts
- `GET /api/intelligence/alerts` — High-priority early warning center alerts
- `GET /api/intelligence/risk` — Area-level explainable risk scoring (0–100)
- `POST /api/intelligence/search` — Natural language hybrid investigation search
- `GET /api/intelligence/workspace` — List persisted investigation workspaces
- `POST /api/intelligence/workspace` — Create new investigation workspace
- `POST /api/intelligence/grounded-chat` — Grounded AI chat referencing verified FIR IDs
- `POST /api/intelligence/report` — Generate 11-section automated Intelligence Brief
- `GET /api/intelligence/socioeconomic` — Socioeconomic demographic statistical association data

### Compliance & Audit
- `GET /api/audit/log` — Supervisor/Admin access audit logs

---

## Database Schema (Prisma Models)

- `Fir`: Synthetic crime incident record (id, firNumber, district, policeStation, crimeType, subType, dateOfIncident, timeOfIncident, status, latitude, longitude, description).
- `Person`: Suspect/POI entity (id, alias, district, group, crimeTypes).
- `FirPerson`: Junction relation linking Persons to FIR records.
- `AuditLog`: Operational audit trail (id, userId, userName, role, query, timestamp, resultsCount, ipAddress).
- `User`: Pre-seeded demo user registry with bcrypt password hashing.
- `ChatSession` & `ChatMessage`: Persistent AI chat session trajectories.
- `Investigation`, `InvestigationFir`, `InvestigationPerson`, `InvestigationFinding`: Investigation workspace canvas models.
- `SocioeconomicData`: Demographic contextual variables per district.

---

## Project Structure

```text
SCRB-Sanket/
├── artifacts/
│   └── scrb-sanket/                # React 19 + Vite Frontend App
│       ├── src/
│       │   ├── components/         # UI components & AppLayout navigation
│       │   ├── contexts/           # AuthContext (JWT session management)
│       │   ├── pages/              # Intelligence views & analytical dashboards
│       │   └── local-api/          # Baseline reference mock API (preserved)
│       ├── package.json
│       └── vite.config.ts
├── lib/
│   └── api-client-react/           # Shared TypeScript API client library
├── server/                         # Express + TypeScript Backend Workspace
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema with indexes & relations
│   │   └── seed.ts                 # Idempotent synthetic data seeder
│   ├── src/
│   │   ├── auth/                   # Demo auth registry & signed token logic
│   │   ├── controllers/            # Controller handlers with fallback engine
│   │   ├── middleware/             # Auth, timing, and 45s TTL cache middleware
│   │   ├── routes/                 # Express API routes definition
│   │   ├── services/               # Intelligence services (Correlation, MO, Anomaly, Risk, AI, Report)
│   │   ├── app.ts                  # Express application setup
│   │   └── index.ts                # Server entrypoint (Port 5000)
│   └── package.json
├── package.json                    # Monorepo root configuration & scripts
└── README.md
```

---

## Troubleshooting

### 1. PostgreSQL Connection Failure (`P1001: Can't reach database server at localhost:5432`)
- Ensure PostgreSQL service is started on your OS (`services.msc` on Windows or `sudo service postgresql start` on Linux).
- Verify credentials in `server/.env` match your local PostgreSQL user (`postgres`).
- *Note:* The backend features an automatic in-memory fallback engine so the application will continue to render synthetic data even if PostgreSQL is offline during a demo.

### 2. Port 5000 or 5173 Already in Use
- Check for active Node processes using `netstat -ano | findstr 5000` on Windows and terminate them if needed.

### 3. Prisma Client Generation Error (`EPERM: operation not permitted`)
- Stop any running `pnpm dev:server` tasks before executing `npx prisma generate` so Windows file locks on DLL binaries are released.

### 4. Demo Login Failure
- Use passcode `scrb2024` with any of the demo emails (`investigator@scrb.demo`, `supervisor@scrb.demo`, `admin@scrb.demo`).

---

## Development & Verification Commands

```bash
# Typecheck React Frontend
pnpm --filter @workspace/scrb-sanket run typecheck

# Build TypeScript Backend Server
pnpm --filter server run build

# Regenerate Prisma Client
cd server && npx prisma@6.4.0 generate --schema=prisma/schema.prisma

# Seed Database
pnpm run db:seed
```

---

## Security Notes

- This application is developed as a prototype/MVP for demonstration purposes using synthetic data.
- Demo authentication relies on signed JWT tokens signed with `DEMO_AUTH_SECRET`.
- Production deployment would require integration with official police SSO / IAM identity providers.
- `.env` files containing secrets are excluded from Git version control via `.gitignore`.
