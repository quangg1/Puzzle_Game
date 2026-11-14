// TIA SÉT — một phím điều khiển mọi tia. Chạm ngạnh chữ Y là tách làm đôi.
// Phủ kín các chấu thu, KHÔNG THỪA tia nào, thì xong.
// Thế giới: điện trắng xanh trên nền trời bão.
//
// Bốn thứ trên bàn, chia làm hai loại — người chơi phải đọc ra được ngay:
//   ngạnh Y   tách một tia thành hai, rồi CHÁY        (tiêu hao, dùng một lần)
//   cọc thu lôi nuốt tia chạm vào, tia mất hẳn         (vĩnh viễn)
//   gương     bẻ tia 90°                               (vĩnh viễn)
//   chấu thu  chỗ tia phải đứng lúc kết màn
// Ngạnh làm tia nhiều lên, cọc làm tia ít đi. Thiếu cọc thì lỡ tay chẻ thừa
// một tia là hỏng cả màn mà không có đường gỡ — đó là chỗ game này vốn thiếu.
import { laTuong, tamO, oTron, kep, lerp, muot, nhieu, toiGoc, nhanVat } from '../nen.js';
import { MAN } from '../man.js';

// Gương bẻ tia 90 độ. Hai hướng đặt, vì một hướng thì nó là cái xoay chứ không
// phải gương. 'G' là mặt chéo lên ( / ), 'B' là mặt chéo xuống ( \ ).
const GUONG = {
  G: { phai: 'len', trai: 'xuong', len: 'phai', xuong: 'trai' },
  B: { phai: 'xuong', trai: 'len', len: 'trai', xuong: 'phai' },
};
const doGuong = (man) => {
  const m = new Map();
  for (const c of ['G', 'B']) for (const [x, y] of man.lay(c)) m.set(`${x},${y}`, c);
  return m;
};

const NEN = '#05070c', O = '#0e1520', TUONG = '#1a2331';
const DIEN = '#6ee7ff', TRANG = '#eafcff', CHAU = '#f0a93c', COC = '#7ee08a';

const vuongGoc = (h) => (h === 'trai' || h === 'phai' ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]]);
const BUOC = { len: [0, -1], xuong: [0, 1], trai: [-1, 0], phai: [1, 0] };
const daBan = new WeakSet();

function batDau(man) {
  return {
    tia: man.lay('@').map(([x, y]) => `${x},${y}`),
    nganh: new Set(man.lay('Y').map((p) => p.join(','))),
    luc: 0, noAt: [], hut: [], nhap: [],
  };
}

function buoc(man, tt, huong) {
  if (!tt.tia.length) return null;
  const g = doGuong(man);

  // 1. mỗi tia đi một bước, gặp gương thì bẻ rồi đi tiếp — bẻ được nhiều lần
  const sau = new Map();               // "x,y" -> hướng tia đang chạy
  const nhap = [];
  for (const k of tt.tia) {
    let [x, y] = k.split(',').map(Number);
    let h = huong;
    const [dx, dy] = BUOC[h];
    if (laTuong(man, x + dx, y + dy)) { if (sau.has(k)) nhap.push(k); sau.set(k, h); continue; }
    x += dx; y += dy;
    for (let n = 0; n < 8; n++) {
      const loai = g.get(`${x},${y}`);
      if (!loai) break;
      h = GUONG[loai][h];
      const [ax, ay] = BUOC[h];
      if (laTuong(man, x + ax, y + ay)) break;   // bẻ xong đụng tường thì nằm lại gương
      x += ax; y += ay;
    }
    const nk = `${x},${y}`;
    if (sau.has(nk)) nhap.push(nk);              // hai tia về cùng ô thì nhập làm một
    sau.set(nk, h);
  }

  // 2. chẻ ở ngạnh, theo hướng tia ĐANG chạy chứ không theo phím bấm
  const nganh = new Set(tt.nganh);
  const noAt = [];
  for (const [k, h] of [...sau]) {
    if (!nganh.has(k)) continue;
    const [x, y] = k.split(',').map(Number);
    const ra = vuongGoc(h)
      .map(([ax, ay]) => [x + ax, y + ay])
      .filter(([ax, ay]) => !laTuong(man, ax, ay));
    if (!ra.length) continue;          // bí cả hai bên thì không chẻ
    sau.delete(k);
    nganh.delete(k);                   // ngạnh cháy hết sau một lần
    noAt.push(k);
    for (const [ax, ay] of ra) {
      const nk = `${ax},${ay}`;
      if (sau.has(nk)) nhap.push(nk);
      sau.set(nk, h);
    }
  }

  // 3. cọc thu lôi nuốt tia. Xét SAU khi chẻ, nên một nhánh vừa chẻ ra rơi
  // đúng cọc là mất luôn — thành ra đặt cọc cạnh ngạnh là một cái bẫy thật.
  const coc = new Set(man.lay('T').map((p) => p.join(',')));
  const hut = [];
  for (const k of [...sau.keys()]) if (coc.has(k)) { sau.delete(k); hut.push(k); }

  const tia = [...sau.keys()];
  const yen = tia.slice().sort().join('|') === [...tt.tia].slice().sort().join('|');
  if (yen && !noAt.length && !hut.length && !nhap.length) return null;

  const moi = { tia, nganh, luc: performance.now(), noAt, hut, nhap };
  if (!tia.length)
    return { tt: moi, bao: 'Hết sạch tia. Lùi (Z) hoặc chơi lại (R).', loai: 'ket' };

  const chau = man.lay('X').map((p) => p.join(','));
  const du = chau.every((c) => sau.has(c));
  const thang = du && tia.length === chau.length;
  if (thang) return { tt: moi, thang: true };

  // Phủ kín chấu mà vẫn chưa thắng là lúc người chơi hoang mang nhất — nói
  // thẳng ra còn thừa mấy tia. Các trường hợp khác im lặng: bảng TIA/CHẤU trên
  // đầu đã nói rồi, nhắc thêm mỗi nước thì thành lải nhải.
  if (du)
    return { tt: moi, bao: `Chấu kín rồi, nhưng thừa ${tia.length - chau.length} tia — cho nó vào cọc thu lôi.`, loai: 'ket' };
  return { tt: moi };
}

const toa = (k) => k.split(',').map(Number);

// đường gấp khúc kiểu tia điện, nhiễu đổi ~20 lần/giây cho nó giật giật
function veTia(ctx, x1, y1, x2, y2, bien, hat, rong, mau) {
  const n = 6;
  const diem = [[x1, y1]];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const nx = -(y2 - y1), ny = x2 - x1;
    const d = Math.hypot(nx, ny) || 1;
    const lech = (nhieu(i * 13 + hat, hat, 1.6, 9) - .5) * bien * Math.sin(t * Math.PI);
    diem.push([lerp(x1, x2, t) + (nx / d) * lech, lerp(y1, y2, t) + (ny / d) * lech]);
  }
  diem.push([x2, y2]);

  // Hai lượt: quầng rộng mờ rồi lõi trắng mảnh. Một lượt thì ra sợi dây xanh,
  // hai lượt mới ra tia điện.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [w, m] of [[rong * 2.8, mau], [rong, 'rgba(234,252,255,.9)']]) {
    ctx.strokeStyle = m;
    ctx.lineWidth = w;
    ctx.beginPath();
    diem.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
}

// Trời bão + sàn dẫn điện. Vẽ một lần rồi giữ lại.
function veNen(ctx, W, H, man, g) {
  const im = ctx.createImageData(W, H);
  const d = im.data;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // mây cuộn: hai tầng nhiễu chồng nhau, tầng to làm khối, tầng nhỏ làm thớ
      const may = nhieu(x, y * 1.7, 90, 11) * .72 + nhieu(x, y * 1.5, 26, 12) * .28;
      const cao = 1 - y / H;                     // trời sáng dần lên đỉnh
      const v = may ** 1.5 * 56 * (.3 + cao);
      const i = (y * W + x) * 4;
      d[i] = 6 + v * .62; d[i + 1] = 9 + v * .8; d[i + 2] = 16 + v; d[i + 3] = 255;
    }
  ctx.putImageData(im, 0, 0);

  for (let y = 0; y < man.cao; y++)
    for (let x = 0; x < man.rong; x++) {
      const tuong = laTuong(man, x, y);
      const px = g.x0 + x * g.o, py = g.y0 + y * g.o;
      if (tuong) {
        // VÁCH CÁCH ĐIỆN — khối sứ nổi lên, có bề dày và đinh tán.
        // Phải khác sàn rõ rệt: trước đây hai thứ cùng một sắc đen, người chơi
        // không đọc nổi đâu là chỗ tia đi được. Đó là lỗi chơi, không phải lỗi đẹp.
        ctx.fillStyle = '#05080e';
        oTron(ctx, px + 1.5, py + g.o * .09, g.o - 3, g.o - 3, g.o * .17);
        ctx.fill();
        ctx.fillStyle = TUONG;
        oTron(ctx, px + 1.5, py + 1.5, g.o - 3, g.o - 3, g.o * .17);
        ctx.fill();
        ctx.strokeStyle = 'rgba(150,186,224,.4)';
        ctx.lineWidth = Math.max(1, g.o * .022);
        oTron(ctx, px + 2.5, py + 2.5, g.o - 5, g.o - 5, g.o * .15);
        ctx.stroke();
        ctx.fillStyle = 'rgba(214,232,250,.5)';
        for (const [ax, ay] of [[.24, .24], [.76, .24], [.24, .76], [.76, .76]]) {
          ctx.beginPath();
          ctx.arc(px + g.o * ax, py + g.o * ay, g.o * .042, 0, 7);
          ctx.fill();
        }
      } else {
        // SÀN DẪN ĐIỆN — tấm lõm xuống, viền xanh mảnh. Lõm đối lại khối nổi
        // của vách, nên phân biệt được cả khi nhìn lướt hoặc nhìn ảnh nhỏ.
        ctx.fillStyle = O;
        oTron(ctx, px + 1.5, py + 1.5, g.o - 3, g.o - 3, g.o * .16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(110,231,255,.14)';
        ctx.lineWidth = 1;
        oTron(ctx, px + g.o * .12, py + g.o * .12, g.o * .76, g.o * .76, g.o * .11);
        ctx.stroke();
        ctx.fillStyle = 'rgba(110,231,255,.1)';
        ctx.beginPath();
        ctx.arc(px + g.o * .5, py + g.o * .5, g.o * .035, 0, 7);
        ctx.fill();
      }
    }
  toiGoc(ctx, W, H, .46);
}

// Ngạnh chữ Y. Còn sống thì sáng và khẽ thở; cháy rồi thì để lại gốc cụt đen.
// Giữ lại cái gốc là cố ý: bàn cờ không được phép tự đổi sau lưng người chơi.
function veNganh(ctx, px, py, o, song, nhip) {
  const w = Math.max(2, o * .09);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (song) {
    ctx.strokeStyle = `rgba(110,231,255,${nhip})`;
    ctx.lineWidth = w * 2.6;
    ctx.globalAlpha = .25;
    veNhanhY(ctx, px, py, o);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(190,245,255,${.55 + nhip * .4})`;
    ctx.lineWidth = w;
    veNhanhY(ctx, px, py, o);
  } else {
    ctx.strokeStyle = 'rgba(70,86,104,.5)';
    ctx.lineWidth = w * .8;
    veNhanhY(ctx, px, py, o * .76);
  }
}
function veNhanhY(ctx, px, py, o) {
  ctx.beginPath();
  ctx.moveTo(px, py + o * .26);
  ctx.lineTo(px, py);
  ctx.lineTo(px - o * .24, py - o * .26);
  ctx.moveTo(px, py);
  ctx.lineTo(px + o * .24, py - o * .26);
  ctx.stroke();
}

// Gương: một thanh lăng kính nghiêng, mặt đón sáng trắng, mặt sau tối.
// Vẽ bằng code chứ không bằng tệp — bề dày cho biết nó là vật rắn, không
// phải một nét vẽ, nên người chơi hiểu tia sẽ DỘI chứ không xuyên qua.
function veGuong(ctx, px, py, o, lat) {
  const k = o * .34;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(lat > 0 ? -Math.PI / 4 : Math.PI / 4);
  ctx.fillStyle = 'rgba(14,22,34,.85)';
  oTron(ctx, -k * 1.5, -k * .1, k * 3, k * .62, k * .2); ctx.fill();
  const t = ctx.createLinearGradient(0, -k * .42, 0, k * .2);
  t.addColorStop(0, '#f2fbff');
  t.addColorStop(.5, '#9fd2e8');
  t.addColorStop(1, '#4a7e96');
  ctx.fillStyle = t;
  oTron(ctx, -k * 1.5, -k * .42, k * 3, k * .56, k * .18); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  oTron(ctx, -k * 1.34, -k * .34, k * 2.68, k * .13, k * .06); ctx.fill();
  ctx.restore();
}

// Cọc thu lôi: cắm xuống đất, có vạch cảnh báo. Mũi tên chỉ XUỐNG — hướng
// "đi mất", ngược hẳn với chấu thu hướng vào trong.
function veCoc(ctx, px, py, o, nay) {
  const w = o * .3, h = o * .52;
  ctx.fillStyle = 'rgba(6,12,8,.6)';
  oTron(ctx, px - w, py - h * .55, w * 2, h * 1.5, o * .07); ctx.fill();
  ctx.fillStyle = 'rgba(126,224,138,.16)';
  oTron(ctx, px - w, py - h * .55, w * 2, h * 1.5, o * .07); ctx.fill();
  ctx.strokeStyle = COC;
  ctx.lineWidth = Math.max(1.5, o * .045);
  oTron(ctx, px - w, py - h * .55, w * 2, h * 1.5, o * .07); ctx.stroke();

  // ba vạch chìm dần xuống, chạy theo thời gian — như thứ gì đang bị hút xuống
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const t = ((nay / 900 + i / 3) % 1);
    ctx.globalAlpha = Math.sin(t * Math.PI) * .75;
    ctx.strokeStyle = COC;
    ctx.lineWidth = Math.max(1.5, o * .05);
    const yy = py - h * .3 + t * h * .9;
    ctx.beginPath();
    ctx.moveTo(px - w * .5, yy); ctx.lineTo(px, yy + o * .1); ctx.lineTo(px + w * .5, yy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Chấu thu: vành hở hướng vào trong. Chưa có điện thì hổ phách, có rồi thì
// xanh và sáng lên — nhìn một cái là đếm được còn thiếu mấy chấu.
function veChau(ctx, px, py, o, day, nay) {
  if (day) {
    const q = ctx.createRadialGradient(px, py, 0, px, py, o * .62);
    q.addColorStop(0, 'rgba(110,231,255,.4)');
    q.addColorStop(1, 'rgba(110,231,255,0)');
    ctx.fillStyle = q;
    ctx.beginPath(); ctx.arc(px, py, o * .62, 0, 7); ctx.fill();
  }
  const r = o * .32;
  ctx.strokeStyle = day ? DIEN : CHAU;
  ctx.lineWidth = Math.max(2, o * .075);
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.arc(px, py, r, a + .16, a + Math.PI / 2 - .16);
    ctx.stroke();
  }
  if (!day) {
    const nhip = .4 + .3 * Math.sin(nay / 520 + px * .01);
    ctx.fillStyle = `rgba(240,169,60,${nhip})`;
    ctx.beginPath(); ctx.arc(px, py, o * .09, 0, 7); ctx.fill();
  }
}

function ve(ctx, man, tt, g, phu) {
  ctx.fillStyle = NEN;
  ctx.fillRect(-20, -20, phu.W + 40, phu.H + 40);
  ctx.drawImage(phu.van(man.dong.join('|'), phu.W, phu.H, (c, W, H) => veNen(c, W, H, man, g)), 0, 0);
  const hat = Math.floor(phu.nay / 50);

  for (const [x, y] of man.lay('T')) {
    const [px, py] = tamO(g, x, y);
    veCoc(ctx, px, py, g.o, phu.nay);
  }

  for (const [c, lat] of [['G', 1], ['B', -1]])
    for (const [x, y] of man.lay(c)) {
      const [px, py] = tamO(g, x, y);
      veGuong(ctx, px, py, g.o, lat);
    }

  for (const [x, y] of man.lay('Y')) {
    const [px, py] = tamO(g, x, y);
    const song = tt.nganh.has(`${x},${y}`);
    veNganh(ctx, px, py, g.o, song, .55 + .25 * Math.sin(phu.nay / 420 + x + y));
  }

  const dangCo = new Set(tt.tia);
  const chau = man.lay('X');
  for (const [x, y] of chau) {
    const [px, py] = tamO(g, x, y);
    veChau(ctx, px, py, g.o, dangCo.has(`${x},${y}`), phu.nay);
  }

  // tia: mỗi tia hiện tại phóng ra từ tia cũ GẦN NHẤT — chẻ đôi thì hai con
  // cùng phóng ra từ một mẹ, nhìn đúng như điện tách nhánh.
  const cu = (phu.truoc?.tia ?? []).map(toa);
  const thua = tt.tia.length > chau.length;
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

    if (phu.p < 1 && (gx !== px || gy !== py))
      veTia(ctx, gx, gy, cx, cy, g.o * .3, hat + x * 7 + y, Math.max(1.5, g.o * .045),
        `rgba(110,231,255,${(1 - phu.p) * .7})`);

    // Mascot cưỡi trên đầu tia. Mặt nó là thước đo thứ hai: vui khi đã đậu
    // đúng chấu, lo khi cả bàn đang thừa tia.
    const dau = chau.some(([ax, ay]) => ax === x && ay === y);
    nhanVat(ctx, cx, cy, g.o * .26, {
      nhin: BUOC[phu.huongCuoi] ?? [0, 1],
      ep: (1 - muot(phu.p)) * .26,
      than: TRANG, toi: 'rgba(8,20,32,.85)', vien: DIEN,
      hao: dau ? 'rgba(126,232,255,.62)' : 'rgba(110,231,255,.46)',
      nay: phu.nay, mam: x * 7 + y,
      cam: dau ? 'vui' : thua ? 'lo' : 'thuong',
    });
  }

  // chẻ: chớp trắng + tia lửa bắn ra;  hút: tia lửa rơi xuống đất
  if ((tt.noAt?.length || tt.hut?.length || tt.nhap?.length) && !daBan.has(tt)) {
    daBan.add(tt);
    for (const k of tt.noAt ?? []) {
      const [x, y] = toa(k);
      const [px, py] = tamO(g, x, y);
      phu.bui.ban(px, py, 20, TRANG, { toc: 150, song: .4, r: g.o * .035, rot: 40, toa: 0 });
    }
    for (const k of tt.hut ?? []) {
      const [x, y] = toa(k);
      const [px, py] = tamO(g, x, y);
      phu.bui.ban(px, py, 16, COC, { toc: 54, song: .45, r: g.o * .034, rot: 320, toa: -14 });
    }
    for (const k of tt.nhap ?? []) {
      const [x, y] = toa(k);
      const [px, py] = tamO(g, x, y);
      phu.bui.ban(px, py, 12, DIEN, { toc: 96, song: .3, r: g.o * .03, rot: 0, toa: 0 });
    }
    if (tt.noAt?.length || tt.hut?.length) phu.rung(.8);
  }
  const tn = kep((phu.nay - tt.luc) / 300, 0, 1);
  if (tn < 1) {
    for (const k of tt.noAt ?? []) {
      const [x, y] = toa(k);
      const [px, py] = tamO(g, x, y);
      ctx.strokeStyle = `rgba(234,252,255,${(1 - tn) * .85})`;
      ctx.lineWidth = Math.max(1.5, g.o * .06 * (1 - tn));
      ctx.beginPath(); ctx.arc(px, py, g.o * (.2 + muot(tn) * .9), 0, 7); ctx.stroke();
    }
    // vòng xanh KHÉP LẠI, ngược chiều vòng chẻ loe ra — hai việc trái nhau thì
    // hoạt ảnh cũng phải trái nhau, không thì người chơi nhớ nhầm cái nào ra cái nào
    for (const k of tt.hut ?? []) {
      const [x, y] = toa(k);
      const [px, py] = tamO(g, x, y);
      ctx.strokeStyle = `rgba(126,224,138,${(1 - tn) * .9})`;
      ctx.lineWidth = Math.max(1.5, g.o * .055 * (1 - tn));
      ctx.beginPath(); ctx.arc(px, py, g.o * (1 - muot(tn) * .82), 0, 7); ctx.stroke();
    }
  }

  veHud(ctx, g, tt.tia.length, chau.length);
}

// "TIA 3 / CHẤU 4" — luật thắng đòi đúng bằng nhau, mà trước đây hai con số
// này không hiện ở đâu cả. Người chơi phủ kín chấu rồi vẫn không thắng và
// không hiểu vì sao. Đây là chỗ sửa đáng giá nhất của cả game.
function veHud(ctx, g, soTia, soChau) {
  // Chặn trần: bàn nhỏ thì ô to, bảng tính theo ô sẽ phình ra che mất ô chơi.
  const h = Math.min(Math.max(20, g.o * .4), 32), cx = g.x0 + g.o * .2, cy = g.y0 + g.o * .46;
  ctx.font = `700 ${Math.round(h * .54)}px system-ui, sans-serif`;
  const chu = `TIA ${soTia} / CHẤU ${soChau}`;
  const w = ctx.measureText(chu).width + h * 1.1;
  ctx.fillStyle = 'rgba(5,12,20,.82)';
  oTron(ctx, cx, cy - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = soTia === soChau ? 'rgba(110,231,255,.5)' : 'rgba(240,169,60,.45)';
  ctx.lineWidth = 1.5;
  oTron(ctx, cx, cy - h / 2, w, h, h / 2); ctx.stroke();
  ctx.fillStyle = soTia === soChau ? DIEN : CHAU;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(chu, cx + h * .55, cy + 1);
}

export default {
  ten: 'Tia Sét',
  goi: 'Một phím điều khiển mọi tia cùng lúc. Ngạnh chữ Y tách tia làm đôi rồi cháy rụi. Cọc thu lôi nuốt mất tia chạm vào nó. Gương bẻ tia 90 độ và dùng được mãi. Phủ kín các chấu thu — và không được thừa tia nào.',
  tyLe: .66,
  mau: { chinh: DIEN, nen: NEN, phu: CHAU },
  batDau, buoc, ve,
  MAN: MAN.tachDoi,
};
