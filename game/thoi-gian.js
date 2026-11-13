// CUỘN PHIM — mỗi HÀNG là một khung hình, tức một khoảnh khắc.
// Trái/phải: đi trong không gian. Lên/xuống: đi trong thời gian.
// Rời một khung thì để lại bản thân cũ đứng đó, và nó chắn đường bạn.
import { laTuong, tamO, oTron, kep, lerp, muot, nhieu, bongMem, toiGoc, nhanVat, anh } from '../nen.js';

const TRANH_NOI = 'assets/sprite/vet-noi.svg';
import { MAN } from '../man.js';

const NEN = '#090b10', KHUNG = '#2d3845';
const NGUOI = '#f2f7fd', DAU = '#f4c95d', CUA = '#7ee0a8';

const BUOC = { len: [0, -1], xuong: [0, 1], trai: [-1, 0], phai: [1, 0] };
const daBan = new WeakSet();

function batDau(man) {
  const [x, y] = man.lay('@')[0];
  return { x, y, ma: new Set(), lay: new Set(), daCat: new Set(), luc: 0, doiKhung: false, vuaCat: false };
}

function buoc(man, tt, huong) {
  const [dx, dy] = BUOC[huong];
  const nx = tt.x + dx, ny = tt.y + dy;
  if (laTuong(man, nx, ny)) return null;
  if (tt.ma.has(`${nx},${ny}`))
    return { tt, bao: 'Bản thân cũ đang đứng đó.', loai: 'ket' };

  const ma = new Set(tt.ma);
  if (dy !== 0) ma.add(`${tt.x},${tt.y}`);        // đổi khung hình thì để lại mình cũ

  const lay = new Set(tt.lay);
  if (man.lay('o').some(([ax, ay]) => ax === nx && ay === ny)) lay.add(`${nx},${ny}`);

  // Vết nối: bước lên là CẮT khoảnh khắc đó khỏi cuộn phim — mọi bản thân cũ
  // trong khung hình ấy biến mất. Đối trọng với luật bóng ma vĩnh viễn, nhưng
  // dùng một lần rồi hết, nên vẫn phải tính thứ tự.
  const daCat = new Set(tt.daCat);
  const o = `${nx},${ny}`;
  let vuaCat = false;
  if (man.lay('s').some(([ax, ay]) => ax === nx && ay === ny) && !daCat.has(o)) {
    daCat.add(o);
    vuaCat = true;
    for (const k of [...ma]) if (Number(k.split(',')[1]) === ny) ma.delete(k);
  }

  const cua = man.lay('X')[0];
  const thang = nx === cua[0] && ny === cua[1] && lay.size === man.lay('o').length;
  return { tt: { x: nx, y: ny, ma, lay, daCat, luc: performance.now(), doiKhung: dy !== 0, vuaCat }, thang };
}

// Dải phim vẽ một lần rồi giữ lại: thớ nhũ tương, bụi, xước dọc.
function veNen(ctx, W, H, man, g) {
  const le = g.o * .34;
  ctx.fillStyle = NEN;
  ctx.fillRect(0, 0, W, H);

  const w = man.rong * g.o;
  const anh = ctx.createImageData(W, H);
  const d = anh.data;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const trongPhim = x > g.x0 - le && x < g.x0 + w + le && y > g.y0 && y < g.y0 + man.cao * g.o;
      const hang = Math.floor((y - g.y0) / g.o);
      const he = (y - g.y0 - hang * g.o) / g.o;
      const khe = he < .07 || he > .93;            // vạch đen giữa các khung
      let v;
      if (!trongPhim) v = 9 + nhieu(x, y, 2, 1) * 5;
      else if (khe) v = 7 + nhieu(x, y, 2, 2) * 4;
      else v = 30 + nhieu(x, y, 1.6, 3) * 16 + nhieu(x, y, 30, 4) * 10;
      d[i] = v; d[i + 1] = v + 3; d[i + 2] = v + 8; d[i + 3] = 255;
    }
  ctx.putImageData(anh, 0, 0);

  for (let y = 0; y < man.cao; y++) {
    const py = g.y0 + y * g.o, he = g.o * .07;
    // lỗ răng phim hai mép — nói "đây là các khung hình" mà không cần chữ
    ctx.fillStyle = '#05070a';
    for (const lx of [g.x0 - le * .78, g.x0 + w + le * .2]) {
      oTron(ctx, lx, py + g.o * .3, le * .58, g.o * .4, le * .16);
      ctx.fill();
    }
    ctx.strokeStyle = KHUNG;
    ctx.lineWidth = 1;
    ctx.strokeRect(g.x0 + .5, py + he + .5, w - 1, g.o - he * 2 - 1);
    for (let x = 1; x < man.rong; x++) {
      ctx.beginPath();
      ctx.moveTo(g.x0 + x * g.o + .5, py + he + 2);
      ctx.lineTo(g.x0 + x * g.o + .5, py + g.o - he - 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#56657a';
    ctx.font = `600 ${Math.round(g.o * .24)}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`${y + 1}`, g.x0 - le * 1.05, py + g.o / 2);

    for (let x = 0; x < man.rong; x++)
      if (laTuong(man, x, y)) {
        ctx.fillStyle = '#19202b';
        oTron(ctx, g.x0 + x * g.o + 2, py + he + 2, g.o - 4, g.o - he * 2 - 4, g.o * .08);
        ctx.fill();
        ctx.strokeStyle = 'rgba(140,165,195,.1)';
        ctx.stroke();
      }
  }

  // xước dọc trên phim
  for (let i = 0; i < 7; i++) {
    const x = g.x0 + nhieu(i * 31, 7, 1.1, 8) * w;
    ctx.strokeStyle = `rgba(230,240,255,${.03 + nhieu(i, 3, 1.1, 9) * .05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, g.y0); ctx.lineTo(x, g.y0 + man.cao * g.o);
    ctx.stroke();
  }
  toiGoc(ctx, W, H, .55);
}

function ve(ctx, man, tt, g, phu) {
  ctx.drawImage(phu.van(man.dong.join('|'), phu.W, phu.H, (c, W, H) => veNen(c, W, H, man, g)), 0, 0);

  for (const [x, y] of man.lay('o')) {
    if (tt.lay.has(`${x},${y}`)) continue;
    const [px, py] = tamO(g, x, y);
    const nhip = .8 + .2 * Math.sin(phu.nay / 460 + x * 1.7 + y);
    const q = ctx.createRadialGradient(px, py, 0, px, py, g.o * .4);
    q.addColorStop(0, `rgba(244,201,93,${.3 * nhip})`); q.addColorStop(1, 'rgba(244,201,93,0)');
    ctx.fillStyle = q;
    ctx.beginPath(); ctx.arc(px, py, g.o * .4, 0, 7); ctx.fill();
    ctx.fillStyle = DAU;
    ctx.beginPath(); ctx.arc(px, py, g.o * .15 * nhip, 0, 7); ctx.fill();
  }

  for (const [x, y] of man.lay('s')) {
    if (tt.daCat.has(`${x},${y}`)) continue;
    const [px, py] = tamO(g, x, y);
    const t = anh(TRANH_NOI);
    if (t) {
      const k = g.o * .92;
      ctx.drawImage(t, px - k / 2, py - k / 2, k, k);
    } else {
      ctx.fillStyle = 'rgba(227,173,87,.85)';
      oTron(ctx, px - g.o * .22, py - g.o * .4, g.o * .44, g.o * .8, g.o * .06);
      ctx.fill();
    }
  }

  const [cx, cy] = man.lay('X')[0];
  const du = tt.lay.size === man.lay('o').length;
  const [dpx, dpy] = tamO(g, cx, cy);
  if (du) {
    const q = ctx.createRadialGradient(dpx, dpy, 0, dpx, dpy, g.o * .7);
    q.addColorStop(0, 'rgba(126,224,168,.3)'); q.addColorStop(1, 'rgba(126,224,168,0)');
    ctx.fillStyle = q;
    ctx.beginPath(); ctx.arc(dpx, dpy, g.o * .7, 0, 7); ctx.fill();
  }
  ctx.strokeStyle = du ? CUA : 'rgba(126,224,168,.3)';
  ctx.lineWidth = Math.max(2, g.o * .08);
  oTron(ctx, dpx - g.o * .26, dpy - g.o * .32, g.o * .52, g.o * .64, g.o * .08);
  ctx.stroke();

  // bản thân cũ — mờ, hơi rung như ảnh phim cũ
  for (const k of tt.ma) {
    const [x, y] = k.split(',').map(Number);
    const [px, py] = tamO(g, x, y);
    const run = Math.sin(phu.nay / 130 + x * 3 + y * 5) * g.o * .012;
    ctx.fillStyle = 'rgba(165,195,225,.3)';
    ctx.beginPath(); ctx.arc(px + run, py, g.o * .21, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(200,225,250,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(px + run, py, g.o * .26, 0, 7); ctx.stroke();
  }

  // người chơi — trượt mượt giữa hai ô
  const tx = phu.truoc ? lerp(phu.truoc.x, tt.x, phu.pm) : tt.x;
  const ty = phu.truoc ? lerp(phu.truoc.y, tt.y, phu.pm) : tt.y;
  const [px, py] = tamO(g, tx, ty);

  // đổi khung hình thì cả dải phim loé lên một nhịp, như máy chiếu sang khung mới
  if (tt.doiKhung) {
    if (!daBan.has(tt)) {
      daBan.add(tt);
      phu.bui.ban(px, py, 10, '#cfe2f5', { toc: 34, song: .4, r: g.o * .03, rot: 10, toa: 0 });
    }
    const loe = kep(1 - (phu.nay - tt.luc) / 220, 0, 1);
    if (loe > 0) {
      ctx.fillStyle = `rgba(226,240,255,${loe * .13})`;
      ctx.fillRect(g.x0, g.y0 + ty * g.o - g.o * .5, man.rong * g.o, g.o * 2);
    }
  }

  const NHIN = { len: [0, -1], xuong: [0, 1], trai: [-1, 0], phai: [1, 0] };
  bongMem(ctx, px, py + g.o * .26, g.o * .3, .42);
  nhanVat(ctx, px, py, g.o * .24, {
    nhin: NHIN[phu.huongCuoi] ?? [0, 1],
    ep: (1 - muot(phu.p)) * .22,
    than: NGUOI, toi: 'rgba(9,11,16,.82)', nay: phu.nay,
  });
}

export default {
  ten: 'Cuộn Phim',
  goi: 'Mỗi hàng là một khoảnh khắc. ← → đi trong không gian, ↑ ↓ đi trong thời gian. Rời một khung là để lại bản thân cũ chắn chỗ đó. Bước lên vết nối phim là cắt bỏ cả khoảnh khắc ấy — mọi bản thân cũ trong hàng đó biến mất, nhưng chỉ cắt được một lần.',
  tyLe: .78,
  mau: { chinh: NGUOI, nen: NEN, phu: DAU },
  batDau, buoc, ve,
  MAN: MAN.thoiGian,
};
