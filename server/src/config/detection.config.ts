/**
 * [config/detection.config.ts]
 * Detection weights, similarity thresholds, and risk scoring configuration.
 * All parameters can be tuned dynamically via the UI (GET/PUT /api/config).
 */

export interface DetectionConfig {
  weights: {
    nameSimilarity: number;     // Weight for name / homoglyph match (0.0 - 1.0)
    logoSimilarity: number;     // Weight for logo perceptual similarity (0.0 - 1.0)
    publisherMismatch: number;  // Weight for app publisher discrepancy (0.0 - 1.0)
    scamSignals: number;        // Weight for phishing keywords / scam bio phrases (0.0 - 1.0)
    handleAnomaly: number;      // Weight for deceptive handle patterns (0.0 - 1.0)
  };
  thresholds: {
    lookalikeMatch: number;     // Threshold to consider a name an impersonation variation (e.g. 0.70)
    logoMatch: number;          // Threshold for logo suspicion (e.g. 0.65)
    unrelatedPenalty: number;   // Deduction factor when category/keywords indicate an unrelated entity
    severity: {
      critical: number;         // Score >= critical (e.g. 80)
      high: number;             // Score >= high (e.g. 60)
      medium: number;           // Score >= medium (e.g. 40)
      low: number;              // Score >= low (e.g. 20)
    };
  };
  keywords: {
    impersonationSuffixes: string[];
    scamSignals: string[];
    suspiciousHandles: string[];
  };
}

export const defaultDetectionConfig: DetectionConfig = {
  weights: {
    nameSimilarity: 0.35,
    logoSimilarity: 0.25,
    publisherMismatch: 0.20,
    scamSignals: 0.12,
    handleAnomaly: 0.08,
  },
  thresholds: {
    lookalikeMatch: 0.68,
    logoMatch: 0.65,
    unrelatedPenalty: 0.45,
    severity: {
      critical: 78,
      high: 58,
      medium: 38,
      low: 18,
    },
  },
  keywords: {
    impersonationSuffixes: [
      'support', 'official', 'help', 'helpdesk', 'care', 'customer care',
      'customer service', 'refund', 'claims', 'rewards', 'verify', 'verification',
      'login', 'secure', 'portal', 'alert', 'team', 'direct', 'hq'
    ],
    scamSignals: [
      'giveaway', 'dm for refund', 'send private key', 'free crypto',
      'urgent verification required', 'account suspended', 'click link in bio',
      'customer support whatsapp', 'instant loan 0% interest', 'guaranteed profit',
      'limited time offer claim now', 'win cash prize', 'wire transfer support'
    ],
    suspiciousHandles: [
      '_support', '_official', 'helpdesk', 'real_', 'theofficial',
      'custcare', 'verify_', '_claims', '24x7', 'bot_'
    ],
  },
};

let currentConfig: DetectionConfig = JSON.parse(JSON.stringify(defaultDetectionConfig));

export function getDetectionConfig(): DetectionConfig {
  return currentConfig;
}

export function updateDetectionConfig(newConfig: Partial<DetectionConfig>): DetectionConfig {
  try {
    currentConfig = {
      ...currentConfig,
      ...newConfig,
      weights: { ...currentConfig.weights, ...(newConfig.weights || {}) },
      thresholds: {
        ...currentConfig.thresholds,
        ...(newConfig.thresholds || {}),
        severity: { ...currentConfig.thresholds.severity, ...(newConfig.thresholds?.severity || {}) },
      },
      keywords: {
        ...currentConfig.keywords,
        ...(newConfig.keywords || {}),
      },
    };
    return currentConfig;
  } catch (error: any) {
    console.error(`[config/detection.config.ts] Error updating configuration: ${error.message}`);
    throw error;
  }
}
