/**
 * [detection/scamSignals.ts]
 * Scam Vocabulary & Social Phishing Signal Detector.
 * Identifies high-risk behavioral patterns in profiles, bios, and descriptions.
 */

import { getDetectionConfig } from '../config/detection.config.js';

export interface ScamSignalResult {
  score: number; // 0 - 100
  hasScamSignals: boolean;
  detectedPhrases: string[];
  reasons: string[];
}

export function detectScamSignals(description: string, handle = ''): ScamSignalResult {
  try {
    const config = getDetectionConfig();
    const textToScan = `${description} ${handle}`.toLowerCase();
    const detectedPhrases: string[] = [];
    const reasons: string[] = [];

    // Scan for scam phrases from config
    for (const phrase of config.keywords.scamSignals) {
      if (textToScan.includes(phrase)) {
        detectedPhrases.push(phrase);
      }
    }

    // Additional urgency and social engineering patterns
    const regexPatterns: Array<{ regex: RegExp; label: string }> = [
      { regex: /whatsapp[:\s\+\d]+/i, label: 'Off-platform WhatsApp redirection' },
      { regex: /telegram[:\s@\w]+/i, label: 'Off-platform Telegram bot redirection' },
      { regex: /dm\s+(me|us|here)\s+(for|to)\s+(resolve|claim|refund|instant)/i, label: 'Unsolicited direct message resolution prompt' },
      { regex: /dm\s+us\s+your\s+otp/i, label: 'Credential / OTP harvesting solicitations' },
      { regex: /(account|card)\s+will\s+be\s+blocked/i, label: 'Urgent account deactivation threat' },
      { regex: /0%\s*interest\s*instant/i, label: 'Predatory instant financial claim' },
      { regex: /send\s+(eth|btc|crypto|sol)/i, label: 'Cryptocurrency transfer demand' },
      { regex: /verify\s+(your\s+)?(identity|wallet|credentials|account)/i, label: 'Coercive credential verification call-to-action' },
    ];

    for (const p of regexPatterns) {
      if (p.regex.test(textToScan)) {
        detectedPhrases.push(p.label);
      }
    }

    let score = 0;
    if (detectedPhrases.length > 0) {
      score = Math.min(100, detectedPhrases.length * 35);
      reasons.push(
        `[SCAM_BEHAVIOR] Detected ${detectedPhrases.length} social engineering indicators: "${detectedPhrases.join('; ')}"`
      );
    } else {
      reasons.push('[CLEAN_BIO] No overt phishing or scam keywords detected in description');
    }

    return {
      score,
      hasScamSignals: detectedPhrases.length > 0,
      detectedPhrases,
      reasons,
    };
  } catch (error: any) {
    console.error(`[detection/scamSignals.ts] Error detecting scam signals: ${error.message}`);
    return {
      score: 0,
      hasScamSignals: false,
      detectedPhrases: [],
      reasons: [`[SCAM_ERROR] Evaluation error: ${error.message}`],
    };
  }
}
