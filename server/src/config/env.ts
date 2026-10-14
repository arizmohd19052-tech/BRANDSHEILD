/**
 * [config/env.ts]
 * Central environment configuration loader for BrandShield AI.
 * Loads dotenv from server/.env if present, but provides resilient defaults
 * so the application works completely out-of-the-box with NO .env file.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt to load .env if present; ignore if missing
try {
  const serverEnvPath = path.resolve(__dirname, '../../.env');
  const rootEnvPath = path.resolve(__dirname, '../../../.env');
  dotenv.config({ path: serverEnvPath });
  dotenv.config({ path: rootEnvPath });
} catch {
  // Gracefully continue with defaults
}

export interface EnvConfig {
  PORT: number;
  HOST: string;
  NODE_ENV: string;
  CLIENT_URL: string;
  CORS_ORIGINS?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  GEMINI_FALLBACK_MODEL?: string;
}

const rawModel = process.env.GEMINI_MODEL?.trim();
const sanitizedModel =
  rawModel && rawModel !== 'MODEL_NAME' && !rawModel.includes(' ') && !rawModel.includes('<')
    ? rawModel
    : 'gemini-3.8-flash';

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || '127.0.0.1',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CORS_ORIGINS: process.env.CORS_ORIGINS?.trim(),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim(),
  GEMINI_MODEL: sanitizedModel,
  GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL?.trim() || undefined,
};

