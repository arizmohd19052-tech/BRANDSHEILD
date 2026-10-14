/**
 * [server/src/index.ts]
 * Express Server Entry Point for BrandShield AI — AI-Powered Digital Brand Protection.
 * Listens explicitly on 127.0.0.1 to avoid IPv4/IPv6 localhost mismatch.
 * Registers process-level unhandledRejection and uncaughtException handlers with file tags.
 */

// 1. MUST BE IMPORTED FIRST: loads environment variables or falls back gracefully
import { env } from './config/env.js';

// Process-level exception and rejection handlers with file tags
process.on('uncaughtException', (err: Error) => {
  console.error(`[server/src/index.ts] UNCAUGHT EXCEPTION: ${err.message}`, err.stack);
  // Log and keep server alive for non-fatal runtime anomalies
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error(`[server/src/index.ts] UNHANDLED PROMISE REJECTION:`, reason);
});

import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { scanRouter } from './routes/scan.routes.js';
import { lookalikeRouter } from './routes/lookalike.routes.js';
import { configRouter } from './routes/config.routes.js';
import { ingestRouter } from './routes/ingest.routes.js';
import { feedbackRouter } from './routes/feedback.routes.js';
import { enrichRouter } from './routes/enrich.routes.js';
import { getAIHealthStatus, probeAIHealth, resolveModelName } from './services/gemini.service.js';
import { db } from './db/index.js';

const app = express();
const port = env.PORT;
const HOST = env.HOST || '127.0.0.1';
const clientUrl = env.CLIENT_URL;

// Configure comprehensive CORS support (localhost, 127.0.0.1, custom ports, and CORS_ORIGINS)
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  env.CLIENT_URL,
];

if (env.CORS_ORIGINS) {
  env.CORS_ORIGINS.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !defaultAllowedOrigins.includes(trimmed)) {
      defaultAllowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins (including any localhost/127.0.0.1 port)
    if (!origin || defaultAllowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for local dev testing
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204,
}));

app.use(express.json({ limit: '2mb' }));

// API Routers
app.use('/api/health', healthRouter);
app.use('/api/profile', profileRouter);
app.use('/api', scanRouter);
app.use('/api/lookalike', lookalikeRouter);
app.use('/api/config', configRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/enrich', enrichRouter);

// Global Error Handler with File Tagging & Structured JSON Guarantee
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof err.statusCode === 'number' ? err.statusCode : typeof err.status === 'number' ? err.status : 500;
  console.error(`[server/src/index.ts] Unhandled Application Error (${status}): ${err.message}`, err.stack);
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
    source: 'server/src/index.ts',
    file: 'server/src/index.ts',
    details: err.details || err.message || null,
  });
});

// Only start standalone listener if not imported as a serverless function handler or test module
const isMainModule = !process.env.VERCEL && process.env.NODE_ENV !== 'test' && (
  !process.argv[1] ||
  process.argv[1].endsWith('index.ts') ||
  process.argv[1].endsWith('index.js')
);

let server: any = null;
if (isMainModule) {
  try {
    server = app.listen(port, HOST, async () => {
      const detections = db.getDetections();
      const excluded = db.getExcludedAssets();
      const initialModel = resolveModelName();
      console.log(`[server/src/index.ts] BrandShield AI Server running on http://${HOST}:${port}`);
      console.log(`[server/src/index.ts] Mode: Demo Dataset (Verified Public + Synthetic Test Cases)`);
      console.log(`[server/src/index.ts] Initialized ${detections.length} candidate records, ${excluded.length} official assets excluded.`);

      // Lightweight live AI health probe on boot
      try {
        const probe = await probeAIHealth();
        if (probe.status === 'AVAILABLE') {
          console.log(`[server/src/index.ts] AI Enrichment Status: AVAILABLE (model ${probe.model} verified)`);
        } else {
          console.log(`[server/src/index.ts] AI Enrichment Status: ${probe.status} (Model: ${probe.model} - ${probe.message})`);
        }
      } catch (probeErr: any) {
        console.warn(`[server/src/index.ts] AI Enrichment Probe error: ${probeErr.message}`);
      }
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[server/src/index.ts] FATAL: Port ${port} is already in use by another process.`);
        console.error(`To free port ${port}, run:`);
        console.error(`  lsof -ti:${port} | xargs kill -9\n`);
        process.exit(1);
      } else {
        console.error(`[server/src/index.ts] Server listener error: ${err.message}`);
      }
    });
  } catch (startupErr: any) {
    console.error(`[server/src/index.ts] FATAL: Failed to start HTTP server: ${startupErr.message}`, startupErr.stack);
    process.exit(1);
  }
}

export { app };
export default app;
