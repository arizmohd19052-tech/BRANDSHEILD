/**
 * [server/scripts/seed.ts]
 * Idempotent seeder script for BrandShield AI demo dataset.
 * Verifies verified-brands.json and synthetic-test-data.json are healthy,
 * initializes user-submitted-data.json, and prints dataset diagnostics.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

function seedDatabase() {
  console.log('[server/scripts/seed.ts] Starting idempotent database seed...');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`[server/scripts/seed.ts] Created data directory: ${dataDir}`);
  }

  const brandsPath = path.join(dataDir, 'verified-brands.json');
  const syntheticPath = path.join(dataDir, 'synthetic-test-data.json');
  const userSubmittedPath = path.join(dataDir, 'user-submitted-data.json');
  const feedbackPath = path.join(dataDir, 'feedbacks.json');

  if (!fs.existsSync(brandsPath)) {
    console.error(`[server/scripts/seed.ts] ERROR: Missing verified brands file at ${brandsPath}`);
    process.exit(1);
  }

  const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf-8'));
  console.log(`[server/scripts/seed.ts] Verified Brands: ${brands.length} (${brands.map((b: any) => b.brandName).join(', ')})`);

  if (!fs.existsSync(syntheticPath)) {
    console.error(`[server/scripts/seed.ts] ERROR: Missing synthetic test data file at ${syntheticPath}`);
    process.exit(1);
  }

  const synthetic = JSON.parse(fs.readFileSync(syntheticPath, 'utf-8'));
  console.log(`[server/scripts/seed.ts] Synthetic Test Records: ${synthetic.length}`);

  if (!fs.existsSync(userSubmittedPath)) {
    fs.writeFileSync(userSubmittedPath, '[]', 'utf-8');
    console.log('[server/scripts/seed.ts] Initialized empty user-submitted-data.json');
  }

  if (!fs.existsSync(feedbackPath)) {
    fs.writeFileSync(feedbackPath, '[]', 'utf-8');
    console.log('[server/scripts/seed.ts] Initialized empty feedbacks.json');
  }

  console.log('[server/scripts/seed.ts] Database seed completed successfully.');
}

seedDatabase();
