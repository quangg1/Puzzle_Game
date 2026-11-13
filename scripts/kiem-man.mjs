// Kiểm cả 16 màn: màn nào cũng phải GIẢI ĐƯỢC, lời giải phải thật sự thắng,
// và không màn nào (trừ màn dạy luật) được dễ quá.
// Chạy: node scripts/kiem-man.mjs
import assert from 'node:assert';
import { docMan } from '../nen.js';
import { giai, diLai } from './giai.mjs';
import lo from '../game/lo.js';
import thoiGian from '../game/thoi-gian.js';
import xoay from '../game/xoay.js';
import tachDoi from '../game/tach-doi.js';

const GAME = [lo, thoiGian, xoay, tachDoi];
const bang = [];
let hong = 0;

for (const game of GAME) {
  game.MAN.forEach((m, i) => {
    const man = docMan(m.o);
    const t0 = Date.now();
    const kq = giai(game, man);
    const giay = ((Date.now() - t0) / 1000).toFixed(1);

    let ketLuan;
    if (kq.bi) { ketLuan = 'BÍ — không giải được'; hong++; }
    else if (kq.qua) { ketLuan = 'quá lớn, chưa kết luận'; hong++; }
    else {
      const lai = diLai(game, man, kq.duong);
      if (!lai.thang) { ketLuan = `SAI — ${lai.loi}`; hong++; }
      else if (kq.duong.length < 3 && i > 0) { ketLuan = 'dễ quá'; hong++; }
      else ketLuan = 'ok';
    }

    bang.push({
      Game: game.ten, Màn: i + 1,
      Nước: kq.duong?.length ?? '—', Nút: kq.nut, Giây: giay, 'Kết luận': ketLuan,
    });
  });
}

console.table(bang);
assert.ok(hong === 0, `${hong}/16 màn chưa đạt — xem cột Kết luận`);
console.log(`${bang.length}/${bang.length} màn giải được.`);
