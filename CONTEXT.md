# BrandShield AI — Project Context & Architectural Specification

**Product Name:** BrandShield AI — AI-Powered Digital Brand Protection  
**Status:** ✅ Production-Ready Hackathon Prototype (v1.1.0)  
**Challenge:** Digital Risk Protection – Social & App Impersonation Monitoring (Kampus.VC)  

---

## 📋 Executive Overview

**BrandShield AI** is an enterprise-grade Digital Risk Protection platform built to detect fraudulent social media profiles, scam accounts, typosquatting domains, and counterfeit mobile applications impersonating legitimate organizations.

The system is architected around core operational principles:
1. **Official Asset Allowlist FIRST (Pillar A):** Legitimate brand properties (verified handles, authorized app package IDs, registered developer identities) are unconditionally excluded from detection queues and preserved in the Asset Auditor, guaranteeing zero false-positive alerts on official channels.
2. **Deterministic, Explainable Risk Engine with Optional Gemini AI:** 100% of detection and scoring logic runs via a deterministic rule-based engine, with optional Gemini AI threat intelligence enrichment for plain-language explanations, scam intent classification, and takedown steps.
3. **Data Provenance & Multi-Class Separation:** Clear separation between `VERIFIED_PUBLIC` data (confirmed from official corporate websites), `SYNTHETIC_TEST_DATA` (test artifacts hosted on RFC-reserved domains), and `USER_SUBMITTED` data (custom inputs tested via the Ingest & Check tool).
4. **False-Positive Prevention (Over-Flagging Resistance):** Benign organizations with coincidental naming (e.g. *Flipkart Stationery & Supplies* or *PePhone Accessories*) are protected by sector keyword guards and multi-signal thresholds.
5. **Zero-Lag SVG/CSS Charts:** Eliminated Recharts event-bubbling hover lag by migrating to pure SVG and CSS `:hover` charts with zero parent component re-renders.
6. **Refined Sarvam Light-First Design System:** Defaults to a crisp light theme (`#FFFFFF` surfaces, `#F7F5F0` warm page background, `#0F1B2D` ink, `#0E5A52` primary teal, `#C8791A` amber, `#3B5B8C` steel blue). Free of purple/neon gradients, with smooth anchor scrolling across a multi-scroll homepage.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework:** React 18 + Vite (TypeScript)
- **Styling:** Tailwind CSS with Sarvam.ai design tokens (WCAG AA compliant, light & dark theme)
- **Icons:** `lucide-react`
- **Charts:** Zero-lag custom SVG + pure CSS bar chart and donut chart
- **Routing & Views:** Tab-based stateful routing (`Overview`, `Ingest & Check`, `Detections`, `Brand Profile`, `Look-alike Lab`, `Asset Auditor`) with multi-scroll anchor navigation
- **API Client:** Fetch API with file-tagged error origin (`[client/src/lib/api.ts]`)
- **Port:** `5173` (dev) / `4173` (preview)

### Backend (Server)
- **Runtime:** Node.js (TypeScript via `tsx`, native ESM)
- **Framework:** Express.js with 2MB payload cap and rate limiting
- **Validation:** Zod schemas
- **Storage:** In-memory cached storage engine backed by JSON files (`verified-brands.json`, `synthetic-test-data.json`, `user-submitted-data.json`, `feedbacks.json`)
- **Port:** `4000`

---

## 📊 Dataset & Brand Profiles

BrandShield AI monitors three confirmed real-world brand entities:
1. **HDFC Bank Limited** (`brand_hdfc`): Banking & Financial Services (`hdfcbank.com`)
2. **PhonePe Private Limited** (`brand_phonepe`): Fintech & Digital Payments (`phonepe.com`)
3. **Flipkart Internet Private Limited** (`brand_flipkart`): E-Commerce & Retail (`flipkart.com`)

Official social profiles and mobile apps from these profiles are automatically indexed as `VERIFIED_PUBLIC` assets with zero risk score and excluded from threat queues.

---

## 📂 Project Structure

```text
studyforge-drp/
├── server/
│   ├── data/
│   │   ├── verified-brands.json         # Real public brand profiles (HDFC, PhonePe, Flipkart)
│   │   ├── synthetic-test-data.json     # Synthetic test candidates on reserved domains
│   │   ├── user-submitted-data.json     # Dynamically saved user candidate detections
│   │   └── feedbacks.json               # Persisted user feedback and ratings
│   ├── src/
│   │   ├── config/env.ts                # Environment and config loader
│   │   ├── config/detection.config.ts   # Multi-signal weights & sensitivity thresholds
│   │   ├── db/schema.ts                 # Core entity types, Zod schemas, & data classes
│   │   ├── db/index.ts                  # Storage engine with dataset counts & reset
│   │   ├── detection/                   # Detection engine, lookalike lab, exclusion allowlist, scam signals
│   │   ├── services/analysis.service.ts # Deterministic threat analysis & checklists
│   │   ├── routes/                      # API routes: /health, /profile, /scan, /ingest, /feedback, /lookalike
│   │   └── index.ts                     # Express server entrypoint
│   └── tests/
│       ├── lookalike.test.ts            # Homoglyph, typosquatting & over-flagging guard tests
│       └── ingest.test.ts               # Ingestion, allowlist exclusion, dataset reset & feedback tests
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SectionedHomePage.tsx    # Multi-scroll home page (Hero, Dashboard, Workflow, Capabilities, FAQ)
│   │   │   ├── IngestCheckView.tsx      # "Ingest & Check" single and bulk CSV workbench
│   │   │   ├── FeedbackSection.tsx      # Feedback rating widget & admin review modal
│   │   │   ├── DashboardOverview.tsx    # Zero-lag SVG bar/donut charts & dataset provenance card
│   │   │   ├── DetectionsView.tsx       # Threat detections table with filters, search, pagination, CSV export
│   │   │   ├── BrandProfileForm.tsx     # Brand Profile & Allowlist management
│   │   │   ├── LookalikeLab.tsx         # Interactive homoglyph & lookalike testing lab
│   │   │   └── ExcludedAssetsView.tsx   # Allowlist Asset Auditor ("Why wasn't this flagged?")
│   │   ├── types/index.ts               # Client TypeScript interfaces
│   │   ├── lib/api.ts                   # Typed API client with file-tagged error origin
│   │   └── index.css                    # Sarvam CSS design system & transform animations
│   ├── tailwind.config.js               # Mature palette tokens (no purple)
│   └── vite.config.ts                   # Vite bundler configuration
└── docs/
    ├── ARCHITECTURE.md                  # System Architecture & Multi-Signal Flow
    ├── DEMO.md                          # Presentation walkthrough script & slide deck outline
    └── DATA_TODO.md                     # Unverified data items requiring manual review
```
