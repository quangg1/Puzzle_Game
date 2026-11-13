// TIA SÉT — một phím điều khiển mọi tia. Chạm ngạnh chẻ là tách làm đôi.
// Phủ hết các chấu thu thì xong. Thế giới: điện trắng xanh trên nền đêm.
import { laTuong, tamO, oTron, kep, lerp, muot, nhieu, toiGoc } from '../nen.js';
import { MAN } from '../man.js';

const NEN = '#05070c', O = '#0e1520', TUONG = '#1a2331';
const DIEN = '#6ee7ff', TRANG = '#eafcff', CHAU = '#f0a93c';

const vuongGoc = (h) => (h === 'trai' || h === 'phai' ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]]);
const BUOC = { len: [0, -1], xuong: [0, 1], trai: [-1, 0], phai: [1, 0] };
const daBan = new WeakSet();

function batDau(man) {
  return {
    tia: man.lay('@').map(([x, y]) => `${x},${y}`),
    nganh: new Set(man.lay('Y').map((p) => p.join(','))),
    luc: 0, noAt: [],
  };
}

function buoc(man, tt, huong) {
  const [dx, dy] = BUOC[huong];
  let tia = new Set();
  for (const k of tt.tia) {
    const [x, y] = k.split(',').map(Number);
    tia.add(laTuong(man, x + dx, y + dy) ? k : `${x + dx},${y + dy}`);
  }

  const nganh = new Set(tt.nganh);
  const noAt = [];
  for (const k of [...tia]) {
    if (!nganh.has(k)) continue;
    const [x, y] = k.split(',').map(Number);
    const ra = vuongGoc(huong)
      .map(([ax, ay]) => [x + ax, y + ay])
      .filter(([ax, ay]) => !laTuong(man, ax, ay));
    if (!ra.length) continue;          // bí cả hai bên thì không chẻ
    tia.delete(k);
    nganh.delete(k);                   // ngạnh cháy hết sau một lần
    noAt.push(k);
    for (const [ax, ay] of ra) tia.add(`${ax},${ay}`);
  }

  if ([...tia].join('|') === [...tt.tia].join('|') && !noAt.length) return null;

  const chau = man.lay('X').map((p) => p.join(','));
  const thang = tia.size === chau.length && chau.every((c) => tia.has(c));
  return { tt: { tia: [...tia], nganh, luc: performance.now(), noAt }, thang };
}

const toa = (k) => k.split(',').map(Number);

// đường gấp khúc kiểu tia điện, nhiễu đổi ~20 lần/giây cho nó giật giật
function veTia(ctx, x1, y1, x2, y2, bien, hat, rong, mau) {
  const n = 6;
  ctx.strokeStyle = mau;
  ctx.lineWidth = rong;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const nx = -(y2 - y1), ny = x2 - x1;
    const d = Math.hypot(nx, ny) || 1;
    const lech = (nhieu(i * 13 + hat, hat, 1.6, 9) - .5) * bien * Math.sin(t * Math.PI);
    ctx.lineTo(lerp(x1, x2, t) + (nx / d) * lech, lerp(y1, y2, t) + (ny / d) * lech);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function veNen(ctx, W, H, man, g) {
  ctx.fillStyle = NEN;
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < man.cao; y++)
    for (let x = 0; x < man.rong; x++) {
      const tuong = laTuong(man, x, y);
      const px = g.x0 + x * g.o, py = g.y0 + y * g.o;
      ctx.fillStyle = tuong ? TUONG : O;
      oTron(ctx, px + 1.5, py + 1.5, g.o - 3, g.o - 3, g.o * .16);
      ctx.fill();
      if (tuong) {
        ctx.strokeStyle = 'rgba(120,160,200,.12)';
        ctx.lineWidth = 1;
        oTron(ctx, px + 2.5, py + 2.5, g.o - 5, g.o - 5, g.o * .14);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(110,231,255,.05)';
        oTron(ctx, px + g.o * .14, py + g.o * .14, g.o * .72, g.o * .72, g.o * .1);
        ctx.fill();
      }
    }
  toiGoc(ctx, W, H, .62);
}

function ve(ctx, man, tt, g, phu) {
  ctx.drawImage(phu.van(man.dong.join('|'), phu.W, phu.H, (c, W, H) => veNen(c, W, H, man, g)), 0, 0);
  const hat = Math.floor(phu.nay / 50);

  // ngạnh chẻ — hình chữ Y, khẽ thở
  for (const k of tt.nganh) {
    const [x, y] = toa(k);
    const [px, py] = tamO(g, x, y);
    const nhip = .55 + .25 * Math.sin(phu.nay / 420 + x + y);
    ctx.strokeStyle = `rgba(110,231,255,${nhip})`;
    ctx.lineWidth = Math.max(2, g.o * .09);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(px, py + g.o * .26);
    ctx.lineTo(px, py);
    ctx.lineTo(px - g.o * .24, py - g.o * .26);
    ctx.moveTo(px, py);
    ctx.lineTo(px + g.o * .24, py - g.o * .26);
    ctx.stroke();
  }

  // chấu thu
  const dangCo = new Set(tt.tia);
  for (const [x, y] of man.lay('X')) {
    const [px, py] = tamO(g, x, y);
    const day = dangCo.has(`${x},${y}`);
    if (day) {
      const q = ctx.createRadialGradient(px, py, 0, px, py, g.o * .55);
      q.addColorStop(0, 'rgba(110,231,255,.35)'); q.addColorStop(1, 'rgba(110,231,255,0)');
      ctx.fillStyle = q;
      ctx.beginPath(); ctx.arc(px, py, g.o * .55, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = day ? DIEN : CHAU;
    ctx.lineWidth = Math.max(2, g.o * .08);
    ctx.beginPath(); ctx.arc(px, py, g.o * .3, 0, 7); ctx.stroke();
  }

  // tia: mỗi tia hiện tại phóng ra từ tia cũ GẦN NHẤT — chẻ đôi thì hai con
  // cùng phóng ra từ một mẹ, nhìn đúng như điện tách nhánh.
  const cu = (phu.truoc?.tia ?? []).map(toa);
  for (const k of tt.tia) {
    const [x, y] = toa(k);
    let goc = [x, y];
    if (cu.length) {
      let xa = 1e9;
      for (const c of cu) {
        const d = Math.abs(c[0] - x) + Math.abs(c[1] - y);
        if (d < xa) { xa = d; goc = c; }
      }
    }
    const [gx, gy] = tamO(g, goc[0], goc[1]);
    const [px, py] = tamO(g, x, y);
    const cx = lerp(gx, px, phu.pm), cy = lerp(gy, py, phu.pm);

    if (phu.p < 1 && (gx !== px || gy !== py)) {
      veTia(ctx, gx, gy, cx, cy, g.o * .3, hat + x * 7 + y, Math.max(1.5, g.o * .05),
        `rgba(110,231,255,${(1 - phu.p) * .75})`);
    }
    const q = ctx.createRadialGradient(cx, cy, 0, cx, cy, g.o * .66);
    q.addColorStop(0, 'rgba(150,240,255,.55)');
    q.addColorStop(.45, 'rgba(110,231,255,.22)');
    q.addColorStop(1, 'rgba(110,231,255,0)');
    ctx.fillStyle = q;
    ctx.beginPath(); ctx.arc(cx, cy, g.o * .66, 0, 7); ctx.fill();
    ctx.fillStyle = TRANG;
    ctx.beginPath(); ctx.arc(cx, cy, g.o * (.16 + .03 * Math.sin(phu.nay / 90 + x)), 0, 7); ctx.fill();
  }

  // chẻ: chớp trắng + tia lửa bắn ra
  if (tt.noAt?.length && !daBan.has(tt)) {
    daBan.add(tt);
    for (const k of tt.noAt) {
      const [x, y] = toa(k);
      const [px, py] = tamO(g, x, y);
      phu.bui.ban(px, py, 20, TRANG, { toc: 150, song: .4, r: g.o * .035, rot: 40, toa: 0 });
    }
    phu.rung(.8);
  }
  const tn = kep((phu.nay - tt.luc) / 300, 0, 1);
  for (const k of tt.noAt ?? []) {
    if (tn >= 1) break;
    const [x, y] = toa(k);
    const [px, py] = tamO(g, x, y);
    ctx.strokeStyle = `rgba(234,252,255,${(1 - tn) * .85})`;
    ctx.lineWidth = Math.max(1.5, g.o * .06 * (1 - tn));
    ctx.beginPath(); ctx.arc(px, py, g.o * (.2 + muot(tn) * .9), 0, 7); ctx.stroke();
  }
}

export default {
  ten: 'Tia Sét',
  goi: 'Một phím điều khiển mọi tia cùng lúc. Chạm ngạnh chữ Y là tách làm đôi. Phủ kín các chấu thu.',
  tyLe: .66,
  mau: { chinh: DIEN, nen: NEN, phu: CHAU },
  batDau, buoc, ve,
  MAN: MAN.tachDoi,
};
