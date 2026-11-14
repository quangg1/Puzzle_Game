// Nền chung cho 4 game: đọc màn, dựng canvas, phím, lùi nước, đổi màn,
// VÀ lớp "cảm giác" dùng chung — nội suy chuyển động, hạt bụi, rung, vân nhiễu.
// Mỗi game chỉ phải lo 4 việc: batDau / buoc / ve / MAN.

export const HUONG = { len: [0, -1], xuong: [0, 1], trai: [-1, 0], phai: [1, 0] };
export const TEN_HUONG = ['len', 'xuong', 'trai', 'phai'];

export const kep = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const muot = (t) => (t < .5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
// vọt quá một chút rồi về — thứ làm chuyển động "có sức nặng" thay vì trôi đều
export const bat = (t) => { const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

export const CHUYEN_MS = 150;

// Khoá trạng thái: dùng chung cho bộ giải (scripts/giai.mjs) và cho trang chơi
// dò "đã bí chưa". Bỏ các trường chỉ phục vụ hoạt ảnh — chúng không đổi luật.
const BO_KHOA = new Set(['luc', 'quay', 'vuaNuot', 'noAt', 'hut', 'nhap', 'truoc', 'huong', 'doiKhung', 'vuaCat', 'kieu']);
const ssKhoa = (a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
function chuanKhoa(v) {
  if (v instanceof Set) return [...v].map(chuanKhoa).sort(ssKhoa);
  if (v instanceof Map) return [...v.entries()].map(([k, x]) => [k, chuanKhoa(x)]).sort(ssKhoa);
  if (Array.isArray(v)) return v.map(chuanKhoa).sort(ssKhoa);   // 4 game không phụ thuộc thứ tự mảng
  if (v && typeof v === 'object')
    return Object.keys(v).filter((k) => !BO_KHOA.has(k)).sort().map((k) => [k, chuanKhoa(v[k])]);
  return v;
}
export const khoa = (tt) => JSON.stringify(chuanKhoa(tt));

// Từ trạng thái này còn đường thắng không? true / false / null (quá lớn, chưa biết).
// Có trần nút để không treo trang — màn to thì thà im còn hơn báo sai.
export function conDuongThang(game, man, tt, capNut = 20000) {
  const hang = [tt];
  const daXet = new Set([khoa(tt)]);
  for (let i = 0; i < hang.length; i++)
    for (const h of TEN_HUONG) {
      const kq = game.buoc(man, hang[i], h);
      if (!kq || kq.tt === hang[i]) continue;
      if (kq.thang) return true;
      const k = khoa(kq.tt);
      if (daXet.has(k)) continue;
      if (daXet.size >= capNut) return null;
      daXet.add(k);
      hang.push(kq.tt);
    }
  return false;
}

// có cả trong Node (bộ kiểm import luật game), nên phải dò trước khi gọi
const itDong = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function docMan(dong) {
  const cao = dong.length, rong = Math.max(...dong.map((d) => d.length));
  const tuong = new Set();
  const kyHieu = new Map();            // ký tự -> [[x,y],...]
  for (let y = 0; y < cao; y++)
    for (let x = 0; x < rong; x++) {
      const c = dong[y][x] ?? '#';
      if (c === '#') { tuong.add(`${x},${y}`); continue; }
      if (c === '.') continue;
      if (!kyHieu.has(c)) kyHieu.set(c, []);
      kyHieu.get(c).push([x, y]);
    }
  return { dong, rong, cao, tuong, kyHieu, lay: (c) => kyHieu.get(c) ?? [] };
}

export const laTuong = (man, x, y) =>
  x < 0 || y < 0 || x >= man.rong || y >= man.cao || man.tuong.has(`${x},${y}`);

// ── vẽ dùng chung ───────────────────────────────────────────────────────────
export function khungLuoi(W, H, cot, hang, le = .9) {
  const o = Math.min((W * le) / cot, (H * le) / hang);
  return { o, x0: (W - cot * o) / 2, y0: (H - hang * o) / 2 };
}
export const tamO = (g, x, y) => [g.x0 + x * g.o + g.o / 2, g.y0 + y * g.o + g.o / 2];

export function oTron(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// MỘT hướng sáng cho cả trang. Thiếu nó thì mỗi vật tự sáng một kiểu và
// cả bàn cờ trông như hình dán phẳng.
export const SANG = { x: -.42, y: -.62 };

// Khối có bề dày: mặt bên tối ở dưới, mặt trên sáng, một vệt gờ phía đón sáng.
// Đây là thứ biến "hình vuông" thành "vật thể".
export function khoi(ctx, px, py, w, h, day, tren, canh, r = 4) {
  oTron(ctx, px - SANG.x * day * .5, py + day, w, h, r);
  ctx.fillStyle = canh;
  ctx.fill();
  oTron(ctx, px, py, w, h, r);
  ctx.fillStyle = tren;
  ctx.fill();
  ctx.save();
  oTron(ctx, px, py, w, h, r);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.17)';
  ctx.fillRect(px, py, w, Math.max(1, h * .17));
  ctx.fillStyle = 'rgba(0,0,0,.14)';
  ctx.fillRect(px, py + h * .78, w, h * .22);
  ctx.restore();
}

// ── MASCOT CHUNG CHO CẢ BỐN GAME ────────────────────────────────────────────
// MỘT sinh vật, bốn thế giới. Nhận ra nó nhờ ba thứ, xếp theo đúng thứ tự quan
// trọng:
//   chỏm trên đầu — cái BÓNG. Bỏ chỏm đi thì nó về làm một chấm tròn như mọi
//                   game lưới khác, và bốn game không còn cảm giác cùng một bộ.
//   hai con mắt   — sự sống. Nhìn theo hướng vừa đi, biết nháy.
//   đôi lông mày  — cảm xúc. Hai nét thôi, nhưng là thứ nói cho người chơi biết
//                   nó đang gắng, đang lo hay vừa thắng, mà không cần một chữ nào.
//
// cam : 'thuong' | 'gang' | 'lo' | 'vui'   chỉ đổi lông mày (và miệng khi vui)
// vien: màu viền sáng — BẮT BUỘC trên nền tối, không có thì thân chìm vào nền
// hao : màu quầng sáng quanh thân, cho thế giới điện
// chom: tắt khi nhân vật nằm trong chỗ chật (trong hố, dưới trần thấp)
const MAU_DO = [0, 1];
export function nhanVat(ctx, x, y, r, {
  nhin = MAU_DO, ep = 0, than = '#f2f7fd', toi = 'rgba(10,12,18,.82)',
  nay = 0, mam = 0, cam = 'thuong', vien = null, hao = null, chom = true,
} = {}) {
  const [nx, ny] = nhin;
  const d = Math.hypot(nx, ny) || 1;
  const lx = (nx / d), ly = (ny / d);

  ctx.save();
  ctx.translate(x, y + r * ep * .55);
  ctx.scale(1 + ep * .3, 1 - ep * .3);

  if (hao) {
    const q = ctx.createRadialGradient(0, 0, r * .3, 0, 0, r * 2.2);
    q.addColorStop(0, hao);
    q.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = q;
    ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, 7); ctx.fill();
  }

  // Chỏm ngả NGƯỢC chiều đang đi — như tóc bị gió thổi khi chạy. Nhờ nó mà
  // nhìn cái bóng là biết nhân vật vừa đi hướng nào, chưa cần nhìn tới mắt.
  if (chom) {
    const gx = -lx * r * .66, gy = -ly * r * .38;
    ctx.fillStyle = than;
    ctx.beginPath();
    ctx.moveTo(-r * .34, -r * .64);
    ctx.quadraticCurveTo(-r * .22 + gx * .55, -r * 1.2 + gy * .8, gx, -r * 1.52 + gy);
    ctx.quadraticCurveTo(r * .26 + gx * .45, -r * 1.06 + gy * .8, r * .34, -r * .64);
    ctx.closePath();
    ctx.fill();
    if (vien) {
      ctx.strokeStyle = vien;
      ctx.lineWidth = Math.max(1, r * .08);
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  ctx.fillStyle = than;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  // tô bóng phía khuất sáng cho thân có độ cong
  const t = ctx.createRadialGradient(SANG.x * r * .8, SANG.y * r * .8, r * .12, 0, 0, r * 1.12);
  t.addColorStop(0, 'rgba(255,255,255,.3)');
  t.addColorStop(.62, 'rgba(255,255,255,0)');
  t.addColorStop(1, 'rgba(0,0,0,.26)');
  ctx.fillStyle = t;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  if (vien) {
    ctx.strokeStyle = vien;
    ctx.lineWidth = Math.max(1, r * .09);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
  }

  // nháy mắt: ~90ms mỗi ~3.4s, lệch pha theo mầm để nhiều nhân vật không nháy cùng lúc
  const chu = 3400 + (mam % 7) * 260;
  const nhay = ((nay + mam * 719) % chu) < 95;
  const cachMat = r * .36, caoMat = r * .1;
  const txm = lx * r * .3, tym = ly * r * .3 - caoMat;     // tâm giữa hai mắt
  for (const ben of [-1, 1]) {
    const mx = txm - ly * cachMat * ben;
    const my = tym + lx * cachMat * ben;
    if (nhay) {
      ctx.strokeStyle = toi;
      ctx.lineWidth = Math.max(1.2, r * .11);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mx - r * .17, my); ctx.lineTo(mx + r * .17, my);
      ctx.stroke();
    } else {
      ctx.fillStyle = toi;
      ctx.beginPath(); ctx.ellipse(mx, my, r * .17, r * .21, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath(); ctx.arc(mx - r * .055, my - r * .07, r * .055, 0, 7); ctx.fill();
    }
    if (cam !== 'thuong') veMay(ctx, mx, my, txm, tym, r, cam, toi);
  }
  if (cam === 'vui' && !nhay) {
    ctx.strokeStyle = toi;
    ctx.lineWidth = Math.max(1.1, r * .08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(txm, tym + r * .3, r * .2, .25 * Math.PI, .75 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

// "Phía trong" tính bằng hướng từ con mắt về tâm giữa hai mắt, nên lông mày
// nghiêng đúng kể cả khi nhân vật quay sang ngang hay nhìn lên.
function veMay(ctx, mx, my, txm, tym, r, cam, toi) {
  let ix = txm - mx, iy = tym - my;
  const d = Math.hypot(ix, iy) || 1;
  ix /= d; iy /= d;
  const tren = cam === 'vui' ? -r * .54 : -r * .42;
  const nghieng = cam === 'gang' ? r * .15 : cam === 'lo' ? -r * .15 : 0;
  const dai = r * .25;
  ctx.strokeStyle = toi;
  ctx.lineWidth = Math.max(1.1, r * .085);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(mx + ix * dai, my + tren + nghieng);
  ctx.lineTo(mx - ix * dai, my + tren - nghieng);
  ctx.stroke();
}

// Kho ảnh sprite. Trả null khi chưa tải xong để game vẽ bản dự phòng bằng code —
// không bao giờ có khoảng trống, và chạy được cả khi thiếu tệp ảnh.
// Chỉ gọi trong ve(); Node (bộ kiểm) không có Image và cũng không bao giờ vẽ.
const khoAnh = new Map();
export function anh(duong) {
  if (!khoAnh.has(duong)) {
    const i = new Image();
    i.src = duong;
    khoAnh.set(duong, i);
  }
  const i = khoAnh.get(duong);
  return i.complete && i.naturalWidth ? i : null;
}

// bóng đổ mềm — thứ duy nhất tạo được cảm giác vật nằm TRÊN mặt sàn
export function bongMem(ctx, x, y, r, dam = .34) {
  const t = ctx.createRadialGradient(x, y, 0, x, y, r);
  t.addColorStop(0, `rgba(0,0,0,${dam})`);
  t.addColorStop(.6, `rgba(0,0,0,${dam * .45})`);
  t.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = t;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * .42, 0, 0, 7);
  ctx.fill();
}

export function toiGoc(ctx, W, H, dam = .5) {
  const t = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .72);
  t.addColorStop(0, 'rgba(0,0,0,0)');
  t.addColorStop(1, `rgba(0,0,0,${dam})`);
  ctx.fillStyle = t;
  ctx.fillRect(0, 0, W, H);
}

// ── vân nhiễu sinh bằng code, không tải tệp ảnh nào ─────────────────────────
const bam = (x, y, s) => {
  let n = (x * 374761393 + y * 668265263 + s * 1442695040) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
export function nhieu(x, y, oLuoi, s = 1) {
  const gx = Math.floor(x / oLuoi), gy = Math.floor(y / oLuoi);
  const fx = x / oLuoi - gx, fy = y / oLuoi - gy;
  const mx = fx * fx * (3 - 2 * fx), my = fy * fy * (3 - 2 * fy);
  const t = (a, b) => a + (b - a) * mx;
  const tren = t(bam(gx, gy, s), bam(gx + 1, gy, s));
  const duoi = t(bam(gx, gy + 1, s), bam(gx + 1, gy + 1, s));
  return tren + (duoi - tren) * my;
}

// Vẽ nền tốn kém thì làm một lần rồi giữ lại, khoá theo kích thước + màn.
export function khoVan() {
  const kho = new Map();
  return (khoa, W, H, veNen) => {
    const k = `${khoa}|${W}x${H}`;
    if (!kho.has(k)) {
      kho.clear();                       // chỉ giữ bản mới nhất, khỏi phình bộ nhớ
      const c = new OffscreenCanvas(Math.max(1, W | 0), Math.max(1, H | 0));
      veNen(c.getContext('2d'), c.width, c.height);
      kho.set(k, c);
    }
    return kho.get(k);
  };
}

// ── hạt bụi ─────────────────────────────────────────────────────────────────
function taoBui() {
  let hat = [];
  return {
    ban(x, y, so, mau, { toc = 60, song = .55, r = 3, rot = 150, toa = 7 } = {}) {
      for (let i = 0; i < so; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = toc * (.4 + Math.random() * .9);
        hat.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - toa,
          t: 0, song: song * (.6 + Math.random() * .8),
          r: r * (.5 + Math.random()), mau, rot,
        });
      }
      if (hat.length > 400) hat = hat.slice(-400);
    },
    chay(ctx, dt) {
      for (const h of hat) {
        h.t += dt;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.vy += h.rot * dt;
        h.vx *= 1 - 2.2 * dt;
      }
      hat = hat.filter((h) => h.t < h.song);
      for (const h of hat) {
        ctx.globalAlpha = kep(1 - h.t / h.song, 0, 1) ** .7;
        ctx.fillStyle = h.mau;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r * (1 - h.t / h.song * .5), 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    xoa() { hat = []; },
  };
}

// ── vòng chạy ───────────────────────────────────────────────────────────────
// game = { ten, goi, mau, MAN, batDau(man), buoc(man,tt,huong)->{tt,thang}|null,
//          ve(ctx, man, tt, g, phu), tyLe? }
// phu = { W, H, nay, truoc, p, bui, rung(manh), van(khoa, veNen) }
export function chay(hop, game) {
  const khung = hop.querySelector('canvas');
  const ctx = khung.getContext('2d');
  const elTen = hop.querySelector('[data-ten]');
  const elSo = hop.querySelector('[data-so]');
  const elBao = hop.querySelector('[data-bao]');

  let soMan = 0, man, tt, lichSu = [], xong = false, tl = 1;
  let truoc = null, batDauChuyen = -1e9, lanTruoc = performance.now();
  let huongCuoi = 'xuong', lucMoMan = performance.now();
  let rungLuc = -1e9, rungManh = 0;
  const bui = taoBui();
  const van = khoVan();

  function moMan(n) {
    soMan = (n + game.MAN.length) % game.MAN.length;
    man = docMan(game.MAN[soMan].o);
    tt = game.batDau(man);
    lichSu = [];
    xong = false;
    truoc = null;
    huongCuoi = 'xuong';
    lucMoMan = performance.now();
    bui.xoa();
    bao('');
    doCo();
  }

  function bao(chu, loai = '') {
    elBao.textContent = chu;
    elBao.className = `bao ${loai}`;
  }

  function doCo() {
    const r = khung.getBoundingClientRect();
    if (!r.width) return;
    tl = devicePixelRatio || 1;
    // chặn chiều cao theo cửa sổ: game vuông mà để nguyên tỉ lệ thì tràn màn hình
    const cao = Math.min(r.width * (game.tyLe ?? .78), Math.max(240, innerHeight - 330));
    khung.width = Math.round(r.width * tl);
    khung.height = Math.round(cao * tl);
    khung.style.height = `${Math.round(cao)}px`;
    ve();
  }

  const rung = (manh = 1) => { rungLuc = performance.now(); rungManh = manh; };

  function ve(nay = performance.now()) {
    const W = khung.width / tl, H = khung.height / tl;
    if (!W || !H) return;
    const dt = kep((nay - lanTruoc) / 1000, 0, .05);
    lanTruoc = nay;

    ctx.setTransform(tl, 0, 0, tl, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // rung màn khi có va chạm — nhẹ thôi, đủ thấy mà không chóng mặt
    const rt = kep((nay - rungLuc) / 260, 0, 1);
    if (rt < 1 && !itDong) {
      const m = (1 - rt) ** 2 * rungManh * 4.5;
      ctx.translate(Math.sin(nay / 11) * m, Math.cos(nay / 9) * m);
    }

    const g = khungLuoi(W, H, man.rong, man.cao, .88);
    const p = itDong ? 1 : kep((nay - batDauChuyen) / CHUYEN_MS, 0, 1);
    game.ve(ctx, man, tt, g, {
      W, H, g,
      nay: itDong ? nay + 1e6 : nay,
      truoc, p, pm: bat(p), bui, rung, van,
      huongCuoi,                                   // để nhân vật nhìn theo hướng vừa đi
      vaoMan: itDong ? 1 : kep((nay - lucMoMan) / 680, 0, 1),   // vật nhập cuộc khi mở màn
    });
    bui.chay(ctx, itDong ? 0 : dt);
    ctx.setTransform(tl, 0, 0, tl, 0, 0);
    if (elSo) elSo.textContent = `màn ${soMan + 1}/${game.MAN.length}`;
  }

  // Hoạt ảnh CHỈ để nhìn — trạng thái đã xong trước khi nó chạy, nên rAF có
  // ngừng (tab nền) cũng không bao giờ chặn được thao tác.
  function vongVe(nay) {
    if (hop.classList.contains('dang-choi') && man) ve(nay);
    requestAnimationFrame(vongVe);
  }
  requestAnimationFrame(vongVe);

  function chuyen(tuTT) { truoc = tuTT; batDauChuyen = performance.now(); }

  function di(huong) {
    if (xong) { moMan(soMan + 1); return; }
    const kq = game.buoc(man, tt, huong);
    if (!kq) return;
    if (kq.tt === tt) { bao(kq.bao ?? '', kq.loai ?? ''); rung(.5); doBi(); ve(); return; }
    lichSu.push(tt);
    huongCuoi = huong;
    chuyen(tt);
    tt = kq.tt;
    bao(kq.bao ?? '', kq.loai ?? '');
    if (kq.thang) {
      xong = true;
      bao(soMan + 1 < game.MAN.length ? 'Qua màn — bấm phím bất kỳ' : 'Hết màn — bấm phím bất kỳ', 'thang');
    } else doBi();
    ve();
  }

  // Dò sau khi vẽ xong nước vừa đi, để phím không bị khựng. Trạng thái đã đổi
  // trong lúc chờ thì bỏ — kết quả cũ không còn đúng.
  function doBi() {
    const dang = tt;
    setTimeout(() => {
      if (tt !== dang || xong) return;
      if (conDuongThang(game, man, dang) === false)
        bao('Bí rồi: không còn đường thắng. Lùi (Z) hoặc chơi lại (R).', 'ket');
    }, 0);
  }

  function lui() {
    if (!lichSu.length || xong) return;
    chuyen(tt);
    tt = lichSu.pop();
    bao('');
    doBi();
    ve();
  }

  const PHIM = {
    ArrowUp: 'len', ArrowDown: 'xuong', ArrowLeft: 'trai', ArrowRight: 'phai',
    w: 'len', s: 'xuong', a: 'trai', d: 'phai',
  };

  function phim(e) {
    if (!hop.classList.contains('dang-choi')) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const h = PHIM[k];
    if (h) { e.preventDefault(); di(h); return; }
    if (k === 'z' || k === 'u') lui();
    else if (k === 'r') moMan(soMan);
    else if (k === 'n') moMan(soMan + 1);
    else if (k === 'p') moMan(soMan - 1);
    else if (xong) moMan(soMan + 1);
  }
  addEventListener('keydown', phim);

  let cham = null;
  khung.addEventListener('pointerdown', (e) => { cham = [e.clientX, e.clientY]; });
  khung.addEventListener('pointerup', (e) => {
    if (xong) { moMan(soMan + 1); cham = null; return; }
    if (!cham) return;
    const dx = e.clientX - cham[0], dy = e.clientY - cham[1];
    cham = null;
    if (Math.hypot(dx, dy) < 22) return;
    di(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'phai' : 'trai') : dy > 0 ? 'xuong' : 'len');
  });

  for (const nut of hop.querySelectorAll('[data-lam]')) {
    nut.addEventListener('click', () => {
      const v = nut.dataset.lam;
      if (v === 'lui') lui();
      else if (v === 'lai') moMan(soMan);
      else if (v === 'sau') moMan(soMan + 1);
      else if (v === 'truoc') moMan(soMan - 1);
    });
  }

  if (elTen) elTen.textContent = game.ten;
  new ResizeObserver(doCo).observe(khung);
  moMan(0);
  return { moMan, doCo };
}
