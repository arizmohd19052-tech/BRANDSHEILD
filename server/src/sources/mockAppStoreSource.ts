/**
 * [sources/mockAppStoreSource.ts]
 * App Store Candidate Adapter (Google Play Store & Apple App Store).
 * Detects counterfeit mobile applications, unauthorized publishers, and logo clones.
 */

import { BrandProfile, Candidate, SourceHealth } from '../db/schema.js';
import { SourceAdapter } from './types.js';

export class MockAppStoreSource implements SourceAdapter {
  id = 'appstore-adapter-cluster';
  name = 'Global Mobile App Store Harvester';
  type: 'appstore' = 'appstore';

  async getStatus(): Promise<SourceHealth> {
    return {
      sourceId: this.id,
      name: this.name,
      type: 'appstore',
      status: 'ok',
      lastChecked: new Date().toISOString(),
      candidatesCount: 4,
      latencyMs: 165,
    };
  }

  async fetchCandidates(profile: BrandProfile): Promise<Candidate[]> {
    try {
      const candidates: Candidate[] = [
        // 1. Official App (Matches allowlist - Must be excluded)
        {
          id: 'cand-app-official-play',
          sourceId: 'google-play-store',
          sourceType: 'appstore',
          platform: 'Google Play Store',
          name: 'Acme Mobile Banking',
          packageId: 'com.acme.banking',
          developerName: 'Acme Financial Corp',
          profileUrl: 'https://play.google.com/store/apps/details?id=com.acme.banking',
          avatarUrl: profile.officialLogoUrl,
          description: 'Official banking app for Acme Bank customers. Check balances, deposit checks, and transfer money securely.',
          downloads: '5,000,000+',
          category: 'Finance',
          discoveredAt: new Date().toISOString(),
        },

        // 2. High-Risk Counterfeit App: 'Acme Mobile QuickLoan' (Unauthorized Publisher Mismatch)
        {
          id: 'cand-app-fake-loan',
          sourceId: 'google-play-store',
          sourceType: 'appstore',
          platform: 'Google Play Store',
          name: 'Acme Mobile QuickLoan',
          packageId: 'com.acme.quickloans.fastcash',
          developerName: 'Acme Fintech LLC',
          profileUrl: 'https://play.google.com/store/apps/details?id=com.acme.quickloans.fastcash',
          avatarUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80',
          description: 'Instant 0% interest loans for Acme cardholders. Fast approval in 5 minutes. Enter your online banking credentials to verify eligibility.',
          downloads: '50,000+',
          category: 'Finance',
          discoveredAt: new Date().toISOString(),
        },

        // 3. Scam Points App on Apple App Store
        {
          id: 'cand-app-scam-rewards',
          sourceId: 'apple-app-store',
          sourceType: 'appstore',
          platform: 'Apple App Store',
          name: 'Acme Bank Rewards & Points',
          packageId: 'com.rewards.acmebank.free',
          developerName: 'Global Promo Apps',
          profileUrl: 'https://apps.apple.com/app/id987654321',
          avatarUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
          description: 'Claim your Acme cash back points and gift cards. Free giveaway for bank members. Wire transfer support provided.',
          downloads: '10,000+',
          category: 'Lifestyle / Rewards',
          discoveredAt: new Date().toISOString(),
        },

        // 4. Benign Unrelated Utility App: 'Acme Plumbing Calculator' (Should NOT be over-flagged)
        {
          id: 'cand-app-unrelated-plumbing',
          sourceId: 'google-play-store',
          sourceType: 'appstore',
          platform: 'Google Play Store',
          name: 'Acme Plumbing Pro Tool',
          packageId: 'com.acme.plumbing.calculator',
          developerName: 'Acme Tools Corp',
          profileUrl: 'https://play.google.com/store/apps/details?id=com.acme.plumbing.calculator',
          avatarUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=128&auto=format&fit=crop&q=80',
          description: 'Pipe sizing, flow rate calculations, and friction loss estimator for professional HVAC and plumbing technicians.',
          downloads: '25,000+',
          category: 'Tools',
          discoveredAt: new Date().toISOString(),
        },
      ];

      return candidates;
    } catch (error: any) {
      console.error(`[sources/mockAppStoreSource.ts] Error generating candidates: ${error.message}`);
      return [];
    }
  }
}
