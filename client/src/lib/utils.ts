/**
 * [client/src/lib/utils.ts]
 * Helper utilities for class merges, formatters, and CSV export for BrandShield AI.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Detection } from '../types/index.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function exportDetectionsToCSV(detections: Detection[], brandName: string): void {
  try {
    const headers = [
      'Record ID',
      'Data Class',
      'Brand Name',
      'Platform',
      'Account / App Name',
      'URL / Store Listing',
      'Publisher / Developer',
      'Name Similarity Score',
      'Logo Similarity Score',
      'Logo Similarity Reason',
      'Official Domain Match',
      'Risk Score',
      'Risk Level',
      'Reasons for Assessment',
      'Recommended Action',
      'Data Source',
      'Dataset Generated',
    ];

    const rows = detections.map((d) => [
      d.recordId || d.id,
      d.dataClass || 'SYNTHETIC_TEST_DATA',
      `"${(d.brandName || brandName).replace(/"/g, '""')}"`,
      `"${d.platform.replace(/"/g, '""')}"`,
      `"${(d.accountOrAppName || d.name || '').replace(/"/g, '""')}"`,
      `"${(d.urlOrListing || d.profileUrl || '').replace(/"/g, '""')}"`,
      `"${(d.publisherOrDeveloper || d.developerName || 'N/A').replace(/"/g, '""')}"`,
      d.nameSimilarityScore ?? 'N/A',
      d.logoSimilarityScore !== null ? d.logoSimilarityScore : 'null',
      `"${(d.logoSimilarityReason || 'No candidate logo asset available').replace(/"/g, '""')}"`,
      d.officialDomainMatch || 'No',
      d.riskScore,
      d.riskLevel || d.severity,
      `"${d.reasons.join(' | ').replace(/"/g, '""')}"`,
      `"${(d.recommendedAction || '').replace(/"/g, '""')}"`,
      d.dataSource,
      d.datasetGenerated || '2026-10-13T00:00:00Z',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `brandshield_${(brandName || 'all').toLowerCase().replace(/\s+/g, '_')}_detections_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: any) {
    console.error(`[client/src/lib/utils.ts] Failed to export CSV: ${error.message}`);
  }
}
