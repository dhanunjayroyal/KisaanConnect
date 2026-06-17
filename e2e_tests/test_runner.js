/**
 * KisaanConnect — Unified E2E Report Compiler
 * Merges Selenium + Appium CSVs → single E2E_Test_Report.csv
 * Run: node e2e_tests/test_runner.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'reports');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const selFile = path.join(dir, 'Selenium_Report.csv');
const appFile = path.join(dir, 'Appium_Report.csv');
const outFile = path.join(dir, 'E2E_Test_Report.csv');

function loadCsv(file) {
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf8').split('\n').slice(1).filter(Boolean);
}

const selRows = loadCsv(selFile);
const appRows = loadCsv(appFile);
const allRows = [...selRows, ...appRows];

const header = 'Test Case ID,Test Type,Category,Test Description,Status,Notes\n';
fs.writeFileSync(outFile, header + allRows.join('\n') + '\n', 'utf8');

const pass = allRows.filter(r => r.includes(',PASS,')).length;
const fail = allRows.filter(r => r.includes(',FAIL,')).length;

console.log('\n📊 KisaanConnect E2E Combined Report');
console.log('═'.repeat(50));
console.log(`   Selenium : ${selRows.length} cases`);
console.log(`   Appium   : ${appRows.length} cases`);
console.log(`   Total    : ${allRows.length} | PASS: ${pass} | FAIL: ${fail}`);
console.log(`\n💾 Saved → ${outFile}`);
