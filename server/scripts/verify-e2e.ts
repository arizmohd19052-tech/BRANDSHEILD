/**
 * [server/scripts/verify-e2e.ts]
 * Automated end-to-end verification script for BrandShield AI server.
 * Boots server, checks endpoints, validates responses, and terminates cleanly.
 */

import http from 'node:http';
import { app } from '../src/index.js';

const PORT = 4000;
const HOST = '127.0.0.1';

function request(path: string, options: http.RequestOptions = {}, postData?: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: HOST,
        port: PORT,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const body = JSON.parse(data);
            resolve({ status: res.statusCode || 200, body });
          } catch {
            resolve({ status: res.statusCode || 200, body: data });
          }
        });
      }
    );

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runVerification() {
  console.log('[server/scripts/verify-e2e.ts] Starting test server listener...');
  const server = app.listen(PORT, HOST);

  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    console.log(`[server/scripts/verify-e2e.ts] Server listening on http://${HOST}:${PORT}`);

    // 1. Health endpoint
    console.log('\n--- 1. Testing GET /api/health ---');
    const health = await request('/api/health');
    console.log('Status:', health.status);
    console.log('Response:', JSON.stringify(health.body, null, 2));
    if (health.status !== 200 || health.body.db !== 'healthy' || health.body.brands < 4) {
      throw new Error(`Health check failed: expected db=healthy, brands>=4, got status ${health.status}`);
    }

    // 2. Verified Brands list
    console.log('\n--- 2. Testing GET /api/profile/brands ---');
    const brandsRes = await request('/api/profile/brands');
    console.log('Status:', brandsRes.status);
    console.log('Brands found:', brandsRes.body.brands?.map((b: any) => b.brandName));
    const brandNames = brandsRes.body.brands?.map((b: any) => b.brandName) || [];
    if (!brandNames.includes('HDFC Bank') || !brandNames.includes('Acme Bank')) {
      throw new Error('Brands list missing required brands');
    }

    // 3. Acme Bank Profile
    console.log('\n--- 3. Testing GET /api/profile?brandId=brand_acme ---');
    const acmeProfile = await request('/api/profile?brandId=brand_acme');
    console.log('Status:', acmeProfile.status);
    console.log('Acme Profile Name:', acmeProfile.body.data?.profile?.brandName);

    // 4. Acme Bank Detections
    console.log('\n--- 4. Testing GET /api/detections?brand=Acme%20Bank ---');
    const acmeDetections = await request('/api/detections?brand=Acme%20Bank');
    console.log('Status:', acmeDetections.status);
    console.log('Detections count for Acme Bank:', acmeDetections.body.detections?.length);

    // 5. Ingest Check: HDFC Bank
    console.log('\n--- 5. Testing POST /api/ingest/check (HDFC Bank impersonator) ---');
    const hdfcCheck = await request(
      '/api/ingest/check',
      { method: 'POST' },
      JSON.stringify({
        brandName: 'HDFC Bank',
        type: 'social',
        name: 'HDFC Bnak Customer Support 24x7',
        description: 'Official helpline. Verify your account now or it will be blocked. DM us your OTP for instant refund.',
      })
    );
    console.log('Status:', hdfcCheck.status);
    console.log('Risk Score:', hdfcCheck.body.detection?.riskScore);
    console.log('Risk Level:', hdfcCheck.body.detection?.riskLevel);
    console.log('Reasons:', hdfcCheck.body.detection?.reasons);
    if (hdfcCheck.status !== 200 || hdfcCheck.body.detection?.riskScore < 70) {
      throw new Error(`Ingest check expected High/Critical score for impersonator, got ${hdfcCheck.body.detection?.riskScore}`);
    }

    // 6. Ingest Check: Acme Bank
    console.log('\n--- 6. Testing POST /api/ingest/check (Acme Bank impersonator) ---');
    const acmeCheck = await request(
      '/api/ingest/check',
      { method: 'POST' },
      JSON.stringify({
        brandName: 'Acme Bank',
        type: 'social',
        name: 'Acme Bnak Support',
        description: '24/7 Acme Bank claims and complaints center. Urgent verification required or account suspended.',
      })
    );
    console.log('Status:', acmeCheck.status);
    console.log('Risk Score:', acmeCheck.body.detection?.riskScore);
    console.log('Risk Level:', acmeCheck.body.detection?.riskLevel);

    // 7. Validation test: empty name -> 400
    console.log('\n--- 7. Testing POST /api/ingest/check (Empty name validation) ---');
    const emptyCheck = await request(
      '/api/ingest/check',
      { method: 'POST' },
      JSON.stringify({
        brandName: 'HDFC Bank',
        type: 'social',
        name: '   ',
      })
    );
    console.log('Status:', emptyCheck.status);
    console.log('Error:', emptyCheck.body.error);
    if (emptyCheck.status !== 400) {
      throw new Error(`Expected status 400 for empty name, got ${emptyCheck.status}`);
    }

    console.log('\n✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  } finally {
    server.close();
    console.log('[server/scripts/verify-e2e.ts] Server shut down cleanly. Port 4000 released.');
  }
}

runVerification().catch((err) => {
  console.error('[server/scripts/verify-e2e.ts] FATAL:', err);
  process.exit(1);
});
