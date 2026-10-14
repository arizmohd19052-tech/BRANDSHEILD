/**
 * [sources/types.ts]
 * Data Source Adapter Layer Interfaces.
 */

import { BrandProfile, Candidate, SourceHealth } from '../db/schema.js';

export interface SourceAdapter {
  id: string;
  name: string;
  type: 'social' | 'appstore';
  getStatus(): Promise<SourceHealth>;
  fetchCandidates(profile: BrandProfile): Promise<Candidate[]>;
}
