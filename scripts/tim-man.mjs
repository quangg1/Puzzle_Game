// Dò màn cho cả 4 game rồi GHI THẲNG ra ../man.js.
// Điều kiện kép: giải được VÀ phải dùng tới cơ chế — thiếu vế sau thì ra một đống
// màn "giải được" mà đi vòng vòng không đụng luật.
// Chạy: node scripts/tim-man.mjs
import { writeFileSync } from 'node:fs';
import { MAN as MAN_CU } from '../man.js';
import { docMan } from '../nen.js';
import { giai, diLai, docDoHoc } from './giai.mjs';
import lo from '../game/lo.js';
import thoiGian from '../game/thoi-gian.js';
import xoay from '../game/xoay.js';
import tachDoi from '../game/tach-doi.js';

const MOI_GAME = 20;
const GIOI_HAN = Number(process.env.THU ?? 12000);   // THU=30000 node ... để quét kỹ hơn          // 1 màn dạy luật + 19 màn dò ra

let hat = 20261113;           // mầm cố định: chạy lại ra đúng bộ màn cũ
const rnd = () => ((hat = (hat * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function dungMan(khung, dat) {
  const o = khung.map((d) => [...d]);
  const san = [];
  khung.forEach((d, y) => [...d].forEach((c, x) => c === '.' && san.push([x, y])));
  for (let i = san.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [san[i], san[j]] = [san[j], san[i]];
  }
  let k = 0;
  for (const [ky, so] of Object.entries(dat))
    for (let i = 0; i < so; i++) {
      if (k >= san.length) return null;
      const [x, y] = san[k++];
      o[y][x] = ky;
    }
  return o.map((d) => d.join(''));
}

const VIEC = [
  {
    khoa: 'lo', game: lo,
    day: ['########', '#@1..1.#', '#......#', '########'],
    khung: [
      ['########', '#......#', '#......#', '#......#', '########'],
      ['#########', '#.......#', '#.......#', '#.......#', '#########'],
      ['########', '#......#', '#......#', '#......#', '#......#', '########'],
    ],
    dat: { '@': 1, '#': 4, '1': 3, '2': 2, '3': 2 }, min: 7, max: 30,
    dac: (c) => Math.max(...c.map((t) => t.nuot)) >= 3,     // hố buộc phải lớn lên
  },
  {
    khoa: 'thoiGian', game: thoiGian,
    day: ['#######', '#@...o#', '#.....#', '#X....#', '#######'],
    khung: [
      ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
      ['########', '#......#', '#......#', '#......#', '#......#', '########'],
      ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
    ],
    dat: { '@': 1, 'X': 1, 'o': 4, '#': 6 }, min: 9, max: 30,
    // phải đổi khung hình ít nhất 2 lần, tức thật sự dùng trục thời gian
    dac: (c) => c.filter((t, i) => i && t.y !== c[i - 1].y).length >= 2,
  },
  {
    khoa: 'xoay', game: xoay,
    day: ['.....', '.....', '..@..', '.....', '....X'],
    // BẮT BUỘC vuông, nếu không phép quay 90° không còn khớp lưới
    khung: [
      ['......', '......', '......', '......', '......', '......'],
      ['.......', '.......', '.......', '.......', '.......', '.......', '.......'],
    ],
    dat: { '@': 1, 'X': 1, 'o': 3, 'v': 3, '#': 3 }, min: 3, max: 20,
    dac: (c) => c.length >= 4,
  },
  {
    khoa: 'tachDoi', game: tachDoi,
    day: ['#######', '#@...X#', '#######'],
    khung: [
      ['#######', '#.....#', '#.....#', '#.....#', '#######'],
      ['########', '#......#', '#......#', '#......#', '########'],
      ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
    ],
    dat: { '@': 1, 'Y': 3, 'X': 3, '#': 3 }, min: 5, max: 22,
    dac: (c) => Math.max(...c.map((t) => t.tia.length)) >= 2,   // thật sự chẻ ra
  },
];

const chiLam = process.argv[2];
const ra = Object.fromEntries(Object.entries(MAN_CU).map(([k, v]) => [k, { giu: v }]));

for (const v of VIEC) {
  if (chiLam && v.khoa !== chiLam) continue;
  const tim = [];
  const daCo = new Set();
  let thu = 0;

  while (thu < GIOI_HAN && tim.length < 120) {
    thu++;
    const khung = v.khung[Math.floor(rnd() * v.khung.length)];
    const o = dungMan(khung, v.dat);
    if (!o) continue;
    const dau = o.join('|');
    if (daCo.has(dau)) continue;
    daCo.add(dau);

    let man;
    try { man = docMan(o); } catch { continue; }
    const kq = giai(v.game, man, 120000);
    if (!kq.duong || kq.duong.length < v.min || kq.duong.length > v.max) continue;
    const lai = diLai(v.game, man, kq.duong);
    if (!lai.thang || !v.dac(lai.chuoi)) continue;

    // Thước đo thật: số nước sai dẫn vào ngõ cụt. Chọn theo độ dài thì ra một
    // hành lang 25 nước hiển nhiên — dài nhưng không phải câu đố.
    const hoc = docDoHoc(v.game, man, 150000);
    if (!hoc.duong || hoc.bay < 1) continue;
    tim.push({ o, nuoc: kq.duong.length, bay: hoc.bay, thatCo: hoc.thatCo });
  }

  // xếp từ dễ tới khó theo bẫy, bẫy bằng nhau thì theo độ dài
  tim.sort((a, b) => a.bay - b.bay || a.nuoc - b.nuoc);
  // Rải đều từ dễ tới khó, nhưng KHÔNG lấy trùng: ứng viên ít hơn số cần thì
  // thà ra ít màn còn hơn lặp lại cùng một màn hai lần.
  const can = MOI_GAME - 1;
  const chon = [];
  const daLay = new Set();
  for (let i = 0; i < can && tim.length; i++) {
    const j = Math.min(tim.length - 1, Math.round((i * (tim.length - 1)) / Math.max(1, can - 1)));
    for (let b = 0; b < tim.length; b++) {            // trùng thì lấn sang ứng viên kế
      const k = (j + b) % tim.length;
      if (daLay.has(k)) continue;
      daLay.add(k);
      chon.push(tim[k]);
      break;
    }
  }
  chon.sort((a, b) => a.bay - b.bay || a.nuoc - b.nuoc);

  ra[v.khoa] = { day: v.day, chon };
  console.log(`${v.game.ten}: thử ${thu}, đạt ${tim.length}, lấy ${chon.length}`);
  console.log(`  bẫy:  ${chon.map((c) => c.bay).join(' ')}`);
  console.log(`  nước: ${chon.map((c) => c.nuoc).join(' ')}`);
}

const than = Object.entries(ra).map(([khoa, m]) => {
  const dong = [`  ${khoa}: [`];
  if (m.giu) {                                 // game lần này không quét thì giữ nguyên
    for (const c of m.giu) dong.push(`    { o: ${JSON.stringify(c.o)} },`);
  } else {
    dong.push(`    { o: ${JSON.stringify(m.day)} },   // màn dạy luật, vẽ tay`);
    for (const c of m.chon) dong.push(`    { o: ${JSON.stringify(c.o)} },   // ${c.nuoc} nước · ${c.bay} bẫy`);
  }
  dong.push('  ],');
  return dong.join('\n');
}).join('\n');

writeFileSync(new URL('../man.js', import.meta.url), `// TỆP NÀY DO MÁY SINH — đừng sửa tay.
// Sinh lại: node scripts/tim-man.mjs   ·  Kiểm: node scripts/kiem-man.mjs
// Mỗi màn đều đã được bộ giải xác nhận giải được, và lời giải phải dùng tới cơ chế.
// Màn xếp theo số nước đi của lời giải ngắn nhất, dễ tới khó.
export const MAN = {
${than}
};
`);
console.log('\nĐã ghi man.js');
