import { chromium } from 'playwright-core';
import { execSync } from 'child_process';

// Find the chromium binary
const result = execSync('where.exe chromium 2>nul || echo not-found', { encoding: 'utf8' }).trim();
let executablePath;

// Common paths
const possiblePaths = [
  'C:\\Users\\flick\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

for (const p of possiblePaths) {
  const fs = await import('fs');
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

if (!executablePath) {
  console.error('Chromium not found');
  process.exit(1);
}

const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ['--no-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page.goto('http://localhost:3456', { waitUntil: 'domcontentloaded' });

// BIOS phase
await page.waitForTimeout(2500);
await page.screenshot({ path: 'C:\\Users\\flick\\dlg-bookclub\\screenshot-bios.png' });
console.log('BIOS screenshot taken');

// DOS phase
await page.waitForTimeout(2500);
await page.screenshot({ path: 'C:\\Users\\flick\\dlg-bookclub\\screenshot-dos.png' });
console.log('DOS screenshot taken');

// Loading phase
await page.waitForTimeout(3000);
await page.screenshot({ path: 'C:\\Users\\flick\\dlg-bookclub\\screenshot-loading.png' });
console.log('Loading screenshot taken');

// Login dialog
await page.waitForTimeout(5000);
await page.screenshot({ path: 'C:\\Users\\flick\\dlg-bookclub\\screenshot-login.png' });
console.log('Login screenshot taken');

await browser.close();
