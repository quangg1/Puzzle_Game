// Thước đo độ khó của Hố Sụt, dựa trên "người chơi tham": luôn đi ăn thứ
// GẦN NHẤT đang ăn được, hoà thì chọn bừa. Đó là cách chơi hiển nhiên — ai
// mới chơi cũng làm thế.
//
//   thenChot  - số lần trên lời giải mà MỌI cách ăn-thứ-gần-nhất đều làm thua.
//               Mỗi lần là một chỗ người chơi phải dừng lại nghĩ. Đây là độ khó.
//   thamThang - tỉ lệ kẻ tham thắng cả màn. Cao = màn chỉ là dọn dẹp.
//
// Mỗi game có một "cách chơi hiển nhiên" riêng, nên mỗi game cần một hàm chọn
// nước tham riêng; phần đo thì dùng chung (xem doKhoTham ở cuối tệp).
//
// Chạy: node scripts/nguoi-tham.mjs [lo|tachDoi|thoiGian|xoay]   (in bảng cho bộ màn hiện tại)
import { docMan, khoa, TEN_HUONG } from '../nen.js';
import { docDoHoc } from './giai.mjs';
import lo from '../game/lo.js';
import tachDoi from '../game/tach-doi.js';
import thoiGian from '../game/thoi-gian.js';
import xoay from '../game/xoay.js';

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

// ── TIA SÉT ─────────────────────────────────────────────────────────────────
// Cách chơi hiển nhiên ở đây là LÙA TIA VỀ PHÍA CHẤU: nước nào phủ thêm được
// chấu thì tốt nhất, hoà thì chọn nước kéo tia lại gần chấu chưa phủ.
// Kẻ chơi kiểu này KHÔNG bao giờ nghĩ tới chuyện phải vứt bớt một tia vào cọc
// thu lôi, cũng không nghĩ tới việc để dành ngạnh — nên màn nào nó thắng được
// là màn đó chưa phải câu đố.
function diemTia(man, tt) {
  const chau = man.lay('X').map((p) => p.join(','));
  const co = new Set(tt.tia);
  let phu = 0, xa = 0;
  for (const c of chau) {
    if (co.has(c)) { phu++; continue; }
    const [cx, cy] = c.split(',').map(Number);
    let gan = 99;
    for (const k of tt.tia) {
      const [x, y] = k.split(',').map(Number);
      gan = Math.min(gan, Math.abs(x - cx) + Math.abs(y - cy));
    }
    xa += gan;
  }
  return phu * 1000 - xa;
}

function nuocThamTia(man, tt) {
  const ds = [];
  for (const h of TEN_HUONG) {
    const kq = tachDoi.buoc(man, tt, h);
    if (!kq || kq.tt === tt) continue;
    ds.push(kq);
  }
  if (!ds.length) return [];
  const diem = (kq) => (kq.thang ? Infinity : diemTia(man, kq.tt));
  const nhat = Math.max(...ds.map(diem));
  return ds.filter((kq) => diem(kq) === nhat);
}

// ── CUỘN PHIM ───────────────────────────────────────────────────────────────
// Cách chơi hiển nhiên: ĐI NHẶT MÓN GẦN NHẤT, nhặt đủ rồi thì đi ra cửa. Kẻ
// chơi kiểu này không bao giờ nghĩ trước rằng đổi khung hình là để lại một
// bản thân cũ bịt mất lối, cũng không để dành vết nối — nên màn nào nó thắng
// được là màn đó chỉ còn là đi dạo nhặt đồ.
function diemPhim(man, tt) {
  const conLai = man.lay('o').filter(([x, y]) => !tt.lay.has(`${x},${y}`));
  if (!conLai.length) {
    const [cx, cy] = man.lay('X')[0];
    return 1e6 - (Math.abs(tt.x - cx) + Math.abs(tt.y - cy));
  }
  let gan = 1e9;
  for (const [x, y] of conLai) gan = Math.min(gan, Math.abs(tt.x - x) + Math.abs(tt.y - y));
  return tt.lay.size * 1000 - gan;
}

function nuocThamPhim(man, tt) {
  const ds = [];
  for (const h of TEN_HUONG) {
    const kq = thoiGian.buoc(man, tt, h);
    if (!kq || kq.tt === tt) continue;
    ds.push(kq);
  }
  if (!ds.length) return [];
  const diem = (kq) => (kq.thang ? Infinity : diemPhim(man, kq.tt));
  const nhat = Math.max(...ds.map(diem));
  return ds.filter((kq) => diem(kq) === nhat);
}


// ── THÙNG HÀNG ──────────────────────────────────────────────────────────────
// Cách chơi hiển nhiên: ĐI VỀ PHÍA NẮP HẦM. Thấy nắp ở bên phải thì bấm phải,
// chạm thành thùng thì thùng nghiêng, rồi lại bấm về phía nắp. Kẻ chơi kiểu
// này không bao giờ nghĩ tới chuyện nghiêng thùng để XẾP LẠI hàng hoá thành
// bậc thang, cũng không nghĩ cú rơi nào làm vỡ kiện nào.
function diemThung(man, tt) {
  const ng = tt.vat.find((v) => v.loai === 'nguoi');
  if (!ng) return -1e9;
  return -(Math.abs(ng.x - tt.nap[0]) + Math.abs(ng.y - tt.nap[1]));
}

function nuocThamThung(man, tt) {
  const ds = [];
  for (const h of TEN_HUONG) {
    const kq = xoay.buoc(man, tt, h);
    if (!kq || kq.tt === tt) continue;
    ds.push(kq);
  }
  if (!ds.length) return [];
  const diem = (kq) => (kq.thang ? Infinity : diemThung(man, kq.tt));
  const nhat = Math.max(...ds.map(diem));
  return ds.filter((kq) => diem(kq) === nhat);
}

// ── phần đo dùng chung ──────────────────────────────────────────────────────
// thamThang - tỉ lệ kẻ tham thắng cả màn. Cao = màn chỉ là dọn dẹp.
// thenChot  - số chỗ trên lời giải mà MỌI nước "hiển nhiên" đều làm mất đường
//             thắng. Mỗi chỗ là một lần người chơi buộc phải dừng lại nghĩ.
// laQuyetDinh(tt, i) — chỉ đếm then chốt ở những chỗ RA QUYẾT ĐỊNH, không đếm
// ở mọi nước. Đếm mọi nước thì màn 30 nước tự động điểm gấp ba màn 10 nước dù
// hai màn hóc như nhau: thành ra lại đo độ dài, đúng thứ đang muốn tránh.
// Chỗ ra quyết định là chỗ KHÔNG LÙI LẠI ĐƯỢC — ở Hố Sụt là mỗi lần nuốt, ở
// Tia Sét là mỗi lần ngạnh cháy hoặc cọc nuốt mất một tia.
export function doKhoTham(game, man, hoc, chonNuoc, laQuyetDinh, lan = 60, tranNuoc = 200) {
  let thang = 0;
  for (let i = 0; i < lan; i++) {
    let tt = game.batDau(man);
    for (let n = 0; n < tranNuoc; n++) {
      const ds = chonNuoc(man, tt);
      if (!ds.length) break;
      const kq = ds[Math.floor(rnd() * ds.length)];
      if (kq.thang) { thang++; break; }
      tt = kq.tt;
    }
  }
  let thenChot = 0;
  hoc.trangThai.forEach((tt, i) => {
    if (!laQuyetDinh(tt, i)) return;
    const ds = chonNuoc(man, tt);
    if (!ds.length) return;
    if (!ds.some((kq) => kq.thang || hoc.conDuong.has(khoa(kq.tt)))) thenChot++;
  });
  return { thenChot, tham: thang / lan };
}

export const doKhoTia = (man, hoc) => doKhoTham(
  tachDoi, man, hoc, nuocThamTia,
  (tt, i) => i === 0 || tt.noAt?.length || tt.hut?.length,
);

// Chỗ không lùi lại được ở Cuộn Phim: mỗi lần đổi khung hình (để lại một bản
// thân cũ vĩnh viễn) và mỗi lần cắt phim (vết nối cháy luôn).
export const doKhoPhim = (man, hoc) => doKhoTham(
  thoiGian, man, hoc, nuocThamPhim,
  (tt, i) => i === 0 || tt.doiKhung || tt.vuaCat,
);

// Chỗ không lùi lại được ở Thùng Hàng: mỗi cú nghiêng (hàng rơi xuống chỗ mới,
// nghiêng ngược lại KHÔNG đưa chúng về chỗ cũ) và mỗi lần có kiện vỡ.
export const doKhoThung = (man, hoc) => doKhoTham(
  xoay, man, hoc, nuocThamThung,
  (tt, i) => i === 0 || tt.quay || tt.vo?.length,
);

if (process.argv[1]?.replaceAll('\\', '/').endsWith('scripts/nguoi-tham.mjs')) {
  const chon = process.argv[2] ?? 'lo';
  const game = { lo, tachDoi, thoiGian, xoay }[chon] ?? lo;
  const do_ = { lo: doKho, tachDoi: doKhoTia, thoiGian: doKhoPhim, xoay: doKhoThung }[chon] ?? doKho;
  console.log(`${game.ten}\nmàn  nước  then-chốt  tham-thắng`);
  game.MAN.forEach((m, i) => {
    const man = docMan(m.o);
    const hoc = docDoHoc(game, man);
    if (!hoc.duong) { console.log(`${String(i + 1).padStart(3)}  (không đọc được)`); return; }
    const d = do_(man, hoc);
    console.log(`${String(i + 1).padStart(3)}  ${String(hoc.duong.length).padStart(4)}  ${String(d.thenChot).padStart(9)}  ${String(Math.round(d.tham * 100)).padStart(9)}%`);
  });
}
