/**
 * [sources/mockSocialSource.ts]
 * Social Media Candidate Adapter (X, Instagram, Facebook, LinkedIn, Telegram).
 * Generates realistic impersonation candidates, benign entities, and official accounts.
 */

import { BrandProfile, Candidate, SourceHealth } from '../db/schema.js';
import { SourceAdapter } from './types.js';

export class MockSocialSource implements SourceAdapter {
  id = 'social-adapter-cluster';
  name = 'Social Media Intelligence Cluster';
  type: 'social' = 'social';

  async getStatus(): Promise<SourceHealth> {
    return {
      sourceId: this.id,
      name: this.name,
      type: 'social',
      status: 'ok',
      lastChecked: new Date().toISOString(),
      candidatesCount: 6,
      latencyMs: 110,
    };
  }

  async fetchCandidates(profile: BrandProfile): Promise<Candidate[]> {
    try {
      const candidates: Candidate[] = [
        // 1. Official Account (Matches allowlist - Must be excluded)
        {
          id: 'cand-soc-official',
          sourceId: 'x-social',
          sourceType: 'social',
          platform: 'X (Twitter)',
          name: profile.brandName,
          handle: 'acmebank',
          profileUrl: 'https://x.com/acmebank',
          avatarUrl: profile.officialLogoUrl,
          description: 'Official verified account of Acme Bank. Member FDIC. Equal Housing Lender.',
          followers: 245000,
          category: 'Finance',
          discoveredAt: new Date().toISOString(),
        },

        // 2. Homoglyph Threat: 'Acrne Bank' ('rn' for 'm') - High Threat
        {
          id: 'cand-soc-homoglyph',
          sourceId: 'x-social',
          sourceType: 'social',
          platform: 'X (Twitter)',
          name: 'Acrne Bank',
          handle: 'acrnebank',
          profileUrl: 'https://x.com/acrnebank',
          avatarUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80',
          description: 'Official customer support for all Acme cardholders. DM for refund and account verification.',
          followers: 1240,
          category: 'Banking Support',
          discoveredAt: new Date().toISOString(),
        },

        // 3. Typo + Added Word Impersonator: 'Acme Bnak Support'
        {
          id: 'cand-soc-typo-support',
          sourceId: 'instagram-social',
          sourceType: 'social',
          platform: 'Instagram',
          name: 'Acme Bnak Support',
          handle: 'acme_bnak_support',
          profileUrl: 'https://instagram.com/acme_bnak_support',
          avatarUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
          description: '24/7 Acme Bank claims and complaints center. Urgent verification required or account suspended. Click link in bio.',
          followers: 890,
          category: 'Customer Care',
          discoveredAt: new Date().toISOString(),
        },

        // 4. Spacing Anomaly: 'A c m e Bank Official'
        {
          id: 'cand-soc-spacing-official',
          sourceId: 'facebook-social',
          sourceType: 'social',
          platform: 'Facebook',
          name: 'A c m e Bank Official',
          handle: 'acme_bank_official_page',
          profileUrl: 'https://facebook.com/acme_bank_official_page',
          avatarUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80',
          description: 'Acme Bank customer rewards portal. Giveaway for existing users. Win cash prize by verifying credentials.',
          followers: 3400,
          category: 'Financial Services',
          discoveredAt: new Date().toISOString(),
        },

        // 5. Unrelated Legitimate Business: 'Acme Bakery & Cafe' (Should NOT be over-flagged)
        {
          id: 'cand-soc-unrelated-bakery',
          sourceId: 'instagram-social',
          sourceType: 'social',
          platform: 'Instagram',
          name: 'Acme Bakery & Cafe',
          handle: 'acmebakery',
          profileUrl: 'https://instagram.com/acmebakery',
          avatarUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=128&auto=format&fit=crop&q=80',
          description: 'Artisan sourdough, pastries, and specialty espresso roasted in-house. Open Mon-Sun 7am-4pm.',
          followers: 18500,
          category: 'Food & Beverage',
          discoveredAt: new Date().toISOString(),
        },

        // 6. Suspicious Phishing Bot on LinkedIn
        {
          id: 'cand-soc-linkedin-fake',
          sourceId: 'linkedin-social',
          sourceType: 'social',
          platform: 'LinkedIn',
          name: 'Acme Corporate Recruiting & Wealth',
          handle: 'acme-wealth-careers',
          profileUrl: 'https://linkedin.com/company/acme-wealth-careers',
          avatarUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
          description: 'Official talent management for Acme Bank. Immediate remote financial analyst openings. WhatsApp +1-800-CLAIM.',
          followers: 430,
          category: 'Staffing',
          discoveredAt: new Date().toISOString(),
        },
      ];

      return candidates;
    } catch (error: any) {
      console.error(`[sources/mockSocialSource.ts] Error generating candidates: ${error.message}`);
      return [];
    }
  }
}
