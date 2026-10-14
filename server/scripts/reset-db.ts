/**
 * [server/scripts/reset-db.ts]
 * Reset script for BrandShield AI storage engine.
 * Clears user-submitted demo records and feedbacks, restoring pure factory benchmark state.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

function resetDatabase() {
  console.log('[server/scripts/reset-db.ts] Resetting user-submitted datasets to default benchmark state...');

  const userSubmittedPath = path.join(dataDir, 'user-submitted-data.json');
  const feedbackPath = path.join(dataDir, 'feedbacks.json');

  if (fs.existsSync(userSubmittedPath)) {
    fs.writeFileSync(userSubmittedPath, '[]', 'utf-8');
    console.log('[server/scripts/reset-db.ts] Cleared user-submitted-data.json');
  }

  if (fs.existsSync(feedbackPath)) {
    fs.writeFileSync(feedbackPath, '[]', 'utf-8');
    console.log('[server/scripts/reset-db.ts] Cleared feedbacks.json');
  }

  console.log('[server/scripts/reset-db.ts] Reset complete. Pure verified & synthetic benchmark state restored.');
}

resetDatabase();
