<div align="center">

<p align="center">
  <img src="./attached_assets/karnataka-emblem.png" alt="Karnataka State Emblem" width="170" />
</p>

# SCRB-Sanket

### AI Crime Intelligence Command Center

**Turning fragmented crime records into explainable, actionable intelligence for the Karnataka State Crime Records Bureau.**

[![Datathon 2026](https://img.shields.io/badge/Datathon-2026-7c3aed?style=for-the-badge)](https://hack2skill.com/event/datathon2026)
[![Karnataka SCRB](https://img.shields.io/badge/Karnataka-SCRB-b91c1c?style=for-the-badge)](#)
[![React 19](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

[**Live Prototype**](https://scrb-sanket.web.app) · [**Features**](#-intelligence-capabilities) · [**Quick Start**](#-quick-start) · [**Architecture**](#-system-architecture) · [**Deploy**](#-production-deployment)

<br />

> Shortlisted for the next phase of **Datathon 2026**, organized by Hack2skill in partnership with Karnataka State Police.

</div>

---

## The mission

Crime data is rarely valuable merely because it exists. Its operational value appears when analysts can connect incidents across place, time, people, modus operandi, and socioeconomic context—and explain why a signal deserves attention.

**SCRB-Sanket** is a full-stack crime-intelligence prototype designed around that goal. It brings search, geospatial analysis, temporal trends, relationship discovery, anomaly detection, explainable risk scoring, investigation workspaces, and evidence-grounded reporting into one role-aware command center.

The prototype is deliberately built with **synthetic demonstration data**. It shows the workflow and analytical possibilities without exposing real citizens, victims, suspects, FIRs, or operational police data.

## Why SCRB-Sanket

| Challenge | SCRB-Sanket response |
|---|---|
| Records are spread across views and systems | One searchable intelligence workspace |
| Patterns are difficult to see in tabular data | Maps, trends, graphs, correlations, and MO profiles |
| Black-box scores are hard to trust | Additive factor breakdowns and provenance cues |
| Analysts lose context between sessions | Persistent investigation workspaces |
| Reports take time to assemble | Structured, evidence-grounded intelligence briefs |
| Sensitive workflows need accountability | Role-based access and audit logging |
| A prototype may lose cloud services during a demo | Synthetic and in-memory fallback behavior |

## ✦ Intelligence capabilities

### Command and discovery

| Module | What it delivers |
|---|---|
| **Command Dashboard** | Statewide KPIs, crime distribution, district comparisons, recent activity, and early-warning summaries |
| **Intelligence Search** | Multi-field discovery across FIR records and operational metadata |
| **AI Query Assistant** | Natural-language analysis with reasoning, cited source records, charts, map points, and conversation history |
| **Hotspot Map** | Interactive geographic visualization of incident concentration and intensity |
| **Crime Trends** | Time-series views for district, crime-type, and date-range analysis |

### Advanced analysis

| Module | What it delivers |
|---|---|
| **Case Correlation** | Multi-signal similarity scoring across geography, time, offence type, and MO indicators |
| **Network Analysis** | Entity and incident link graphs for exploring connected people and cases |
| **MO Intelligence** | Recurring modus-operandi profiles and related-case navigation |
| **Anomaly Alerts** | Volume spikes, geographic clusters, temporal concentration, and recurring-MO warnings |
| **Explainable Risk** | Area risk scores from 0–100 with visible contributing factors—no unexplained black-box number |
| **Socioeconomic Context** | Non-causal statistical associations between demographic context and recorded crime density |

### Investigation and governance

| Module | What it delivers |
|---|---|
| **Investigation Workspace** | Persistent collections connecting FIRs, persons, MO findings, notes, and evidence |
| **Intelligence Briefs** | Eleven-section structured reports covering trends, hotspots, anomalies, networks, risk, evidence, and recommended focus |
| **Audit Log** | Traceable user queries and actions for supervisory accountability |
| **Role-Aware Access** | Investigator, Supervisor, and Admin experiences with restricted analytical routes |
| **How It Works** | In-product transparency notes, methodology, provenance, and limitations |

### AI, voice, and export

- **Grounded responses** connect analytical answers to relevant synthetic FIR records.
- **Explainability panels** expose reasoning and provenance instead of presenting unsupported conclusions.
- **Graceful fallback logic** keeps core demonstrations usable when an external AI service is unavailable.
- **English and Kannada voice input** is available through the optional Sarvam AI integration.
- **PDF export** uses `html2canvas-pro` and `jsPDF` for portable chat and analysis output.

## 🧭 Product flow

```text
Authenticate
    ↓
Command Dashboard
    ↓
Search ── Hotspots ── Trends ── AI Query
    ↓           ↓          ↓          ↓
Correlations ─ MO ─ Networks ─ Anomalies
    ↓
Explainable Risk ─ Socioeconomic Context
    ↓
Investigation Workspace
    ↓
Evidence-grounded Intelligence Brief + Audit Trail
```

## 🏗 System architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                         React 19 client                          │
│  Dashboard · Search · Maps · Graphs · Workspaces · Reports      │
└──────────────────────────────┬───────────────────────────────────┘
                               │ same-origin /api
┌──────────────────────────────▼───────────────────────────────────┐
│                    Express + TypeScript API                      │
│  Auth · FIR analytics · Correlation · Risk · MO · Reporting     │
└───────────────┬──────────────────────────────┬───────────────────┘
                │                              │
┌───────────────▼──────────────┐  ┌────────────▼──────────────────┐
│ PostgreSQL + Prisma          │  │ Synthetic / in-memory engine │
│ Persistent production data  │  │ Resilient prototype fallback │
└──────────────────────────────┘  └───────────────────────────────┘
```

The production process serves both the compiled React application and the API. This provides one build, one runtime, same-origin requests, and SPA deep-link fallback.

## Technology stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Wouter, TanStack Query |
| **Interface** | Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion, Lucide |
| **Visualization** | Recharts, Leaflet, React Leaflet, React Force Graph |
| **Backend** | Node.js 22, Express, TypeScript, Zod |
| **Data** | PostgreSQL, Prisma ORM, synthetic/in-memory fallback |
| **Authentication** | JWT, bcrypt, role-aware protected routes |
| **AI and voice** | Evidence-grounded analysis, optional Gemini and Sarvam integrations |
| **Export** | jsPDF, html2canvas-pro |
| **Tooling** | pnpm workspaces, TypeScript project references |

## 🔐 Demo access

All demo roles use the password `scrb2024`.

| Role | Email | Access |
|---|---|---|
| **Investigator** | `investigator@scrb.demo` | Core dashboards, search, analysis, maps, workspaces, and reports |
| **Supervisor** | `supervisor@scrb.demo` | Investigator capabilities plus restricted network and audit views |
| **Admin** | `admin@scrb.demo` | Full prototype access |

> These accounts exist for evaluation only. Replace demo credentials and fallback authentication before real-world use.

## 🚀 Quick start

### Prerequisites

- Node.js 22
- pnpm
- PostgreSQL is optional for the fallback demo and recommended for persistence

### Install and run

```bash
git clone https://github.com/Naxt318/SCRB-Sanket.git
cd SCRB-Sanket
pnpm install --frozen-lockfile
pnpm dev:all
```

Open `http://localhost:5173` unless your environment selects another port.

### Environment variables

Create `server/.env` for the API:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scrb_sanket?schema=public"
PORT=5000
DEMO_AUTH_SECRET="replace-with-a-long-random-secret"
GEMINI_API_KEY=""
```

For optional browser speech-to-text, create `artifacts/scrb-sanket/.env.local`:

```env
VITE_SARVAM_API_KEY=""
```

Generate a secure JWT signing secret with:

```bash
openssl rand -hex 32
```

### Initialize PostgreSQL

```bash
pnpm --filter server prisma:generate
pnpm --filter server db:push
pnpm --filter server db:seed
```

## 📦 Production deployment

SCRB-Sanket ships as a single deployable service.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Recommended platform configuration:

| Setting | Value |
|---|---|
| Runtime | Node.js 22 |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Run command | `pnpm start` |
| Health endpoint | `/health` |

After deployment, verify `/`, `/dashboard`, `/assets/*`, and `/health`. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete checklist.

## Repository map

```text
SCRB-Sanket/
├── artifacts/
│   └── scrb-sanket/        # React application
├── lib/
│   ├── api-client-react/    # Shared typed client
│   ├── api-spec/            # OpenAPI contract and generation config
│   └── api-zod/             # Shared validation schemas
├── server/
│   ├── prisma/              # Data model and seed data
│   └── src/                 # Express API, middleware, and analysis services
├── docs/assets/             # Repository media
├── DEPLOYMENT.md            # Production checklist
└── pnpm-workspace.yaml      # Monorepo definition
```

## API surface

The application exposes grouped endpoints for:

- authentication and health;
- FIR retrieval, summaries, hotspots, trends, district and type breakdowns;
- early warnings, network data, and audit history;
- chat sessions and grounded analysis;
- case correlations, MO profiles, anomalies, alerts, and risk scoring;
- intelligence search, workspaces, reports, and socioeconomic context.

Protected endpoints require a bearer token. Supervisory screens additionally enforce role checks in the client and API workflow.

## Trust, safety, and responsible use

> [!IMPORTANT]
> SCRB-Sanket is a Datathon prototype, not a production policing system.

- Every included incident and person is **synthetic**.
- The application must not be used to infer guilt, predict individual criminality, or make automated enforcement decisions.
- Socioeconomic outputs are explicitly **correlational, not causal**.
- Risk scores are decision-support signals and expose their factor contributions.
- Human review, legal authorization, data minimization, access controls, retention rules, and independent bias testing are mandatory before real deployment.
- Client-visible API keys must be restricted; secrets belong in the hosting platform’s secret manager, never in Git.

## Datathon recognition

SCRB-Sanket was built for **Datathon 2026** and shortlisted for its next evaluation phase. The project demonstrates how an explainable, analyst-centered interface can bring together multiple crime-intelligence workflows while remaining transparent about data provenance and limitations.

## Team

Built by **Nanak Tekchandani and team** for Karnataka State Police × Hack2skill Datathon 2026.

---

<div align="center">

### संकेत · SCRB-Sanket

**From records to signals. From signals to responsible action.**

<sub>Built with purpose for safer, smarter, and more accountable public service.</sub>

</div>
