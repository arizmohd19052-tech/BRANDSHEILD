# BrandShield AI — Data Verification Audit & Manual Action Items

This document tracks all data points in [`server/data/verified-brands.json`](file:///Users/mohammadariz01/.gemini/antigravity/scratch/studyforge-drp/server/data/verified-brands.json) where an official public channel could not be 100% verified via the brand's primary website navigation links. Per the BrandShield AI data integrity protocol, these fields are marked as `null` with `verificationStatus: "UNVERIFIED_NEEDS_MANUAL_CHECK"`.

---

## 1. Unverified Items Requiring Manual Review

| Brand | Asset Type | Candidate / Platform | Current Status | Reason / Recommended Manual Verification Action |
| :--- | :--- | :--- | :--- | :--- |
| **HDFC Bank** | Social Account | Telegram Channel | `UNVERIFIED_NEEDS_MANUAL_CHECK` (`handle: null`) | HDFC Bank's official website does not link to an official public Telegram broadcasting channel on its homepage footer. Check whether corporate communications operates an official broadcast channel before adding to allowlist. |
| **PhonePe** | Social Account | Telegram Channel | `UNVERIFIED_NEEDS_MANUAL_CHECK` (`handle: null`) | PhonePe's official portal links to X, Facebook, LinkedIn, Instagram, and YouTube, but no public Telegram support channel is officially declared. Verify if any community group exists or treat all Telegram handles as unauthorized. |
| **Flipkart** | Social Account | Telegram Channel | `UNVERIFIED_NEEDS_MANUAL_CHECK` (`handle: null`) | Flipkart does not publish an official customer support channel on Telegram. Numerous scam discount channels operate on Telegram imitating Flipkart; manual validation required before allowlisting any handle. |
| **HDFC Bank** | Apple App Store | Corporate Banking App | `UNVERIFIED_NEEDS_MANUAL_CHECK` (`packageId: null`) | Retail MobileBanking and PayZapp are confirmed. Corporate trade/CMS app IDs on iOS require secondary corporate banking portal verification. |

---

## 2. Verified Allowlist Items Summary

The following assets were verified directly against primary brand portals:

### HDFC Bank Limited (`hdfcbank.com`)
- **Official Domains:** `hdfcbank.com`, `hdfc.com`, `payzapp.in`
- **Social Handles:** X (`@HDFC_Bank`), Facebook (`@HDFC.bank`), LinkedIn (`@hdfc-bank`), Instagram (`@hdfcbank`)
- **Mobile Apps (Google Play):**
  - `HDFC Bank MobileBanking` (`com.snapwork.hdfc` — Publisher: `HDFC Bank Ltd.`)
  - `PayZapp by HDFC Bank` (`com.enstage.wibmo.hdfc` — Publisher: `HDFC Bank Ltd.`)
- **Mobile Apps (iOS App Store):**
  - `HDFC Bank MobileBanking` (`com.hdfcbank.mobilebanking` — Publisher: `HDFC Bank Limited`)

### PhonePe Private Limited (`phonepe.com`)
- **Official Domains:** `phonepe.com`, `phonepe.in`
- **Social Handles:** X (`@PhonePe`), Facebook (`@PhonePe`), LinkedIn (`@phonepe-internet`), Instagram (`@phonepe`)
- **Mobile Apps (Google Play):**
  - `PhonePe: UPI, Recharges & Pay` (`com.phonepe.app` — Publisher: `PhonePe`)
  - `PhonePe Business` (`com.phonepe.app.business` — Publisher: `PhonePe`)
- **Mobile Apps (iOS App Store):**
  - `PhonePe: Secure UPI & Recharge` (`com.phonepe.app` — Publisher: `PhonePe Private Limited`)

### Flipkart Internet Private Limited (`flipkart.com`)
- **Official Domains:** `flipkart.com`, `flixcart.com`
- **Social Handles:** X (`@Flipkart`), Facebook (`@Flipkart`), LinkedIn (`@flipkart`), Instagram (`@flipkart`)
- **Mobile Apps (Google Play):**
  - `Flipkart: Online Shopping App` (`com.flipkart.android` — Publisher: `Flipkart`)
  - `Flipkart Seller Hub` (`com.flipkart.seller` — Publisher: `Flipkart`)
- **Mobile Apps (iOS App Store):**
  - `Flipkart: Online Shopping App` (`com.flipkart.iphone` — Publisher: `Flipkart Internet Private Limited`)

---

## 3. Synthetic Test Data Policy
All records located in [`server/data/synthetic-test-data.json`](file:///Users/mohammadariz01/.gemini/antigravity/scratch/studyforge-drp/server/data/synthetic-test-data.json) are synthetic test artifacts generated solely for detection benchmarking. They are tagged with `dataClass: "SYNTHETIC_TEST_DATA"` and strictly reside on reserved domain spaces (`*.example.com`, `*.example.org`, `*.invalid`). They do not represent live online entities.
