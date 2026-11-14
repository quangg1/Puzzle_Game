// HỐ SỤT — bạn không điều khiển nhân vật, bạn điều khiển cái hố.
// Hố chỉ nuốt được thứ không to hơn nó. Nuốt đủ thì hố rộng ra. Dọn sạch bãi.
// Thế giới: sa mạc, cát, đá — thứ rơi xuống hố thì ai cũng biết là mất.
import { laTuong, tamO, oTron, kep, lerp, muot, nhieu, bongMem, toiGoc, khoi, SANG, anh } from '../nen.js';
import { MAN } from '../man.js';

const TROI = '#241910', CAT = [214, 186, 140], DA = [96, 76, 54];
const HO = '#070503', MEP = '#9c7a4e';
const VAT = ['#aab6c0', '#c88d55', '#6fa263'];   // cỡ 1 sỏi · 2 thùng · 3 bụi xương rồng
const BUI_CAT = '#d8bd8e';

const daBan = new WeakSet();        // trạng thái nào đã bắn bụi rồi thì thôi
// Hố to dần nhưng KHÔNG tràn ra ô bên cạnh — tràn thì người chơi không biết hố đang ở ô nào.
const banKinh = (co) => Math.min(.44, .2 + (co - 1) * .08);

function batDau(man) {
  const vat = [];
  // kieu: chỉ để vẽ — các vật cùng cỡ lần lượt mang kiểu khác nhau, đỡ lặp hình
  // Lệch theo từng màn: không có nó thì màn nào cũng "sỏi, sọ, lon, thùng, hộp" y hệt.
  const lech = [...man.dong.join('')].reduce((t, c, i) => (t + c.charCodeAt(0) * (i + 1)) % 997, 0);
  ['1', '2', '3'].forEach((c, i) => man.lay(c).forEach(([x, y], k) => vat.push({ x, y, co: i + 1, kieu: k + lech })));
  for (const [x, y] of man.lay('c')) vat.push({ x, y, co: 1, chum: true });
  const [x, y] = man.lay('@')[0];
  return { x, y, vat, nuot: 0, luc: 0, vuaNuot: null };
}

const coHo = (tt) => 1 + Math.floor(tt.nuot / 2);

// Hố rộng thì không lách qua chỗ hẹp được. Một dòng luật, nhưng đây là thứ
// biến game thành câu đố: hố chỉ to lên chứ không nhỏ lại, nên ăn sai thứ tự
// là tự nhốt mình khỏi những ngóc ngách còn đồ. Trước đó bẫy = 0 ở cả 10 màn.
//   cỡ 1: cần ≥1 lối — gần như mọi ô
//   cỡ 2: cần ≥2 lối — hết chui vào ngõ cụt
//   cỡ 3: cần ≥3 lối — hết đi trong hành lang
const soLoi = (man, x, y) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !laTuong(man, x + dx, y + dy)).length;

function buoc(man, tt, huong) {
  const [dx, dy] = { len: [0, -1], xuong: [0, 1], trai: [-1, 0], phai: [1, 0] }[huong];
  const nx = tt.x + dx, ny = tt.y + dy;
  if (laTuong(man, nx, ny)) return null;

  const loi = soLoi(man, nx, ny), co = coHo(tt);
  if (loi < co)
    return { tt, bao: `Hố cỡ ${co} cần ô thoáng ${co} mặt. Ô đó chỉ thoáng ${loi} mặt.`, loai: 'ket' };

  const v = tt.vat.find((k) => k.x === nx && k.y === ny);
  if (v && v.co > co) return { tt, bao: `Hố mới cỡ ${co}, thứ đó cỡ ${v.co}.`, loai: 'ket' };

  const vat = v ? tt.vat.filter((k) => k !== v) : tt.vat;
  // Chum nước làm hố NHỎ LẠI một cỡ — đối trọng với luật hố chỉ to lên.
  // Nhờ nó mà thứ tự ăn thành bài toán thật: uống chum sớm là phí, để đúng
  // lúc thì lách lại được vào hành lang còn đồ.
  const them = v ? (v.chum ? -2 : 1) : 0;
  const moi = {
    x: nx, y: ny, vat,
    nuot: Math.max(0, tt.nuot + them),
    luc: v ? performance.now() : tt.luc,
    vuaNuot: v ? { ...v } : null,
  };
  return { tt: moi, thang: vat.length === 0 };
}

// Nền vẽ một lần rồi giữ lại: cát có hạt, đá có vân, không phải màu phẳng.
function veNen(ctx, W, H, man, g) {
  const anh = ctx.createImageData(W, H);
  const d = anh.data;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const ox = Math.floor((x - g.x0) / g.o), oy = Math.floor((y - g.y0) / g.o);
      const trong = x >= g.x0 && y >= g.y0 && ox < man.rong && oy < man.cao && ox >= 0 && oy >= 0;
      let m;
      if (!trong) m = [26, 18, 11];
      else if (laTuong(man, ox, oy)) {
        const v = nhieu(x, y, 9, 3) * 26 + nhieu(x, y, 2.2, 4) * 12;
        m = DA.map((c) => c + v - 14);
      } else {
        const v = nhieu(x, y, 26, 1) * 20 + nhieu(x, y, 1.7, 2) * 13;
        m = CAT.map((c, i) => c + v - 12 - i * 3);
      }
      const i = (y * W + x) * 4;
      d[i] = m[0]; d[i + 1] = m[1]; d[i + 2] = m[2]; d[i + 3] = 255;
    }
  ctx.putImageData(anh, 0, 0);

  // Đường cào cát theo mép ô. Bỏ lưới đi thì cát liền một khối và người chơi
  // không đọc được ô nào là ô nào — lỗi chơi được, không phải lỗi đẹp xấu.
  for (let y = 0; y < man.cao; y++)
    for (let x = 0; x < man.rong; x++) {
      if (laTuong(man, x, y)) continue;
      const px = g.x0 + x * g.o, py = g.y0 + y * g.o;
      ctx.strokeStyle = 'rgba(126,98,60,.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (!laTuong(man, x + 1, y)) { ctx.moveTo(px + g.o - .5, py + g.o * .08); ctx.lineTo(px + g.o - .5, py + g.o * .92); }
      if (!laTuong(man, x, y + 1)) { ctx.moveTo(px + g.o * .08, py + g.o - .5); ctx.lineTo(px + g.o * .92, py + g.o - .5); }
      ctx.stroke();
      // vài hạt sạn cho mặt cát đỡ trống
      for (let k = 0; k < 3; k++) {
        const a = nhieu(x * 37 + k * 11, y * 53 + k, 1.3, 7), b = nhieu(y * 41 + k, x * 29 + k * 7, 1.3, 8);
        ctx.fillStyle = `rgba(108,84,50,${.1 + a * .12})`;
        ctx.beginPath();
        ctx.arc(px + g.o * (.15 + a * .7), py + g.o * (.15 + b * .7), g.o * (.012 + b * .022), 0, 7);
        ctx.fill();
      }
    }

  // mép đá lún xuống cát
  for (let y = 0; y < man.cao; y++)
    for (let x = 0; x < man.rong; x++)
      if (laTuong(man, x, y)) {
        ctx.fillStyle = 'rgba(40,26,14,.3)';
        oTron(ctx, g.x0 + x * g.o, g.y0 + y * g.o + g.o * .12, g.o, g.o, g.o * .2);
        ctx.fill();
        ctx.fillStyle = 'rgba(150,120,86,.16)';
        oTron(ctx, g.x0 + x * g.o + g.o * .1, g.y0 + y * g.o + g.o * .08, g.o * .8, g.o * .3, g.o * .14);
        ctx.fill();
      }
  toiGoc(ctx, W, H, .55);
}

function ve(ctx, man, tt, g, phu) {
  ctx.fillStyle = TROI;
  ctx.fillRect(-20, -20, phu.W + 40, phu.H + 40);
  ctx.drawImage(phu.van(man.dong.join('|'), phu.W, phu.H, (c, W, H) => veNen(c, W, H, man, g)), 0, 0);

  const co = coHo(tt);
  veVungCam(ctx, man, g, co);

  // vẽ hàng trên trước: cây cao ló lên phải đè lên ô phía sau nó, không bị ô sau đè
  tt.vat.map((v, i) => [v, i]).sort((a, b) => a[0].y - b[0].y).forEach(([v, i]) => {
    const [px, py] = tamO(g, v.x, v.y);
    const vao = muot(kep((phu.vaoMan - i * .055) / .55, 0, 1));
    if (vao <= 0) return;
    // Ăn được NGAY thì sáng; quá to hoặc nằm trong ô hố không vào nổi thì mờ.
    const anDuoc = v.co <= co && soLoi(man, v.x, v.y) >= co;
    veVat(ctx, px, py - (1 - vao) * g.o * 1.5, g.o, v.co, vao * (anDuoc ? 1 : .55), v.chum, v.kieu);
    veNhan(ctx, px, py - (1 - vao) * g.o * 1.5, g.o, v, anDuoc, vao);
  });

  // vật vừa bị nuốt: chìm xuống, xoay nhẹ, kèm bụi cát
  const t = kep((phu.nay - tt.luc) / 420, 0, 1);
  if (tt.vuaNuot) {
    const [px, py] = tamO(g, tt.vuaNuot.x, tt.vuaNuot.y);
    if (!daBan.has(tt)) {
      daBan.add(tt);
      phu.bui.ban(px, py, 16, BUI_CAT, { toc: 46, song: .5, r: g.o * .05, toa: 10 });
      phu.rung(.45 + tt.vuaNuot.co * .2);
    }
    if (t < 1) {
      ctx.save();
      ctx.translate(px, py + g.o * .3 * muot(t));
      ctx.rotate(muot(t) * .5);
      ctx.scale(1 - muot(t) * .6, 1 - muot(t) * .6);
      veVat(ctx, 0, 0, g.o, tt.vuaNuot.co, 1 - muot(t) * .8, tt.vuaNuot.chum, tt.vuaNuot.kieu);
      ctx.restore();
    }
  }

  // cái hố — trượt mượt từ ô cũ sang ô mới
  const tx = phu.truoc ? lerp(phu.truoc.x, tt.x, phu.pm) : tt.x;
  const ty = phu.truoc ? lerp(phu.truoc.y, tt.y, phu.pm) : tt.y;
  const [hx, hy] = tamO(g, tx, ty);
  const coTruoc = phu.truoc ? coHo(phu.truoc) : coHo(tt);
  const r = g.o * lerp(banKinh(coTruoc), banKinh(coHo(tt)), muot(phu.p));

  ctx.fillStyle = MEP;
  ctx.beginPath(); ctx.ellipse(hx, hy, r * 1.24, r * 1.12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(60,40,22,.55)';
  ctx.beginPath(); ctx.ellipse(hx, hy + r * .06, r * 1.1, r * 1, 0, 0, 7); ctx.fill();
  ctx.fillStyle = HO;
  ctx.beginPath(); ctx.ellipse(hx, hy, r, r * .9, 0, 0, 7); ctx.fill();
  const sau = ctx.createRadialGradient(hx, hy - r * .45, 0, hx, hy, r);
  sau.addColorStop(0, 'rgba(96,66,34,.45)'); sau.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sau;
  ctx.beginPath(); ctx.ellipse(hx, hy, r, r * .9, 0, 0, 7); ctx.fill();

  // Vành tiến độ quanh miệng hố: nửa vòng sáng = đã ăn 1/2 thứ để lớn thêm.
  ctx.lineWidth = Math.max(2, g.o * .05);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(40,26,12,.45)';
  ctx.beginPath(); ctx.ellipse(hx, hy, r * 1.36, r * 1.24, 0, 0, 7); ctx.stroke();
  if (tt.nuot % 2) {
    ctx.strokeStyle = SAC_HUD;
    ctx.beginPath(); ctx.ellipse(hx, hy, r * 1.36, r * 1.24, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  }

  // Hai con mắt nhìn ra từ trong tối. Đây là thứ biến "một lỗ đen" thành
  // "một con gì đó đang ăn" — và là chi tiết người chơi nhớ nhất.
  const [lx, ly] = { len: [0, -1], xuong: [0, 1], trai: [-1, 0], phai: [1, 0] }[phu.huongCuoi] ?? [0, 1];
  const nhay = ((phu.nay % 3600) < 110);
  const cach = r * .4, day = r * .24;
  for (const ben of [-1, 1]) {
    const mx = hx + lx * day - ly * cach * ben;
    const my = hy + ly * day * .8 + lx * cach * ben - r * .06;
    if (nhay) {
      ctx.strokeStyle = 'rgba(248,226,178,.5)';
      ctx.lineWidth = Math.max(1, r * .1);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mx - r * .13, my); ctx.lineTo(mx + r * .13, my); ctx.stroke();
    } else {
      const q = ctx.createRadialGradient(mx, my, 0, mx, my, r * .3);
      q.addColorStop(0, 'rgba(250,224,160,.55)'); q.addColorStop(1, 'rgba(250,224,160,0)');
      ctx.fillStyle = q;
      ctx.beginPath(); ctx.arc(mx, my, r * .3, 0, 7); ctx.fill();
      ctx.fillStyle = '#f8e2b2';
      ctx.beginPath(); ctx.ellipse(mx, my, r * .15, r * .19, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(20,12,4,.8)';
      ctx.beginPath(); ctx.ellipse(mx + lx * r * .045, my + ly * r * .045, r * .07, r * .1, 0, 0, 7); ctx.fill();
    }
  }

  veHud(ctx, g, tt);
}

const SAC_HUD = '#f2c46d';

// Ô hố KHÔNG vào được với cỡ hiện tại: tối hẳn, gạch chéo.
// Ô sẽ cấm khi hố lớn thêm một cỡ: gạch chéo mờ — để người chơi thấy trước cái bẫy.
function veVungCam(ctx, man, g, co) {
  for (let y = 0; y < man.cao; y++)
    for (let x = 0; x < man.rong; x++) {
      if (laTuong(man, x, y)) continue;
      const l = soLoi(man, x, y);
      const camNay = l < co, camSau = !camNay && l < co + 1;
      if (!camNay && !camSau) continue;
      const px = g.x0 + x * g.o, py = g.y0 + y * g.o;
      ctx.save();
      ctx.beginPath(); ctx.rect(px + 1, py + 1, g.o - 2, g.o - 2); ctx.clip();
      if (camNay) { ctx.fillStyle = 'rgba(38,24,12,.5)'; ctx.fillRect(px, py, g.o, g.o); }
      ctx.strokeStyle = camNay ? 'rgba(20,12,6,.5)' : 'rgba(120,70,30,.28)';
      ctx.lineWidth = Math.max(1.5, g.o * (camNay ? .045 : .03));
      ctx.beginPath();
      for (let k = -g.o; k < g.o * 2; k += g.o * .22) { ctx.moveTo(px + k, py); ctx.lineTo(px + k - g.o, py + g.o); }
      ctx.stroke();
      ctx.restore();
    }
}

// Số cỡ trên mỗi vật. Sáng = ăn được ngay; tối = chưa. Chum ghi "−1" (bớt một cỡ).
function veNhan(ctx, px, py, o, v, anDuoc, mo) {
  const r = Math.max(8, o * .15);
  const x = px + o * .3, y = py + o * .28;
  ctx.globalAlpha = mo;
  ctx.fillStyle = v.chum ? '#3d7fb8' : anDuoc ? '#f6ead2' : '#3a2a1a';
  ctx.strokeStyle = v.chum ? '#bfe0ff' : anDuoc ? '#5a3d1e' : '#7a6248';
  ctx.lineWidth = Math.max(1.2, o * .025);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = v.chum ? '#fff' : anDuoc ? '#3a250f' : '#9c8468';
  ctx.font = `700 ${Math.round(r * 1.25)}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(v.chum ? '−1' : String(v.co), x, y + r * .06);
  ctx.globalAlpha = 1;
}

// Bảng cỡ hố ở hàng tường trên cùng: "HỐ CỠ 2  ●○".
function veHud(ctx, g, tt) {
  const co = coHo(tt);
  const h = Math.max(20, g.o * .42), cx = g.x0 + g.o * .25, cy = g.y0 + g.o * .5;
  ctx.font = `700 ${Math.round(h * .55)}px system-ui, sans-serif`;
  const chu = `HỐ CỠ ${co}`;
  const w = ctx.measureText(chu).width + h * 2.4;
  ctx.fillStyle = 'rgba(20,12,6,.82)';
  oTron(ctx, cx, cy - h / 2, w, h, h / 2); ctx.fill();
  ctx.fillStyle = SAC_HUD;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(chu, cx + h * .45, cy + 1);
  for (let k = 0; k < 2; k++) {
    const dx = cx + w - h * (1.45 - k * .6), dr = h * .17;
    ctx.beginPath(); ctx.arc(dx, cy, dr, 0, 7);
    if (k < tt.nuot % 2) { ctx.fillStyle = SAC_HUD; ctx.fill(); }
    else { ctx.strokeStyle = SAC_HUD; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
}

// Ba kiểu cho mỗi cỡ, cho bãi đỡ lặp. Kiểu chọn theo vị trí nên màn nào
// cũng trông y như lần trước. CỠ TO PHẢI TRÔNG TO: nhìn là biết thứ nào nặng ký,
// chưa cần đọc số. Cỡ 3 cao hơn một ô, ló lên ô trên — như cây thật đứng trên bãi.
const KIEU = {
  1: ['c1-soi', 'c1-so', 'c1-lon'],
  2: ['c2-thung', 'c2-hop', 'c2-banh'],
  3: ['c3-xuong-rong', 'c3-da', 'c3-cay-kho'],
  chum: ['chum'],
};
const CAO = { 1: .58, 2: .9, 3: 1.32, chum: .84 };    // chiều cao tranh, tính theo ô
const tranhCua = (co, chum, kieu = 0) => {
  const ds = KIEU[chum ? 'chum' : co];
  return `assets/sprite/lo/${ds[kieu % ds.length]}.webp`;
};

const toiHon = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
};

function veVat(ctx, px, py, o, co, mo, chum, kieu = 0) {
  ctx.globalAlpha = mo;
  const s = o * (chum ? .3 : .2 + co * .1);
  const t = anh(tranhCua(co, chum, kieu));
  if (t && t.width) {
    // giữ đúng tỉ lệ ảnh; chân vật đặt ở đáy ô, phần cao ló lên trên
    let h = o * CAO[chum ? 'chum' : co], w = h * t.width / t.height;
    const rongMax = o * (co === 3 ? 1.08 : .92);
    if (w > rongMax) { h *= rongMax / w; w = rongMax; }
    const day = py + o * .36;
    bongMem(ctx, px, day - o * .03, w * .42, .38);
    ctx.drawImage(t, px - w / 2, day - h, w, h);
    ctx.globalAlpha = 1;
    return;
  }
  const day = s * (.22 + co * .1);
  bongMem(ctx, px - SANG.x * day, py + s * .66 + day * .4, s * 1.35, .42);

  const mau = VAT[co - 1], canh = toiHon(mau, .56);
  if (co === 1) {
    // hòn đá: mặt bên lộ ra phía khuất sáng
    ctx.fillStyle = canh;
    ctx.beginPath(); ctx.ellipse(px - SANG.x * day * .5, py + day * .5, s * .74, s * .7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = mau;
    ctx.beginPath(); ctx.ellipse(px, py, s * .74, s * .68, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.34)';
    ctx.beginPath(); ctx.ellipse(px + SANG.x * s * .3, py + SANG.y * s * .3, s * .3, s * .22, -.5, 0, 7); ctx.fill();
  } else if (co === 2) {
    // thùng gỗ: khối có bề dày + nẹp ngang
    khoi(ctx, px - s * .82, py - s * .8, s * 1.64, s * 1.5, day, mau, canh, s * .26);
    ctx.fillStyle = 'rgba(70,40,18,.42)';
    ctx.fillRect(px - s * .82, py - s * .2, s * 1.64, s * .24);
  } else {
    // bản dự phòng vẽ bằng code — dùng khi ảnh chưa tải xong hoặc thiếu tệp
    const than = (x, y, w, h, r) => {
      oTron(ctx, x - SANG.x * day * .5, y + day, w, h, r); ctx.fillStyle = canh; ctx.fill();
      oTron(ctx, x, y, w, h, r); ctx.fillStyle = mau; ctx.fill();
    };
    than(px - s * .95, py - s * .3, s * .58, s * .54, s * .26);
    than(px + s * .37, py - s * .52, s * .58, s * .54, s * .26);
    than(px - s * .36, py - s * .98, s * .72, s * 1.9, s * .34);
    ctx.fillStyle = 'rgba(255,255,255,.26)';
    oTron(ctx, px - s * .28, py - s * .9, s * .2, s * 1.68, s * .1); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    oTron(ctx, px + s * .16, py - s * .86, s * .14, s * 1.6, s * .07); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export default {
  ten: 'Hố Sụt',
  goi: 'Bạn là cái hố. Chỉ nuốt được thứ không to hơn mình, nuốt 2 thứ thì hố to thêm một cỡ. Hố cỡ N chỉ vào được ô thoáng N mặt. Chum nước làm hố nhỏ lại. Dọn sạch bãi.',
  tyLe: .62,
  mau: { chinh: '#d9bb8a', nen: TROI, phu: VAT[2] },
  batDau, buoc, ve,
  MAN: MAN.lo,
};
