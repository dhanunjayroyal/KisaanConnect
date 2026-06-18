'use strict';

const http  = require('http');
const https = require('https');
const ExcelJS = require('exceljs');
const path  = require('path');
const fs    = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL     = process.env.BASE_URL || 'http://localhost:3000';
const VIRTUAL_USERS = 100;
const DURATION_SEC  = 60;

// Endpoints to hit during the test
const ENDPOINTS = [
  { method: 'GET',  path: '/api/health'   },
  { method: 'GET',  path: '/api/ping'     },
  { method: 'GET',  path: '/api/products' },
  { method: 'GET',  path: '/api/users'    },
  { method: 'GET',  path: '/'             },
];

// ── HTTP request ──────────────────────────────────────────────────────────────
function request(endpoint) {
  return new Promise((resolve) => {
    const url    = new URL(BASE_URL + endpoint.path);
    const lib    = url.protocol === 'https:' ? https : http;
    const start  = Date.now();

    const req = lib.request({
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname,
      method:   endpoint.method,
      timeout:  10000,
      headers:  { 'User-Agent': 'KisaanConnect-LoadTest/1.0' },
    }, (res) => {
      res.resume(); // drain body
      res.on('end', () => resolve(Date.now() - start));
    });

    req.on('timeout', () => { req.destroy(); resolve(10000); });
    req.on('error',   () => resolve(Date.now() - start));
    req.end();
  });
}

// ── Virtual user loop ─────────────────────────────────────────────────────────
async function virtualUser(endAt, times) {
  let i = 0;
  while (Date.now() < endAt) {
    const ep  = ENDPOINTS[i % ENDPOINTS.length];
    const ms  = await request(ep);
    times.push(ms);
    i++;
    await new Promise(r => setTimeout(r, 50 + Math.random() * 200));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   🌾  KisaanConnect  —  Baseline / Load Test');
  console.log('════════════════════════════════════════════════════');
  console.log(`   Virtual Users : ${VIRTUAL_USERS}`);
  console.log(`   Duration      : ${DURATION_SEC} seconds`);
  console.log(`   Target        : ${BASE_URL}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  // Check server
  try {
    await request(ENDPOINTS[0]);
    console.log('   ✅  Server is reachable — starting test...\n');
  } catch {
    console.error('   ❌  Cannot reach server. Start it first: node server.js');
    process.exit(1);
  }

  const times   = [];
  const startMs = Date.now();
  const endAt   = startMs + DURATION_SEC * 1000;

  // Live progress ticker
  const ticker = setInterval(() => {
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);
    const rps     = (times.length / Math.max(1, (Date.now() - startMs) / 1000)).toFixed(1);
    process.stdout.write(`\r   ⏱  ${elapsed}s  |  📨 ${times.length} requests  |  ⚡ ${rps} RPS   `);
  }, 1000);

  // Launch 100 virtual users
  await Promise.all(
    Array.from({ length: VIRTUAL_USERS }, () => virtualUser(endAt, times))
  );

  clearInterval(ticker);
  process.stdout.write('\n');

  const totalSec = (Date.now() - startMs) / 1000;

  // ── Calculate ───────────────────────────────────────────────────────────────
  const sorted  = [...times].sort((a, b) => a - b);
  const total   = sorted.length;
  const rps     = (total / totalSec).toFixed(0);
  const avg     = Math.round(sorted.reduce((s, v) => s + v, 0) / total);
  const min     = sorted[0];
  const max     = sorted[sorted.length - 1];

  // ── Print exactly what the prompt shows ────────────────────────────────────
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   📊  RESULTS');
  console.log('════════════════════════════════════════════════════');
  console.log('');
  console.log('   Requests per second (RPS)');
  console.log(`   ${rps} req/sec`);
  console.log('');
  console.log('   Response Time');
  console.log(`   Average : ${avg} ms`);
  console.log(`   Min     : ${min} ms`);
  console.log(`   Max     : ${max} ms`);
  console.log('');
  console.log('════════════════════════════════════════════════════');

  // ── Excel report ────────────────────────────────────────────────────────────
  await saveExcel({ rps, avg, min, max, total, totalSec });
}

async function saveExcel({ rps, avg, min, max, total, totalSec }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'KisaanConnect Load Test';
  wb.created = new Date();

  const ws = wb.addWorksheet('Load Test Results');

  // Column widths
  ws.columns = [
    { key: 'label', width: 34 },
    { key: 'value', width: 22 },
  ];

  // Styles
  const GREEN       = 'FF1B5E20';
  const LIGHT_GREEN = 'FFE8F5E9';
  const WHITE       = 'FFFFFFFF';
  const border = {
    top:    { style: 'thin', color: { argb: 'FFBDBDBD' } },
    left:   { style: 'thin', color: { argb: 'FFBDBDBD' } },
    bottom: { style: 'thin', color: { argb: 'FFBDBDBD' } },
    right:  { style: 'thin', color: { argb: 'FFBDBDBD' } },
  };

  function addTitle(text) {
    ws.mergeCells(`A${ws.rowCount + 1}:B${ws.rowCount + 1}`);
    const r = ws.lastRow;
    r.getCell(1).value = text;
    r.getCell(1).font  = { name: 'Calibri', bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    r.getCell(1).fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r.height = 42;
  }

  function addSubtitle(text) {
    ws.mergeCells(`A${ws.rowCount + 1}:B${ws.rowCount + 1}`);
    const r = ws.lastRow;
    r.getCell(1).value = text;
    r.getCell(1).font  = { name: 'Calibri', italic: true, size: 11, color: { argb: 'FFFFFFFF' } };
    r.getCell(1).fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r.height = 22;
  }

  function addSection(heading) {
    ws.addRow([]);
    ws.mergeCells(`A${ws.rowCount + 1}:B${ws.rowCount + 1}`);
    const r = ws.lastRow;
    r.getCell(1).value = heading;
    r.getCell(1).font  = { name: 'Calibri', bold: true, size: 13, color: { argb: GREEN } };
    r.getCell(1).fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREEN } };
    r.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    r.height = 28;
  }

  function addRow(label, value, alt) {
    const r = ws.addRow({ label, value });
    const fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: alt ? LIGHT_GREEN : WHITE } };
    r.getCell(1).fill      = fill;
    r.getCell(2).fill      = fill;
    r.getCell(1).font      = { name: 'Calibri', bold: true, size: 12 };
    r.getCell(2).font      = { name: 'Calibri', size: 12 };
    r.getCell(1).border    = border;
    r.getCell(2).border    = border;
    r.getCell(1).alignment = { vertical: 'middle', indent: 2 };
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    r.height = 26;
  }

  // ── Build the sheet ─────────────────────────────────────────────────────────
  addTitle('🌾  KisaanConnect — Baseline Load Test Results');
  addSubtitle(`Date: ${new Date().toLocaleString()}   |   Target: ${BASE_URL}`);

  // Section 1: Config
  addSection('⚙️   Test Configuration');
  addRow('Virtual Users',  `${VIRTUAL_USERS} users`,      false);
  addRow('Duration',       `${DURATION_SEC} seconds`,     true);
  addRow('Total Requests', `${total.toLocaleString()}`,   false);

  // Section 2: RPS
  addSection('⚡  Requests Per Second (RPS)');
  addRow('Requests per second (RPS)', `${rps} req/sec`, false);

  // Section 3: Response Time
  addSection('🕐  Response Time');
  addRow('Average', `${avg} ms`, false);
  addRow('Min (Fastest)', `${min} ms`, true);
  addRow('Max (Slowest)', `${max} ms`, false);

  // ── Save ────────────────────────────────────────────────────────────────────
  const outDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const stamp   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outFile = path.join(outDir, `LoadTest_${stamp}.xlsx`);
  await wb.xlsx.writeFile(outFile);

  console.log(`\n   📁  Excel saved to:\n       ${outFile}\n`);

  // Auto-open the file
  const { exec } = require('child_process');
  exec(`start "" "${outFile}"`);
}

main().catch(console.error);
