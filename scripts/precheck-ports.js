#!/usr/bin/env node
/**
 * [scripts/precheck-ports.js]
 * Verifies that ports 4000 and 5173 are available before launching dev servers.
 * If occupied, exits loudly with the exact command to free them.
 */

import net from 'node:net';

const PORTS_TO_CHECK = [
  { port: 4000, name: 'Backend API Server' },
  { port: 5173, name: 'Vite Frontend Client' },
];

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function main() {
  const occupied = [];

  for (const { port, name } of PORTS_TO_CHECK) {
    const isFree = await checkPort(port);
    if (!isFree) {
      occupied.push({ port, name });
    }
  }

  if (occupied.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌  STARTUP BLOCKED: Port(s) already in use:');
    for (const { port, name } of occupied) {
      console.error(`    - Port ${port} (${name}) is occupied`);
    }
    console.error('\nTo free the port(s), run the following command in your terminal:');
    const portList = occupied.map(o => o.port).join(',');
    console.error(`    lsof -ti:${portList} | xargs kill -9`);
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
