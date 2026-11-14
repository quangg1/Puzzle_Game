// Thước đo độ khó của Hố Sụt, dựa trên "người chơi tham": luôn đi ăn thứ
// GẦN NHẤT đang ăn được, hoà thì chọn bừa. Đó là cách chơi hiển nhiên — ai
// mới chơi cũng làm thế.
//
//   thenChot  - số lần trên lời giải mà MỌI cách ăn-thứ-gần-nhất đều làm thua.
//               Mỗi lần là một chỗ người chơi phải dừng lại nghĩ. Đây là độ khó.
//   thamThang - tỉ lệ kẻ tham thắng cả màn. Cao = màn chỉ là dọn dẹp.
//
// Chạy: node scripts/nguoi-tham.mjs   (in bảng cho bộ màn hiện tại)
import { docMan, khoa, TEN_HUONG } from '../nen.js';
import { docDoHoc } from './giai.mjs';
import lo from '../game/lo.js';

let hat = 7;
const rnd = () => ((hat = (hat * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

// BFS theo vị trí (chưa ăn gì), trả MỌI kết quả ăn ở tầng gần nhất.
function anGanNhat(man, tt) {
  const n0 = tt.vat.length;
  let tang = [tt];
  const daXet = new Set([`${tt.x},${tt.y}`]);
  while (tang.length) {
    const an = [], sau = [];
    for (const s of tang)
      for (const h of TEN_HUONG) {
        const kq = lo.buoc(man, s, h);
        if (!kq || kq.tt === s) continue;
        if (kq.tt.vat.length < n0) { an.push(kq); continue; }
        const k = `${kq.tt.x},${kq.tt.y}`;
        if (daXet.has(k)) continue;
        daXet.add(k);
        sau.push(kq.tt);
      }
    if (an.length) return an;
    tang = sau;
  }
  return [];
}

export function tiLeThamThang(man, lan = 100) {
  let thang = 0;
  for (let i = 0; i < lan; i++) {
    let tt = lo.batDau(man);
    for (;;) {
      const ds = anGanNhat(man, tt);
      if (!ds.length) break;
      const kq = ds[Math.floor(rnd() * ds.length)];
      if (kq.thang) { thang++; break; }
      tt = kq.tt;
    }
  }
  return thang / lan;
}

// Xét ở mỗi chỗ ra quyết định trên lời giải (lúc mở màn và ngay sau mỗi lần ăn).
export function demThenChot(man, hoc) {
  let n = 0;
  hoc.trangThai.forEach((tt, i) => {
    const laQuyetDinh = i === 0 || tt.vat.length < hoc.trangThai[i - 1].vat.length;
    if (!laQuyetDinh || !tt.vat.length) return;
    const ds = anGanNhat(man, tt);
    if (!ds.some((kq) => kq.thang || hoc.conDuong.has(khoa(kq.tt)))) n++;
  });
  return n;
}

export function doKho(man, hoc) {
  return { thenChot: demThenChot(man, hoc), tham: tiLeThamThang(man) };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('scripts/nguoi-tham.mjs')) {
  console.log('màn  nước  then-chốt  tham-thắng');
  lo.MAN.forEach((m, i) => {
    const man = docMan(m.o);
    const hoc = docDoHoc(lo, man);
    const d = doKho(man, hoc);
    console.log(`${String(i + 1).padStart(3)}  ${String(hoc.duong.length).padStart(4)}  ${String(d.thenChot).padStart(9)}  ${String(Math.round(d.tham * 100)).padStart(9)}%`);
  });
}
