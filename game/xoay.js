// THÙNG HÀNG — mũi tên trái/phải là nghiêng cả cái thùng 90°.
// Người và kiện hàng rơi theo chiều "dưới" mới. Đưa người xuống nắp hầm.
// Thế giới: khung thùng gỗ đóng đai sắt, có quai — để thấy rõ là CÁI THÙNG quay.
import { laTuong, tamO, oTron, kep, muot, lerp, nhieu, bongMem, toiGoc, khoi, nhanVat, SANG, anh } from '../nen.js';

const TRANH_KIEN = 'assets/sprite/kien-hang.webp';
const TRANH_NAP = 'assets/sprite/nap-ham.webp';
const TRANH_HOM = 'assets/sprite/hom.webp';
import { MAN } from '../man.js';

const GO = '#8a6240', GO_TOI = '#5c3f28', DAI = '#b9873f';
const NEN = '#191410', SAN = '#241c16', KIEN = '#c38b4e';
const NGUOI = '#f2e6d4', NAP = '#6fd3b8', SAT = '#39414d';
const BUI_GO = '#9c7347';

const QUAY_MS = 420;
const daBan = new WeakSet();   // mỗi lần nghiêng chỉ tung bụi một lần

function batDau(man) {
  const n = Math.max(man.rong, man.cao);
  const vat = [];
  let id = 0;
  for (const [x, y] of man.lay('o')) vat.push({ id: id++, loai: 'kien', x, y });
  for (const [x, y] of man.lay('v')) vat.push({ id: id++, loai: 'devo', x, y });
  for (const [x, y] of man.lay('h')) vat.push({ id: id++, loai: 'hom', x, y });
  const [nx, ny] = man.lay('@')[0];
  vat.push({ id: id++, loai: 'nguoi', x: nx, y: ny });
  const tt = { n, tuong: new Set(man.tuong), vat, nap: man.lay('X')[0].slice(), luc: 0, quay: 0, huong: 0 };
  onDinh(tt);
  return tt;
}

const quayDiem = ([x, y], n, chieu) => (chieu > 0 ? [n - 1 - y, x] : [y, n - 1 - x]);

function roi(tt) {
  for (let vong = 0; vong < tt.n * 2; vong++) {
    let doi = false;
    for (const v of [...tt.vat].sort((a, b) => b.y - a.y)) {
      const duoi = `${v.x},${v.y + 1}`;
      const chiem = new Set(tt.vat.filter((k) => k !== v).map((k) => `${k.x},${k.y}`));
      if (v.y + 1 < tt.n && !tt.tuong.has(duoi) && !chiem.has(duoi)) { v.y++; doi = true; }
    }
    if (!doi) break;
  }
}

// MỘT động từ, nghĩa đổi theo chỗ đứng:
//   ô bên cạnh trống        -> đi bộ sang
//   bị kiện hàng chặn       -> trèo lên nóc nó (hàng hoá thành bậc thang)
//   đụng thành thùng        -> đẩy tiếp thì CẢ THÙNG nghiêng
// Nhờ vậy chỗ đứng thành một phần câu đố: muốn nghiêng bên nào phải đi sang
// bên ấy trước. Không gian trạng thái nhân lên theo vị trí, chứ không còn bó
// vào đúng 4 hướng xoay — đó là lý do game này trước chỉ nặn ra nổi 10 màn.
function buoc(man, tt, huong) {
  if (huong !== 'trai' && huong !== 'phai') return null;
  const chieu = huong === 'phai' ? 1 : -1;
  const ng = tt.vat.find((v) => v.loai === 'nguoi');
  const tx = ng.x + chieu, ty = ng.y;
  const ngoai = (x, y) => x < 0 || y < 0 || x >= tt.n || y >= tt.n;
  const chan = (x, y) => tt.tuong.has(`${x},${y}`) || tt.vat.some((v) => v !== ng && v.x === x && v.y === y);

  if (!ngoai(tx, ty)) {
    if (!chan(tx, ty)) return doiCho(tt, ng, tx, ty, chieu);
    // trèo: ô đích bị chặn, nhưng nóc nó trống và đầu mình cũng trống
    if (!ngoai(tx, ty - 1) && !chan(tx, ty - 1) && !chan(ng.x, ng.y - 1))
      return doiCho(tt, ng, tx, ty - 1, chieu);
    return null;                                   // kiện cao quá hoặc vách sắt
  }
  return nghiengThung(tt, chieu);                  // đụng thành thùng -> lật cả hộp
}

function doiCho(tt, ng, tx, ty, chieu) {
  const moi = {
    ...tt,
    vat: tt.vat.map((v) => (v === ng ? { ...v, x: tx, y: ty } : { ...v })),
    luc: performance.now(),
    quay: 0,
    buoc: chieu,
    vo: null,
    truoc: tt.vat.map((v) => ({ id: v.id, x: v.x, y: v.y })),
  };
  return xongNuoc(moi);
}

function nghiengThung(tt, chieu) {
  const n = tt.n;
  const moi = {
    n,
    tuong: new Set([...tt.tuong].map((k) => quayDiem(k.split(',').map(Number), n, chieu).join(','))),
    vat: tt.vat.map((v) => { const [x, y] = quayDiem([v.x, v.y], n, chieu); return { ...v, x, y }; }),
    nap: quayDiem(tt.nap, n, chieu),
    luc: performance.now(),
    quay: chieu,
    huong: (tt.huong + chieu + 4) % 4,   // quai xách nhớ thùng đã quay bao nhiêu
    truoc: tt.vat.map((v) => { const [x, y] = quayDiem([v.x, v.y], n, chieu); return { id: v.id, x, y }; }),
    buoc: 0,
    vo: null,
  };
  return xongNuoc(moi);
}

// Rơi, vỡ, rơi tiếp, rồi xét thắng. Kiện dễ vỡ rơi quá 3 ô là mất luôn — đây
// là thứ KHÔNG LẤY LẠI ĐƯỢC mà game vốn thiếu (nghiêng trái rồi nghiêng phải
// vẫn về chỗ cũ, nên trước đó bẫy = 0 ở cả 10 màn).
// Rơi, vỡ, rơi tiếp, lặp tới khi đứng yên. Hai cách vỡ:
//   rơi quá 3 ô              — kiện dễ vỡ không chịu nổi cú tiếp đất
//   bị hòm nặng đè lên       — bất kể cao thấp, hòm là hòm
// Phải lặp vì kiện vỡ thì thứ bên trên rơi tiếp, có thể đè vỡ kiện khác.
function onDinh(moi) {
  const voTatCa = [];
  for (let vong = 0; vong < 8; vong++) {
    const truoc = new Map(moi.vat.map((v) => [v.id, v.y]));
    roi(moi);
    const duoiHom = new Set(moi.vat.filter((v) => v.loai === 'hom').map((v) => `${v.x},${v.y + 1}`));
    const vo = moi.vat.filter((v) => v.loai === 'devo'
      && (v.y - truoc.get(v.id) >= 3 || duoiHom.has(`${v.x},${v.y}`)));
    if (!vo.length) break;
    voTatCa.push(...vo.map((v) => ({ x: v.x, y: v.y })));
    moi.vat = moi.vat.filter((v) => !vo.includes(v));
  }
  moi.vo = voTatCa.length ? voTatCa : null;
  return moi;
}

function xongNuoc(moi) {
  onDinh(moi);
  const ng = moi.vat.find((v) => v.loai === 'nguoi');
  return { tt: moi, thang: ng.x === moi.nap[0] && ng.y === moi.nap[1] };
}

function veThung(ctx, g, n, huong, van) {
  const w = n * g.o;
  ctx.fillStyle = GO_TOI;
  oTron(ctx, g.x0 - g.o * .22, g.y0 - g.o * .22, w + g.o * .44, w + g.o * .44, g.o * .18);
  ctx.fill();
  ctx.save();
  oTron(ctx, g.x0, g.y0, w, w, g.o * .06);
  ctx.clip();
  ctx.fillStyle = SAN;
  ctx.fillRect(g.x0, g.y0, w, w);
  ctx.drawImage(van, g.x0, g.y0, w, w);     // vân gỗ, không phải màu phẳng
  ctx.restore();
  ctx.strokeStyle = DAI;
  ctx.lineWidth = Math.max(2, g.o * .1);
  oTron(ctx, g.x0 - g.o * .12, g.y0 - g.o * .12, w + g.o * .24, w + g.o * .24, g.o * .12);
  ctx.stroke();
  // Quai xách đánh dấu cạnh "trên" CỦA THÙNG. Thùng quay thì quai sang cạnh khác —
  // không có nó thì sau hoạt ảnh thùng trông đứng yên còn đồ thì tự nhảy chỗ.
  const cx = g.x0 + w / 2, cy = g.y0 + w / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((huong * Math.PI) / 2);
  ctx.translate(-cx, -cy);
  ctx.strokeStyle = DAI;
  ctx.lineWidth = Math.max(2, g.o * .09);
  ctx.beginPath();
  ctx.arc(cx, g.y0 - g.o * .16, g.o * .3, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}

function ve(ctx, man, tt, g, phu) {
  const n = tt.n;
  const t = kep((phu.nay - tt.luc) / QUAY_MS, 0, 1);
  const goc = tt.quay ? (1 - muot(t)) * -tt.quay * Math.PI / 2 : 0;
  const tx = g.x0 + (n * g.o) / 2, ty = g.y0 + (n * g.o) / 2;

  ctx.fillStyle = NEN;
  ctx.fillRect(-20, -20, phu.W + 40, phu.H + 40);
  const canh = Math.round(n * g.o);
  const van = phu.van(`go${canh}`, canh, canh, veVanGo);

  ctx.save();
  ctx.translate(tx, ty); ctx.rotate(goc); ctx.translate(-tx, -ty);
  veThung(ctx, g, n, tt.huong ?? 0, van);

  // Tường = tấm sắt bắt đinh tán, cố ý khác hẳn kiện hàng gỗ sáng màu:
  // người chơi phải phân biệt được ngay đâu là khung cố định, đâu là hàng sẽ rơi.
  for (const k of tt.tuong) {
    const [x, y] = k.split(',').map(Number);
    const px = g.x0 + x * g.o, py = g.y0 + y * g.o;
    ctx.fillStyle = SAT;
    oTron(ctx, px + 1, py + 1, g.o - 2, g.o - 2, g.o * .06);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,215,230,.3)';
    for (const [ax, ay] of [[.22, .22], [.78, .22], [.22, .78], [.78, .78]]) {
      ctx.beginPath();
      ctx.arc(px + g.o * ax, py + g.o * ay, g.o * .045, 0, 7);
      ctx.fill();
    }
  }

  const [npx, npy] = tamO(g, tt.nap[0], tt.nap[1]);
  if (anh(TRANH_NAP)) {
    const k = g.o * .82;
    ctx.drawImage(anh(TRANH_NAP), npx - k / 2, npy - k / 2, k, k);
  }
  ctx.strokeStyle = NAP;
  ctx.lineWidth = Math.max(2, g.o * .08);
  oTron(ctx, npx - g.o * .32, npy - g.o * .32, g.o * .64, g.o * .64, g.o * .1);
  ctx.stroke();
  ctx.fillStyle = 'rgba(111,211,184,.14)';
  ctx.fill();

  if (tt.quay && !daBan.has(tt)) {
    daBan.add(tt);
    for (const v of tt.vat) {
      const [bx, by] = tamO(g, v.x, v.y);
      phu.bui.ban(bx, by + g.o * .34, 7, BUI_GO, { toc: 40, song: .45, r: g.o * .035, toa: 4 });
    }
    phu.rung(.7);
  }

  // vật rơi: trượt từ chỗ vừa quay xong tới chỗ đứng yên
  const roiP = muot(kep((phu.nay - tt.luc - QUAY_MS * .75) / 320, 0, 1));
  const dau = new Map((tt.truoc ?? []).map((v) => [v.id, v]));
  for (const v of tt.vat) {
    const d = dau.get(v.id);
    const x = d ? lerp(d.x, v.x, roiP) : v.x;
    const y = d ? lerp(d.y, v.y, roiP) : v.y;
    const [px, py] = tamO(g, x, y);
    // bẹp một nhịp ngay khi tiếp đất — thứ cho cú rơi có sức nặng
    const chamDat = kep((phu.nay - tt.luc - QUAY_MS * .75 - 320) / 190, 0, 1);
    const ep = tt.quay ? Math.sin(chamDat * Math.PI) * .32 : 0;

    if (v.loai === 'devo') {
      const day = g.o * .1;
      bongMem(ctx, px - SANG.x * day, py + g.o * .34 + day * .5, g.o * .36, .4);
      khoi(ctx, px - g.o * .3, py - g.o * .3 + g.o * ep * .3, g.o * .6, g.o * .6 * (1 - ep * .3),
        day, '#d8c9a8', '#9b8a68', g.o * .06);
      ctx.strokeStyle = 'rgba(90,70,40,.55)';
      ctx.lineWidth = Math.max(1, g.o * .035);
      ctx.beginPath();
      ctx.moveTo(px - g.o * .16, py - g.o * .28); ctx.lineTo(px - g.o * .02, py - g.o * .04);
      ctx.lineTo(px - g.o * .13, py + g.o * .1); ctx.lineTo(px + g.o * .04, py + g.o * .28);
      ctx.stroke();
    } else if (v.loai === 'hom') {
      bongMem(ctx, px, py + g.o * .36, g.o * .44, .5);
      const t = anh(TRANH_HOM);
      if (t) {
        const k = g.o * .92;
        ctx.drawImage(t, px - k / 2, py - k * .48 + g.o * ep * .3, k, k * (1 - ep * .3));
      } else {
        khoi(ctx, px - g.o * .4, py - g.o * .3, g.o * .8, g.o * .6, g.o * .12, '#6b4a2a', '#43301c', g.o * .08);
      }
    } else if (v.loai === 'kien' && anh(TRANH_KIEN)) {
      bongMem(ctx, px, py + g.o * .36, g.o * .38, .46);
      const k = g.o * .84;
      ctx.drawImage(anh(TRANH_KIEN), px - k / 2, py - k / 2 + g.o * ep * .3, k, k * (1 - ep * .3));
    } else if (v.loai === 'kien') {
      const day = g.o * .13;
      bongMem(ctx, px - SANG.x * day, py + g.o * .34 + day * .5, g.o * .4, .46);
      khoi(ctx, px - g.o * .33, py - g.o * .33 + g.o * ep * .3, g.o * .66, g.o * .66 * (1 - ep * .3),
        day, KIEN, '#7d5126', g.o * .07);
      ctx.fillStyle = 'rgba(70,43,20,.5)';
      ctx.fillRect(px - g.o * .33, py - g.o * .04 + g.o * ep * .3, g.o * .66, g.o * .09);
    } else {
      // nhìn về phía nắp hầm — thằng bé biết mình cần tới đâu
      const nhin = [tt.nap[0] - v.x, tt.nap[1] - v.y];
      bongMem(ctx, px, py + g.o * .3, g.o * .36 * (1 + ep), .48);
      nhanVat(ctx, px, py, g.o * .26, {
        nhin: nhin[0] || nhin[1] ? nhin : [0, 1], ep,
        than: NGUOI, toi: 'rgba(25,20,16,.82)', nay: phu.nay, mam: v.id,
      });
    }
  }
  ctx.restore();
  toiGoc(ctx, phu.W, phu.H, .5);
}

// vân gỗ: sọc dọc + thớ, sinh một lần rồi giữ lại
function veVanGo(c, W, H) {
  const anh = c.createImageData(W, H);
  const d = anh.data;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const soc = Math.sin(x * .07 + nhieu(x, y, 40, 5) * 6) * 7;
      const tho = nhieu(x, y, 3, 6) * 11;
      const v = soc + tho;
      const i = (y * W + x) * 4;
      d[i] = 48 + v; d[i + 1] = 35 + v * .8; d[i + 2] = 25 + v * .6; d[i + 3] = 255;
    }
  c.putImageData(anh, 0, 0);
}

export default {
  ten: 'Thùng Hàng',
  goi: '← → đi bộ; chạm kiện hàng thì trèo lên. Đẩy vào thành thùng là cả thùng nghiêng, mọi thứ rơi theo chiều "dưới" mới. Kiện nhạt màu rơi quá 3 ô là vỡ, và hòm nặng đè lên là vỡ ngay. Đưa người xuống nắp hầm.',
  tyLe: .92,
  mau: { chinh: DAI, nen: NEN, phu: KIEN },
  batDau, buoc, ve,
  MAN: MAN.xoay,
};
