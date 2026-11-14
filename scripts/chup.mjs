// Chụp vài màn của một game để soi phần nhìn. Cần server ở :4192.
// Chạy: node scripts/chup.mjs tach-doi 1,4,12 [thư-mục-ra]
//
// PHIM=ArrowUp,ArrowRight,... để đi vài nước trước khi chụp — cần thiết khi
// muốn soi thứ chỉ hiện sau khi chơi, như bản thân cũ ở Cuộn Phim.
//
// Tìm trình duyệt theo thứ tự: biến môi trường CHROME → bản playwright tự tải →
// chrome/chromium của máy. Nhờ vậy chạy được trên cả Windows, macOS và Linux;
// bản trước ghi cứng đường dẫn C:/Users nên rời máy đó là hỏng.
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [game = 'lo', ds = '1', ra = process.env.KIROCREW_SCRATCH ?? '.chup'] = process.argv.slice(2);
mkdirSync(ra, { recursive: true });

function timTrinhDuyet() {
  if (process.env.CHROME && existsSync(process.env.CHROME)) return process.env.CHROME;
  // bản playwright đã tải có thể cũ hơn bản thư viện — lấy cái có sẵn trong kho
  const kho = process.env.LOCALAPPDATA
    ? `${process.env.LOCALAPPDATA}/ms-playwright`
    : `${process.env.HOME}/.cache/ms-playwright`;
  if (existsSync(kho)) {
    const ban = readdirSync(kho).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
    if (ban)
      for (const p of [`${kho}/${ban}/chrome-win64/chrome.exe`, `${kho}/${ban}/chrome-linux/chrome`,
        `${kho}/${ban}/chrome-mac/Chromium.app/Contents/MacOS/Chromium`])
        if (existsSync(p)) return p;
  }
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'])
    if (existsSync(p)) return p;
  return null;
}

const duong = timTrinhDuyet();
const b = await chromium.launch(duong ? { executablePath: duong } : {});
const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
const loi = [];
p.on('pageerror', (e) => loi.push(String(e)));
p.on('console', (m) => m.type() === 'error' && loi.push(m.text()));
await p.goto('http://127.0.0.1:4192/#' + game);
await p.waitForTimeout(900);
const sau = `[data-san="${game}"] [data-lam="sau"]`;
let dang = 1;
for (const n of ds.split(',').map(Number)) {
  while (dang < n) { await p.click(sau); dang++; }
  await p.waitForTimeout(1100);
  if (process.env.PHIM) {
    await p.locator(`[data-san="${game}"] canvas`).click();
    for (const k of process.env.PHIM.split(',')) { await p.keyboard.press(k); await p.waitForTimeout(240); }
    await p.waitForTimeout(600);
  }
  const f = `${ra}/${game}-${n}.png`;
  await p.locator(`[data-san="${game}"]`).screenshot({ path: f });
  console.log(f);
}
if (loi.length) console.log('LỖI:', loi.join('\n'));
await b.close();
