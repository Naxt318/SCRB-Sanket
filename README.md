<div align="center">

<p align="center">
  <img src="artifacts/scrb-sanket/src/assets/karnataka-emblem.png" alt="Karnataka State Emblem" width="148" />
</p>

<p align="center">
  <img src="docs/assets/scrb-sanket-wordmark.svg" alt="SCRB-Sanket — Crime Intelligence Explained" width="680" />
</p>

### AI Crime Intelligence Command Center

**From fragmented records to explainable intelligence—before the next pattern becomes the next incident.**

[![React 19](https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js 24](https://img.shields.io/badge/Node.js_24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-111111?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Zoho Catalyst](https://img.shields.io/badge/Zoho_Catalyst-EA4335?style=for-the-badge&logo=zoho&logoColor=white)](https://catalyst.zoho.com/)

<br />

[**Launch Live Prototype**](https://scrb-sanket-v2-50045404109.development.catalystappsail.in/) · [**Watch Demo**](https://drive.google.com/file/d/1UXoEyusXB1T5lh_U_HvbBr2uTIA9awe4/view?usp=sharing) · [**Explore Features**](#intelligence-command-center) · [**Run Locally**](#quick-start)

</div>

---

## The 30-second pitch

Police intelligence teams do not suffer from a lack of data—they suffer from disconnected data, slow manual reporting, and signals that remain invisible across cases.

**SCRB-Sanket** transforms siloed crime records into one role-aware intelligence workspace. It helps an analyst search incidents, discover related cases, inspect criminal networks, identify hotspots and anomalies, understand modus operandi, calculate explainable area risk, organize investigations, and produce evidence-grounded briefs—without presenting a black-box prediction as fact.

The result is a prototype for **faster analysis, earlier pattern recognition, clearer supervision, and more accountable decision support**.

## Why this matters

| Today’s operational gap | SCRB-Sanket’s response |
|---|---|
| Crime records live in disconnected views and systems | One unified, searchable command center |
| Cross-district patterns are difficult to identify manually | Correlation, MO, network, map, and trend analysis |
| Conventional reports are retrospective and time-consuming | Early-warning signals and generated intelligence briefs |
| A score without an explanation cannot be responsibly trusted | Transparent factor breakdowns, provenance, and cited records |
| Investigators lose context between tools and sessions | Persistent case-centric investigation workspaces |
| Sensitive analysis requires oversight | Role-aware access and an auditable activity trail |

## Prototype at a glance

<div align="center">

| **16** intelligence screens | **10** advanced intelligence APIs | **3** operational roles | **1** unified workflow |
|:---:|:---:|:---:|:---:|
| Search to reporting | Correlation to risk | Investigator · Supervisor · Admin | Signal to responsible action |

</div>

### Try it now

Open the [live Catalyst deployment](https://scrb-sanket-v2-50045404109.development.catalystappsail.in/) and use any evaluation profile below.

| Experience | Email | Password |
|---|---|---|
| Investigator | `investigator@scrb.demo` | `scrb2024` |
| Supervisor | `supervisor@scrb.demo` | `scrb2024` |
| Administrator | `admin@scrb.demo` | `scrb2024` |

> The prototype uses synthetic demonstration records. It contains no real victim, suspect, citizen, FIR, or operational police data.

## Intelligence command center

### Discover

| Module | Operational value |
|---|---|
| **Command Dashboard** | Statewide KPIs, district comparisons, crime distribution, recent activity, and warning summaries |
| **Intelligence Search** | Multi-field discovery across FIRs and operational metadata |
| **AI Intelligence Assistant** | Natural-language analysis grounded in relevant synthetic records, with reasoning and sources |
| **Hotspot Map** | Interactive geographic visualization of incident concentration and intensity |
| **Crime Trends** | District, crime-type, and date-range patterns over time |

### Connect

| Module | Operational value |
|---|---|
| **Case Correlation** | Multi-factor similarity across geography, time, offence type, and MO indicators |
| **Network Analysis** | Visual exploration of relationships between people, incidents, and entities |
| **MO Intelligence** | Recurring modus-operandi profiles with related-case navigation |
| **Socioeconomic Context** | Carefully framed, non-causal associations between context and recorded crime density |

### Anticipate

| Module | Operational value |
|---|---|
| **Anomaly Alerts** | Detects unusual volume, location, time, and recurring-MO patterns |
| **Early Warnings** | Surfaces signals that deserve analyst review before routine reporting catches up |
| **Explainable Risk** | Area risk from 0–100 with visible contributing factors—not an unexplained score |

### Act and account

| Module | Operational value |
|---|---|
| **Investigation Workspace** | Connects FIRs, persons, MO findings, notes, and evidence in one case workspace |
| **Intelligence Briefs** | Generates structured, evidence-grounded reports for review and export |
| **Audit Trail** | Records user activity for supervisory accountability |
| **Role-Aware Access** | Separates Investigator, Supervisor, and Admin experiences |

## What makes it different

- **Intelligence, not another dashboard.** Modules form a continuous workflow from discovery to investigation and reporting.
- **Explainability by design.** Correlations and risk signals expose the factors behind them.
- **Grounded AI.** Gemini improves the language of an answer but is instructed to preserve the application’s evidence, identifiers, and numerical findings.
- **Resilient demonstration.** Deterministic analysis and synthetic fallbacks keep core workflows functional if an external AI service or database is unavailable.
- **Human authority remains final.** Signals support professional judgment; they do not determine guilt or trigger automated enforcement.
- **Designed for operational roles.** Investigators explore, supervisors review, and administrators retain governance visibility.

## From record to responsible action

```mermaid
flowchart LR
    A[Unified Crime Records] --> B[Search & Explore]
    B --> C[Hotspots & Trends]
    B --> D[Case Correlation]
    B --> E[Entity Networks]
    C --> F[Anomaly & Risk Signals]
    D --> F
    E --> F
    F --> G[Investigation Workspace]
    G --> H[Evidence-grounded Brief]
    H --> I[Human Review]
    I --> J[Accountable Action]
```

## System architecture

```mermaid
flowchart TB
    UI[React 19 + TypeScript Interface]
    API[Express Intelligence API]
    AUTH[JWT + Role-aware Access]
    ENGINE[Correlation · Risk · MO · Search · Reporting]
    AI[Grounded Gemini Enhancement]
    DB[(PostgreSQL + Prisma)]
    DEMO[(Synthetic In-memory Engine)]

    UI -->|Same-origin /api| API
    API --> AUTH
    API --> ENGINE
    ENGINE --> DB
    ENGINE --> DEMO
    ENGINE --> AI
    AI -->|Evidence-preserving response| UI
```

The production service runs the compiled React client and Express API together. This gives the prototype one origin, protected server-side AI credentials, SPA deep-link support, and a single deployable runtime.

## Technology

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Wouter, TanStack Query |
| Experience | Tailwind CSS v4, shadcn/ui, Radix UI, Framer Motion, Lucide |
| Visualization | Recharts, Leaflet, React Leaflet, React Force Graph |
| Backend | Node.js 24 on Catalyst, Express, TypeScript, Zod |
| Data | PostgreSQL, Prisma ORM, synthetic/in-memory fallback |
| Security | JWT, bcrypt, protected routes, role-aware workflows |
| Intelligence | Deterministic analytics with optional Google Gemini enhancement |
| Export | jsPDF and html2canvas-pro |
| Deployment | Zoho Catalyst AppSail, pnpm workspaces |

## Quick start

### Prerequisites

- Node.js 22 or newer
- pnpm
- PostgreSQL is optional for the fallback demonstration and recommended for persistent environments

### Install and run

```bash
git clone https://github.com/Naxt318/SCRB-Sanket.git
cd SCRB-Sanket
pnpm install --frozen-lockfile
pnpm dev:all
```

Open `http://localhost:5173` unless Vite selects another available port.

### Environment

Create `server/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scrb_sanket?schema=public"
PORT=5000
DEMO_AUTH_SECRET="replace-with-a-long-random-secret"
GEMINI_API_KEY=""
```

For browser speech-to-text, create `artifacts/scrb-sanket/.env.local`:

```env
VITE_SARVAM_API_KEY=""
VITE_API_MODE="local"
```

Use `VITE_API_MODE=local` for the static demonstration or `VITE_API_MODE=server` when the client is served with Express.

### Optional PostgreSQL setup

```bash
pnpm --filter server prisma:generate
pnpm --filter server db:push
pnpm --filter server db:seed
```

## Build and deployment

```bash
pnpm build
pnpm start
```

| Setting | Value |
|---|---|
| Runtime | Node.js 24 |
| Startup command | `node server/dist/index.js` |
| Application port | `X_ZOHO_CATALYST_LISTEN_PORT` or `PORT` |
| Health endpoint | `/health` |
| Live platform | Zoho Catalyst AppSail |

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete production checklist.

## Repository map

```text
SCRB-Sanket/
├── artifacts/scrb-sanket/   # React application and local demo engine
├── lib/                      # Shared API clients, contracts, and schemas
├── server/
│   ├── prisma/               # Relational data model and seed data
│   └── src/                  # API, auth, middleware, and intelligence services
├── docs/assets/              # Project media
├── DEPLOYMENT.md             # Catalyst and production checklist
└── pnpm-workspace.yaml       # Monorepo definition
```

## Trust, safety, and responsible use

> [!IMPORTANT]
> SCRB-Sanket is a decision-support prototype—not an autonomous policing, guilt-assessment, or individual-prediction system.

- All included crime and person records are **synthetic**.
- Risk scores describe area-level analytical signals and expose their contributing factors.
- Socioeconomic results are **correlational, not causal**.
- AI output must remain tied to available evidence and be verified by a human investigator.
- Real deployment requires lawful authority, data minimization, retention controls, access review, security testing, and independent bias evaluation.
- Secrets are stored server-side in the hosting platform and never committed to Git.

## Recognition

SCRB-Sanket was shortlisted for the next evaluation phase of **KSP Datathon 2026**. The prototype demonstrates how fragmented records can become useful, explainable, and reviewable intelligence while preserving human accountability.

## Team

| | |
|---|---|
| **Team** | Token Burners |
| **Team Lead** | Puneet Sudam Dhongade |
| **Team Size** | 3 |
| **Challenge** | Current systems rely on siloed data and manual reporting, limiting advanced analytics and proactive policing capabilities. |

---

<div align="center">

### संकेत · SCRB-Sanket

**See the signal. Understand the evidence. Keep humans accountable.**

<sub>Built with purpose for safer, smarter, and more responsible public service.</sub>

[Launch Prototype](https://scrb-sanket-v2-50045404109.development.catalystappsail.in/) · [Watch Demo](https://drive.google.com/file/d/1UXoEyusXB1T5lh_U_HvbBr2uTIA9awe4/view?usp=sharing)

</div>
