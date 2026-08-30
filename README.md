# 🛡️ SANKET — AI Crime Intelligence Command Center

<div align="center">

<img src="./karnataka-emblem.png" alt="Government of Karnataka Emblem" width="120"/>

**A next-generation crime-intelligence dashboard built for the Karnataka State Crime Records Bureau (SCRB)**

*Built for Datathon 2026 · Karnataka State Police × Hack2skill*

🔗 **Live Demo:** [scrb-sanket.web.app](https://scrb-sanket.web.app)

</div>

---

## 📖 Overview

**SANKET** is a fully client-side, zero-backend crime-intelligence command center designed to give law enforcement analysts a fast, AI-assisted view into crime patterns, hotspots, and networks. Built entirely with synthetic demo data, it demonstrates how modern web tooling and generative AI can be combined into a lightweight, easily deployable operational dashboard — no server infrastructure required.

---

## ✨ Features

| Module | Description |
|---|---|
| 📊 **Dashboard** | High-level overview of crime statistics and key metrics |
| 🤖 **AI Query (Chat)** | Natural-language querying powered by Google Gemini, with a rule-based fallback when AI is unavailable |
| 🗺️ **Hotspot Map** | Geographic visualization of crime concentration areas |
| 📈 **Trends** | Time-series analysis of crime patterns |
| 🕸️ **Network** | Link analysis for uncovering relationships between entities |
| 📜 **Audit Log** | Full activity/action tracking for accountability |
| ❓ **How It Works** | In-app explainer for onboarding new users |
| 🔐 **Login** | Access control for the dashboard |

### 🎙️ AI & Voice
- Conversational AI assistant powered by **Google Gemini API**
- Graceful **rule-based fallback** ensures the assistant works even without live AI access
- **Voice input** via **Sarvam AI** speech-to-text — supports **English and Kannada**
- **Chat export to PDF** using `html2canvas-pro` + `jsPDF`

---

## 🏗️ Tech Stack

```
Frontend      React 19 + Vite + TypeScript
Styling       Tailwind CSS v4 + shadcn/ui
Architecture  Fully client-side — zero backend server
Monorepo      pnpm workspace
AI            Google Gemini API
Voice         Sarvam AI (Speech-to-Text)
Export        html2canvas-pro, jsPDF
Hosting       Firebase Hosting
```

> **Note:** This project is entirely client-side by design — no backend server is required to run or deploy it.

---

## 🚀 Architecture Journey

SANKET went through several deployment iterations before landing on its current lightweight architecture:

```
Replit Export → Windows Local Dev → Vercel → Firebase → Fully Client-Side (Zero Backend)
```

This evolution reflects a deliberate simplification: moving away from server dependencies toward a self-contained, easily deployable static application.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (LTS recommended)
- `pnpm` package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd sanket

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Environment Variables

Create a `.env` file in the root directory with your API keys:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SARVAM_API_KEY=your_sarvam_api_key
```

---

## 📦 Deployment

Currently deployed on **Firebase Hosting**:

```bash
firebase deploy
```

Live at: **[scrb-sanket.web.app](https://scrb-sanket.web.app)**

---

## 🐛 Known Fixes & Improvements

- ✅ Resolved Gemini model deprecation issues
- ✅ Fixed session ID query parameter handling
- ✅ Resolved Tailwind v4 / `html2canvas` incompatibility
- ✅ Codebase cleanup and streamlined GitHub push workflow

---

## ⚠️ Disclaimer

This project uses **synthetic demo data only**. It is a hackathon prototype built for demonstration purposes as part of Datathon 2026 and does not process or store real crime data.

---

## 🏆 Recognition

Built for **Datathon 2026**, organized by **Hack2skill** in partnership with the **Karnataka State Police**. Shortlisted for the next phase of the competition.

---

## 👤 Team

Built by **Nanak** and team.

---

<div align="center">

*Made with ⚡ for safer, smarter policing.*

</div>
