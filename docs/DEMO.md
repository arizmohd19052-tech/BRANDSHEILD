# BrandShield AI: Demo Script & Presentation Slides
**Digital Risk Protection – Social & App Impersonation Monitoring**

This document provides a concise 2–3 minute live demonstration script and an executive 6-slide deck outline for hackathon evaluators.

---

## 📽️ 2–3 Minute Live Demo Script

| Timestamp | Screen / Action | Speaker Script | Key Visual Highlight |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:30** | **Brand Scope & Multi-Scroll Home Page** | *"Brands face an epidemic of identity theft across social media and app stores. In BrandShield AI, defense begins with verified ground truth. In our Brand Profile, organizations like HDFC Bank, PhonePe, and Flipkart define their verified assets—official social handles, authorized app package IDs like `com.snapwork.hdfc`, and publisher names. Crucially, this profile acts as an active allowlist: official assets are ALWAYS excluded first, guaranteeing zero false-positive self-flagging."* | Multi-brand selector (HDFC Bank, PhonePe, Flipkart), completeness meter, verified allowlist. |
| **0:30 - 0:55** | **Live Telemetry & Zero-Lag Charts** | *"We notice the persistent 'Demo Dataset' badge indicating our verified public and synthetic benchmark dataset. Notice the Risk Breakdown and Donut charts: they are custom pure-SVG/CSS implementations with instantaneous, zero-lag hover states and zero parent re-renders. The Dataset Composition card clearly reports verified public assets, synthetic test scenarios, and user-submitted candidates—with a one-click safe reset button."* | Custom SVG zero-lag bar/donut charts, dataset provenance breakdown card, degraded adapter banner. |
| **0:55 - 1:35** | **Ingest & Check Workbench (Live Testing)** | *"Now let's test a brand new candidate in real time using our 'Ingest & Check' workbench. We can test single candidates or bulk upload a CSV of up to 200 candidates. First, we enter `@HDFC_Bank`: the engine immediately catches it as an official asset and excludes it with zero risk. Next, we enter a rogue app: 'PhonePe Instant UPI Cash Loan' with an unauthorized publisher. The deterministic engine scores it with an animated gauge, itemizes exact points, shows side-by-side comparisons, and allows saving it directly to our detections as a `USER_SUBMITTED` record."* | Live single check form, logo upload preview, gauge animation, side-by-side asset comparison, and bulk CSV ingest tab. |
| **1:35 - 2:05** | **Detections View & Deterministic Analysis** | *"On the Detections tab, we see our prioritized threat queue. Notice our multi-signal filters: combinable by brand, platform, risk level, and detection reason, and synchronized to the URL. Clicking 'Inspect Analysis', we open a deterministic Threat Analysis showing exact score gauges, side-by-side official comparisons, and an operational takedown checklist."* | Combinable filters, 25/page pagination, CSV export, and side-by-side comparison modal. |
| **2:05 - 2:30** | **Look-alike Lab & False-Positive Prevention** | *"In the Look-alike Lab, we test adversarial mutations: homoglyphs ('Flipk4rt'), spacing ('P h o n e P e'), or coercive support tokens ('Care 24x7'). Our pipeline normalizes unicode, folds character swaps, and calculates token distances. But look at our false-positive guard: when testing 'Flipkart Stationery & Supplies', our Over-Flagging Guard detects an unrelated sector and suppresses the score. We never penalize legitimate businesses."* | Real-time interactive testbench with steel blue styling, presets, and active over-flagging guard. |
| **2:30 - 3:00** | **Community Feedback & Presentation Wrap** | *"Finally, our built-in Feedback widget allows security analysts to submit ratings and observations with honeypot anti-spam protection, which admins can review in real time. The platform features rule-based detection with optional Gemini AI explanations and is styled in a mature, trustworthy Sarvam-inspired palette. We can export our full triage report via CSV with a single click."* | Allowlist audit records with `[EXCLUDED_OFFICIAL_ASSET]` tags, feedback modal, and CSV download confirmation. |

---

## 📊 6-Slide Presentation Deck Outline

### Slide 1: Title & The Impersonation Crisis
- **Headline:** BrandShield AI — Autonomous Digital Risk Protection for Social & Mobile Ecosystems
- **Sub-headline:** Protecting customer trust from fraudulent brand pages, scam accounts, and counterfeit mobile apps.
- **The Problem:** Threat actors exploit brand recognition using subtle character swaps, homoglyphs, and unauthorized APKs to harvest credentials, deceive customers, and steal funds.
- **Presenter Note:** Emphasize that organizations cannot manually scan millions of social handles and app listings; they need automated, multi-signal, explainable discovery.

---

### Slide 2: The Core Innovation: Exclusion-First Architecture (Pillar A)
- **Headline:** 100% Explainable, Deterministic Allowlist Defense
- **Bullet Points:**
  - **Pillar 1: Official Asset Exclusion FIRST:** Guarantees registered handles and app IDs are never flagged or reported.
  - **Pillar 2: Multi-Signal Threat Synthesis:** Demands multiple independent signals (name distance + publisher mismatch + scam copy + domain check) before flagging; prevents arbitrary single-signal false alarms.
  - **Pillar 3: Context-Aware Over-Flagging Guard:** Distinguishes benign shared words (e.g. *Flipkart Stationery*) from malicious adversaries.
- **Presenter Note:** Point out that false alarms destroy analyst trust. BrandShield AI treats false-positive prevention as a first-class citizen.

---

### Slide 3: Bonus Feature: Advanced Look-alike Lab (5–10 Points)
- **Headline:** Deep Homoglyph, Leetspeak, and Mutation Engine
- **Bullet Points:**
  - **Homoglyph & Leetspeak Folding:** `4` $\rightarrow$ `a`, `0` $\rightarrow$ `o`, `rn` $\rightarrow$ `m`, `vv` $\rightarrow$ `w`, `l`/`1` $\rightarrow$ `I`.
  - **Spacing & Punctuation Regularizers:** Detects deceptive token spacing (`A c m e`, `P h o n e P e`).
  - **Coercive Token Extraction:** Catches high-risk affixes (*Support*, *Care24x7*, *Helpdesk*, *KYC Update*).
  - **Interactive Lab:** Security engineers can simulate adversarial mutations in real time.

---

### Slide 4: Real-Time Ingest & Bulk Evaluation Workbench
- **Headline:** Instant Ingestion with Multi-Class Data Provenance
- **Bullet Points:**
  - **Single & Bulk Ingestion:** Evaluate individual suspicious names or upload a CSV file with up to 200 rows.
  - **Strict Data Provenance:** Clear visual isolation between `VERIFIED_PUBLIC`, `SYNTHETIC_TEST_DATA`, and `USER_SUBMITTED` candidate detections.
  - **Safe Dataset Reset:** Purges user-submitted records with a single click while preserving verified enterprise ground truth.

---

### Slide 5: Deterministic Scoring & Gemini AI Intelligence
- **Headline:** Deterministic Core with Optional Gemini Threat Explanations
- **Bullet Points:**
  - Rule-based detection with optional Gemini AI explanations for plain-language triage and scam-intent classification.
  - Provides itemized evidence scoring, side-by-side candidate comparisons, and step-by-step DMCA/platform takedown checklists.
  - Clean separation: deterministic engine alone decides risk scores; Gemini enriches with plain-language analysis.

---

### Slide 6: User Experience & Enterprise Readiness
- **Headline:** Zero-Lag Custom SVG Charts, Combinable Filters & CSV Export
- **Bullet Points:**
  - Mature Sarvam.ai inspired aesthetic: warm paper palette (`#F7F5F0`), `#FFFFFF` surfaces, `#0E5A52` deep teal, zero purple gradients.
  - Zero-lag custom SVG bar and donut charts with pure CSS hover states.
  - Combinable, URL-synced multi-factor filters (brand, platform, severity, reason).
  - One-click CSV export of full detection telemetry for SIEM and SOC escalation.
