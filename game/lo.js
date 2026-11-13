// HỐ SỤT — bạn không điều khiển nhân vật, bạn điều khiển cái hố.
// Hố chỉ nuốt được thứ không to hơn nó. Nuốt đủ thì hố rộng ra. Dọn sạch bãi.
// Thế giới: sa mạc, cát, đá — thứ rơi xuống hố thì ai cũng biết là mất.
import { laTuong, tamO, oTron, kep, lerp, muot, nhieu, bongMem, toiGoc, khoi, SANG } from '../nen.js';
import { MAN } from '../man.js';

const TROI = '#241910', CAT = [214, 186, 140], DA = [96, 76, 54];
const HO = '#070503', MEP = '#9c7a4e';
const VAT = ['#aab6c0', '#c88d55', '#6fa263'];   // cỡ 1 sỏi · 2 thùng · 3 bụi xương rồng
const BUI_CAT = '#d8bd8e';

const daBan = new WeakSet();        // trạng thái nào đã bắn bụi rồi thì thôi
const banKinh = (co) => .22 + (co - 1) * .14;   // dùng chung cho hố và vòng "cần cỡ này"

function batDau(man) {
  const vat = [];
  ['1', '2', '3'].forEach((c, i) => man.lay(c).forEach(([x, y]) => vat.push({ x, y, co: i + 1 })));
  const [x, y] = man.lay('@')[0];
  return { x, y, vat, nuot: 0, luc: 0, vuaNuot: null };
}

const coHo = (tt) => 1 + Math.floor(tt.nuot / 2);

function buoc(man, tt, huong) {
  const [dx, dy] = { len: [0, -1], xuong: [0, 1], trai: [-1, 0], phai: [1, 0] }[huong];
  const nx = tt.x + dx, ny = tt.y + dy;
  if (laTuong(man, nx, ny)) return null;

  const v = tt.vat.find((k) => k.x === nx && k.y === ny);
  if (v && v.co > coHo(tt)) return { tt, bao: 'Hố còn bé hơn thứ đó.', loai: 'ket' };

  const vat = v ? tt.vat.filter((k) => k !== v) : tt.vat;
  const moi = {
    x: nx, y: ny, vat,
    nuot: tt.nuot + (v ? 1 : 0),
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

  tt.vat.forEach((v, i) => {
    const [px, py] = tamO(g, v.x, v.y);
    const vao = muot(kep((phu.vaoMan - i * .055) / .55, 0, 1));
    if (vao <= 0) return;
    veVat(ctx, px, py - (1 - vao) * g.o * 1.5, g.o, v.co, vao);
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
      veVat(ctx, 0, 0, g.o, tt.vuaNuot.co, 1 - muot(t) * .8);
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
}

const toiHon = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
};

function veVat(ctx, px, py, o, co, mo) {
  ctx.globalAlpha = mo;
  const s = o * (.2 + co * .1);
  const day = s * (.22 + co * .1);
  bongMem(ctx, px - SANG.x * day, py + s * .66 + day * .4, s * 1.35, .42);

  // vòng nét đứt = hố phải to tới đây mới nuốt nổi. So hai vòng tròn là hiểu luật.
  ctx.setLineDash([o * .07, o * .07]);
  ctx.strokeStyle = `rgba(58,36,16,${.44 * mo})`;
  ctx.lineWidth = Math.max(1.2, o * .035);
  ctx.beginPath(); ctx.arc(px, py, o * banKinh(co), 0, 7); ctx.stroke();
  ctx.setLineDash([]);

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
    // bụi xương rồng: thân đứng, hai tay, một bên đón sáng
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
  goi: 'Bạn là cái hố. Chỉ nuốt được thứ không to hơn mình — nuốt đủ thì hố rộng ra. Dọn sạch bãi.',
  tyLe: .62,
  mau: { chinh: '#d9bb8a', nen: TROI, phu: VAT[2] },
  batDau, buoc, ve,
  MAN: MAN.lo,
};
