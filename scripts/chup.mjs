// Chụp vài màn của một game để soi phần nhìn. Cần server ở :4192.
// Chạy: node scripts/chup.mjs lo 1,4,12 [thư-mục-ra]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire('C:/Users/ADMIN/');
const { chromium } = require('playwright');

const [game = 'lo', ds = '1', ra = process.env.KIROCREW_SCRATCH ?? '.chup'] = process.argv.slice(2);
mkdirSync(ra, { recursive: true });
// Bản trình duyệt playwright đã tải có thể cũ hơn bản thư viện — lấy cái có sẵn.
import { readdirSync } from 'node:fs';
const kho = `${process.env.LOCALAPPDATA}/ms-playwright`;
const ban = readdirSync(kho).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const b = await chromium.launch(ban ? { executablePath: `${kho}/${ban}/chrome-win64/chrome.exe` } : {});
const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
const loi = [];
p.on('pageerror', (e) => loi.push(String(e)));
await p.goto(`http://127.0.0.1:4192/#${game}`);
await p.waitForTimeout(900);
const sau = `[data-san="${game}"] [data-lam="sau"]`;
let dang = 1;
for (const n of ds.split(',').map(Number)) {
  while (dang < n) { await p.click(sau); dang++; }
  await p.waitForTimeout(1100);
  const f = `${ra}/${game}-${n}.png`;
  await p.locator(`[data-san="${game}"]`).screenshot({ path: f });
  console.log(f);
}
if (loi.length) console.log('LỖI:', loi.join('\n'));
await b.close();
