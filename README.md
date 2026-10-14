# 🛡️ BrandShield AI — AI-Powered Digital Brand Protection
> Autonomous Social Media & Mobile App Impersonation Monitoring Platform

[![Status](https://img.shields.io/badge/status-active-success.svg)](https://github.com)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com)
[![Status](https://img.shields.io/badge/status-active-success.svg)](https://github.com)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com)
[![Architecture](https://img.shields.io/badge/architecture-rule--based_with_optional_gemini_ai-teal.svg)](https://github.com)
[![Tests Passing](https://img.shields.io/badge/tests-10%2F10_passing-success.svg)](https://github.com)

**BrandShield AI** helps organizations discover and neutralize brand impersonation across external social media platforms and mobile app stores. Threat actors systematically exploit customer trust through deceptive profiles, scam accounts, look-alike names, and counterfeit mobile apps. BrandShield AI continuously monitors, evaluates, and prioritizes these threats with a transparent, explainable detection pipeline, multi-signal scoring, and rule-based detection with optional Gemini AI explanations.

---

## ✨ Core Pillars & Features

- **🏛️ Brand Profile & Active Allowlist (Pillar A)**: Define legitimate brand assets for verified enterprises (**HDFC Bank**, **PhonePe**, **Flipkart**): official handles, verified app package IDs, and registered publisher names. Official assets are **ALWAYS excluded first** and logged in the Asset Auditor with zero risk score.
- **🌐 Social Media Monitoring (Pillar B)**: Discovers and scores impersonation accounts, scam profiles, and deceptive pages across X, Instagram, Facebook, LinkedIn, and Telegram.
- **📱 App Store Monitoring (Pillar C)**: Flags counterfeit and unauthorized mobile apps on Google Play and Apple App Store by evaluating unauthorized developers, package namespace anomalies, and visual logo imitation.
- **📥 Ingest & Check Candidate Workbench (New)**: Interactive evaluator allowing security teams to test candidate social profiles, mobile apps, or domains in real time against any protected brand profile.
  - **Single Candidate Check**: Name, URL, publisher, description, and optional logo upload (PNG/JPG/WebP $\le$ 2MB).
  - **Bulk CSV Ingest**: Supports uploading or pasting CSV files with up to 200 candidates, downloadable CSV template, and inline row-by-row validation error reporting.
  - **Deterministic Persistence**: Save flagged evaluations as `USER_SUBMITTED` records into the persistent store.
- **📊 Zero-Lag Custom SVG Cybersecurity Dashboard**: Real-time posture telemetry featuring lightweight, zero-latency custom SVG/CSS bar and donut charts that completely eliminate hover lag.
- **🗂️ Dataset Composition & Reset**: Live breakdown of `VERIFIED_PUBLIC`, `SYNTHETIC_TEST_DATA`, and `USER_SUBMITTED` candidate counts. Includes a safe **Reset to original dataset** modal that purges user additions without affecting baseline benchmark data.
- **🔬 Look-alike Name Detection Lab (Bonus)**: Interactive testbench featuring homoglyph folding (`4` $\rightarrow$ `a`, `rn` $\rightarrow$ `m`, `0` $\rightarrow$ `o`), punctuation/spacing regularizers (`P h o n e P e`), and added coercive tokens (`Support`, `Care 24x7`). Designed with **Over-Flagging Guards** to ensure legitimate unrelated businesses are protected from false positives.
- **💬 Feedback & Detection Insights**: Interactive 1–5 star rating system, category selection, 500-character comment counter, honeypot anti-spam protection, and administrative review viewer.
- **🎨 Refined Sarvam Light-First Design System**: Defaults to a crisp Light theme featuring `#FFFFFF` surfaces, `#F7F5F0` warm page background, `#0F1B2D` ink, `#0E5A52` deep teal, `#C8791A` warm amber, and `#3B5B8C` steel blue. Zero purple gradients.

---

## 🔒 Data Integrity & Ethics Policy

- **Separation of Verified Public, Synthetic, and User Data**:
  - `server/data/verified-brands.json`: Contains official public profile data for **HDFC Bank**, **PhonePe**, and **Flipkart** verified directly from official corporate sources. Any unverified item is set to `null` with `verificationStatus: "UNVERIFIED_NEEDS_MANUAL_CHECK"` and tracked in [`docs/DATA_TODO.md`](file:///Users/mohammadariz01/.gemini/antigravity/scratch/studyforge-drp/docs/DATA_TODO.md).
  - `server/data/synthetic-test-data.json`: Contains artificially generated candidate records tagged with `dataClass: "SYNTHETIC_TEST_DATA"`. All URLs strictly use reserved RFC domains (`*.example.com`, `*.example.org`, `*.invalid`).
  - `server/data/user-submitted-data.json`: Contains candidates ingested via the Ingest & Check tool tagged with `dataClass: "USER_SUBMITTED"`.
- **Transparent Demo Dataset Attribution**: Persistent **Demo Dataset** badge displayed in the navigation header and dashboard with clear "Dataset generated: Oct 13, 2026" attribution.

---

## 🚀 Quick Start

BrandShield AI operates on a high-speed deterministic scoring engine with an optional Google AI Studio (Gemini) enrichment layer. It runs in rule-based mode out-of-the-box, or enriched with live AI threat explanations when a `GEMINI_API_KEY` is configured.

### 1. Install Dependencies
From the project root:
```bash
# Install root orchestration dependencies
npm install

# Install server dependencies
npm --prefix server install

# Install client dependencies
npm --prefix client install
```

### 2. Start Local Development
```bash
npm run dev
```
- **Backend API:** `http://localhost:4000` (`GET /api/health` returns `{ status: "ok", mode: "demo-dataset" }`)
- **Frontend Web UI:** `http://localhost:5173`

---

## 🎬 Presentation Demo Mode (`npm run demo`)

For hackathon presentations and evaluator demos, run the optimized production preview:

```bash
npm run demo
```
This builds both packages and serves the fast production bundle via Vite Preview (`http://localhost:4173`) + Express Server concurrently.

---

## 🧪 Testing & Verification

Run the unit test suite covering homoglyph folding, typo regularizers, over-flagging prevention, allowlist exclusions, dataset provenance, and feedback persistence:

```bash
npm test
```
All **10 unit test suites** pass in `<200ms`.

---

## 📁 Repository Structure

```text
├── server/
│   ├── data/
│   │   ├── verified-brands.json       # Verified official public brand profiles (HDFC, PhonePe, Flipkart)
│   │   ├── synthetic-test-data.json   # Synthetic test candidates & adversarial benchmark cases
│   │   ├── user-submitted-data.json   # Dynamically persisted candidate evaluations
│   │   └── feedbacks.json             # Persisted user feedback and ratings
│   ├── src/
│   │   ├── config/env.ts              # Resilient environment & Gemini loader
│   │   ├── config/detection.config.ts # Multi-signal weights & sensitivity thresholds
│   │   ├── db/schema.ts               # Core entity types, Zod schemas, & data classes
│   │   ├── db/index.ts                # In-memory storage engine & JSON persistence
│   │   ├── detection/                 # Detection engine, lookalike lab, exclusion allowlist, scam signals
│   │   ├── services/analysis.service.ts # Deterministic threat analysis & checklists
│   │   ├── routes/                    # API routes: /health, /profile, /scan, /ingest, /feedback, /lookalike
│   │   └── index.ts                   # Express server entrypoint
│   └── tests/
│       ├── lookalike.test.ts          # Homoglyph, typosquatting & over-flagging guard tests
│       └── ingest.test.ts             # Ingestion, allowlist exclusion, dataset reset & feedback tests
├── client/
│   ├── src/
│   │   ├── components/                # SectionedHomePage, IngestCheckView, FeedbackSection, DashboardOverview, etc.
│   │   ├── types/index.ts             # Client TypeScript interfaces
│   │   ├── lib/api.ts                 # Typed API client with file-tagged error origin
│   │   └── index.css                  # Sarvam CSS design system & transform animations
│   ├── tailwind.config.js             # Mature palette tokens (no purple)
│   └── vite.config.ts                 # Vite bundler configuration
└── docs/
    ├── ARCHITECTURE.md                # System Architecture & Multi-Signal Flow
    ├── DEMO.md                        # Presentation walkthrough script & slide deck outline
    └── DATA_TODO.md                   # Unverified data items requiring manual review
```
