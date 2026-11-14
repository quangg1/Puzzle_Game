// Dò màn cho cả 4 game rồi GHI THẲNG ra ../man.js.
// Điều kiện kép: giải được VÀ phải dùng tới cơ chế — thiếu vế sau thì ra một đống
// màn "giải được" mà đi vòng vòng không đụng luật.
// Chạy: node scripts/tim-man.mjs
import { writeFileSync } from 'node:fs';
import { MAN as MAN_CU } from '../man.js';
import { docMan } from '../nen.js';
import { giai, diLai, docDoHoc } from './giai.mjs';
import { doKho } from './nguoi-tham.mjs';
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
    // Bốn màn dạy, mỗi màn MỘT luật mới: ăn → lớn rồi ăn thứ to → ngõ cụt phải
    // ăn trước khi lớn → chum để nhỏ lại mà chui vào ngõ.
    // Ba màn dạy, mỗi màn MỘT luật mới: ăn rồi lớn → ngõ cụt phải ăn trước khi
    // lớn → chum để nhỏ lại mà chui vào ngõ (11 nước, có một chỗ then chốt).
    dayDs: [
      ['#######', '#@1.12#', '#.....#', '#######'],
      ['#######', '#1#...#', '#.@.1.#', '#.1.2.#', '#######'],
      ['#######', '#12####', '##.c..#', '##@11.#', '#######'],
    ],
    // Bốn bậc: bàn to dần, vật nhiều dần. Khung vẽ tay (chữ L, hai phòng, hành
    // lang, ngõ cụt) cho mỗi màn một dáng riêng; chỉ thêm ít tường ngẫu nhiên.
    bac: [
      { so: 4, khung: [
        ['########', '#......#', '#......#', '#......#', '########'],
        ['########', '#...####', '#...####', '#......#', '#......#', '########'],
        ['#########', '#...#...#', '#.......#', '#...#...#', '#########'],
      // bậc 1 chưa có chum: chỉ luyện "ăn ngõ cụt trước khi lớn" cho quen tay.
      // Mỗi bậc có VÀI bộ vật khác nhau — một bộ duy nhất thì các màn chơi y hệt nhau.
      ], dat: [
        { '@': 1, '#': 1, '1': 4, '2': 2 },
        { '@': 1, '#': 1, '1': 5, '2': 1 },
        { '@': 1, '#': 2, '1': 3, '2': 2 },
        { '@': 1, '#': 1, '1': 4, '2': 1, '3': 1 },
      ], min: 8, max: 22 },
      { so: 4, khung: [
        ['#########', '#....####', '#....#..#', '#.......#', '#....#..#', '#########'],
        ['##########', '#..#.....#', '#..#.....#', '#........#', '####.....#', '##########'],
        ['#########', '#...#...#', '#.......#', '#...#...#', '#.......#', '#########'],
      ], dat: [
        { '@': 1, '#': 1, '1': 3, '2': 2, '3': 1, 'c': 1 },
        { '@': 1, '#': 1, '1': 4, '2': 3, 'c': 1 },
        { '@': 1, '#': 2, '1': 4, '2': 1, '3': 1, 'c': 1 },
        { '@': 1, '#': 1, '1': 5, '2': 2, 'c': 1 },
      ], min: 10, max: 28 },
      { so: 4, khung: [
        ['#########', '#..###..#', '#.......#', '#..#.#..#', '#.......#', '#..###..#', '#########'],
        ['##########', '#....#...#', '#....#...#', '#........#', '#.##.....#', '#....#...#', '##########'],
        ['##########', '#..#.....#', '#..#.....#', '#........#', '####.....#', '##########'],
      ], dat: [
        { '@': 1, '#': 2, '1': 3, '2': 2, '3': 2, 'c': 2 },
        { '@': 1, '#': 2, '1': 4, '2': 3, '3': 1, 'c': 1 },
        { '@': 1, '#': 1, '1': 5, '2': 1, '3': 2, 'c': 2 },
        { '@': 1, '#': 2, '1': 4, '2': 2, '3': 1, 'c': 2 },
      ], min: 14, max: 32 },
      { so: 5, khung: [
        ['##########', '#....#...#', '#....#...#', '#........#', '#.##.....#', '#....#...#', '##########'],
        ['#########', '#..###..#', '#.......#', '#..#.#..#', '#.......#', '#..###..#', '#########'],
        ['###########', '#...#.....#', '#...#.....#', '#.........#', '#...###...#', '###########'],
      ], dat: [
        { '@': 1, '#': 2, '1': 4, '2': 2, '3': 2, 'c': 2 },
        { '@': 1, '#': 2, '1': 5, '2': 3, '3': 1, 'c': 2 },
        { '@': 1, '#': 1, '1': 4, '2': 2, '3': 3, 'c': 2 },
        { '@': 1, '#': 2, '1': 6, '2': 2, '3': 2, 'c': 3 },
      ], min: 16, max: 36 },
    ],
    // Độ khó = số chỗ then chốt (ăn thứ gần nhất là thua) + phần kẻ tham thua.
    // Mọi màn dò ra phải buộc người chơi nghĩ: có then chốt, hoặc kẻ tham thua quá nửa.
    doKho: (man, hoc) => {
      const d = doKho(man, hoc);
      return { ...d, diem: d.thenChot + (1 - d.tham), dat: d.thenChot >= 1 || d.tham < .5 };
    },
    dac: (c) => Math.max(...c.map((t) => t.nuot)) >= 3,     // hố buộc phải lớn lên
    // Chum phải BẮT BUỘC: bỏ hết chum đi mà vẫn giải được thì chum chỉ là đồ trang trí.
    canVatPhu: (o) => !o.join('').includes('c')
      || giai(lo, docMan(o.map((d) => d.replaceAll('c', '.'))), 120000).bi,
  },
  {
    khoa: 'thoiGian', game: thoiGian,
    day: ['#######', '#@...o#', '#.....#', '#X....#', '#######'],
    khung: [
      ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
      ['########', '#......#', '#......#', '#......#', '#......#', '########'],
      ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
    ],
    dat: { '@': 1, 'X': 1, 'o': 4, 's': 2, '#': 6 }, min: 9, max: 32,
    // phải đổi khung hình ít nhất 2 lần, tức thật sự dùng trục thời gian
    dac: (c) => c.filter((t, i) => i && t.y !== c[i - 1].y).length >= 2,
  },
  {
    khoa: 'xoay', game: xoay,
    day: ['......', '......', '......', '......', '......', '@....X'],
    // BẮT BUỘC vuông, nếu không phép quay 90° không còn khớp lưới
    khung: [
      ['......', '......', '......', '......', '......', '......'],
      ['.......', '.......', '.......', '.......', '.......', '.......', '.......'],
    ],
    dat: { '@': 1, 'X': 1, 'o': 2, 'v': 3, 'h': 2, 'd': 2, '#': 4 }, min: 6, max: 28,
    // phải có ít nhất một cú NGHIÊNG, không thì ra toàn màn đi bộ là xong
    dac: (c) => c.some((t) => t.quay),
  },
  {
    khoa: 'tachDoi', game: tachDoi,
    day: ['#######', '#@...X#', '#######'],
    khung: [
      ['#######', '#.....#', '#.....#', '#.....#', '#######'],
      ['########', '#......#', '#......#', '#......#', '########'],
      ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
    ],
    dat: { '@': 1, 'Y': 2, 'X': 3, 'G': 2, 'B': 2, '#': 3 }, min: 5, max: 24,
    dac: (c) => Math.max(...c.map((t) => t.tia.length)) >= 2,   // thật sự chẻ ra
  },
];

const chiLam = process.argv[2];
const ra = Object.fromEntries(Object.entries(MAN_CU).map(([k, v]) => [k, { giu: v }]));

// Dò theo bậc: mỗi bậc một cỡ bàn + bộ vật riêng, lấy đều từ dễ tới khó TRONG bậc.
// Độ khó = bẫy một nước + tỉ lệ trạng thái đã bí (bẫy sâu). Chỉ độ dài thì không đo được.
function doTheoBac(v) {
  const ungVien = [];
  for (const [ib, b] of v.bac.entries()) {
    const tim = [], daCo = new Set();
    let thu = 0;
    while (thu < GIOI_HAN && tim.length < 60) {
      thu++;
      const kh = Math.floor(rnd() * b.khung.length);
      const dsDat = Array.isArray(b.dat) ? b.dat : [b.dat];
      const di = Math.floor(rnd() * dsDat.length);
      const o = dungMan(b.khung[kh], dsDat[di]);
      if (!o || daCo.has(o.join('|'))) continue;
      daCo.add(o.join('|'));
      let man;
      try { man = docMan(o); } catch { continue; }
      const kq = giai(v.game, man, 120000);
      if (!kq.duong || kq.duong.length < b.min || kq.duong.length > b.max) continue;
      const lai = diLai(v.game, man, kq.duong);
      if (!lai.thang || !v.dac(lai.chuoi)) continue;
      if (v.canVatPhu && !v.canVatPhu(o)) continue;
      const hoc = docDoHoc(v.game, man, 150000);
      if (!hoc.duong) continue;
      const d = v.doKho(man, hoc);
      if (!d.dat) continue;
      tim.push({ o, kh, di, nuoc: kq.duong.length, bay: hoc.bay, thenChot: d.thenChot, tham: d.tham, diem: d.diem + kq.duong.length / 100 });
    }
    console.log(`  bậc ${ib + 1}: thử ${thu}, đạt ${tim.length}`);
    ungVien.push(tim);
  }

  // Độ khó phải TĂNG ĐỀU qua cả game, không răng cưa mỗi đầu bậc. Đặt mốc
  // khó cho từng màn, rồi trong bậc của màn đó lấy ứng viên gần mốc nhất mà
  // không dễ hơn màn trước.
  const tatCa = ungVien.flat().map((c) => c.diem);
  const thap = Math.min(...tatCa), cao = Math.max(...tatCa);
  const bacCua = v.bac.flatMap((b, ib) => Array(b.so).fill(ib));   // màn thứ i thuộc bậc nào
  const tong = bacCua.length;
  const chon = [];
  let truoc = -Infinity;
  for (let i = 0; i < tong; i++) {
    const tim = ungVien[bacCua[i]];
    const moc = thap + ((cao - thap) * i) / Math.max(1, tong - 1);
    // Không lặp: màn liền trước dùng khung nào, bộ vật nào thì màn này tránh cả hai.
    // Trước đây ba màn liền nhau cùng một bộ vật nên chơi thấy y chang nhau.
    const sat = chon[chon.length - 1];
    const khac = (c) => !sat || (c.kh !== sat.kh && c.di !== sat.di);
    const conLai = tim.filter((c) => !chon.includes(c));
    const loc = [
      conLai.filter((c) => khac(c) && c.diem >= truoc),
      conLai.filter((c) => khac(c)),
      conLai.filter((c) => c.diem >= truoc),
      conLai,
    ];
    const tu = loc.find((l) => l.length) ?? [];
    if (!tu.length) continue;
    const c = tu.reduce((a, b2) => (Math.abs(b2.diem - moc) < Math.abs(a.diem - moc) ? b2 : a));
    chon.push(c);
    c.bac = bacCua[i];
    truoc = c.diem;
  }
  // Giữ nguyên thứ tự đã chọn: sắp lại theo điểm sẽ đặt các màn giống nhau cạnh nhau.
  return chon;
}

for (const v of VIEC) {
  if (chiLam && v.khoa !== chiLam) continue;
  if (v.bac) {
    console.log(v.game.ten);
    const chon = doTheoBac(v);
    ra[v.khoa] = { dayDs: v.dayDs, chon };
    console.log(`  then chốt:  ${chon.map((c) => c.thenChot).join(' ')}`);
    console.log(`  tham thắng: ${chon.map((c) => Math.round(c.tham * 100)).join(' ')}`);
    console.log(`  nước:       ${chon.map((c) => c.nuoc).join(' ')}`);
    continue;
  }
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
    for (const d of m.dayDs ?? [m.day]) dong.push(`    { o: ${JSON.stringify(d)} },   // màn dạy luật, vẽ tay`);
    for (const c of m.chon) {
      const ghi = c.thenChot === undefined
        ? `${c.nuoc} nước · ${c.bay} bẫy`
        : `${c.nuoc} nước · ${c.thenChot} then chốt · tham thắng ${Math.round(c.tham * 100)}%`;
      dong.push(`    { o: ${JSON.stringify(c.o)} },   // ${ghi}`);
    }
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
