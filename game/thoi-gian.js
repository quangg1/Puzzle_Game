// CUỘN PHIM — mỗi HÀNG là một khung hình, tức một khoảnh khắc.
// Trái/phải: đi trong không gian. Lên/xuống: đi trong thời gian.
// Rời một khung thì để lại bản thân cũ đứng đó, và nó chắn đường bạn.
//
// Cả game đứng trên một câu: "bản thân cũ" phải nhìn RA là bản thân cũ. Trước
// đây nó là một chấm xanh mờ, nên luật đọc thành "có vật cản tự mọc ra" chứ
// không phải "mình lúc trước đang đứng đó". Giờ nó là chính mascot, mờ đi và
// rung như ảnh phim cũ — thấy mặt mình là hiểu ngay mình vừa làm gì.
import { laTuong, tamO, oTron, kep, lerp, muot, nhieu, bongMem, toiGoc, nhanVat } from '../nen.js';
import { MAN } from '../man.js';

const NEN = '#090b10', KHUNG = '#2d3845';
const NGUOI = '#f2f7fd', DAU = '#f4c95d', CUA = '#7ee0a8', NOI = '#e3ad57';

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
  const duVat = lay.size === man.lay('o').length;
  const moi = { x: nx, y: ny, ma, lay, daCat, luc: performance.now(), doiKhung: dy !== 0, vuaCat };
  if (nx === cua[0] && ny === cua[1]) {
    if (duVat) return { tt: moi, thang: true };
    // Tới cửa mà chưa đủ đồ là lúc người chơi tưởng mình xong rồi. Nói thẳng
    // còn thiếu mấy món, thay vì để cửa im lặng không mở.
    return { tt: moi, bao: `Cửa chưa mở: còn thiếu ${man.lay('o').length - lay.size} món.`, loai: 'ket' };
  }
  return { tt: moi };
}

// Dải phim vẽ một lần rồi giữ lại: thớ nhũ tương, bụi, xước dọc, lỗ răng phim.
function veNen(ctx, W, H, man, g) {
  const le = g.o * .38;
  ctx.fillStyle = NEN;
  ctx.fillRect(0, 0, W, H);

  const w = man.rong * g.o;
  const im = ctx.createImageData(W, H);
  const d = im.data;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const trongPhim = x > g.x0 - le && x < g.x0 + w + le && y > g.y0 && y < g.y0 + man.cao * g.o;
      const hang = Math.floor((y - g.y0) / g.o);
      const he = (y - g.y0 - hang * g.o) / g.o;
      const khe = he < .07 || he > .93;            // vạch đen giữa các khung
      let v;
      // Nhũ tương phải SÁNG hơn hẳn vạch đen và hơn tường, nếu không cả dải
      // phim thành một mảng tối đều và người chơi không đọc ra ô nào đi được.
      if (!trongPhim) v = 9 + nhieu(x, y, 2, 1) * 5;
      else if (khe) v = 5 + nhieu(x, y, 2, 2) * 3;
      else v = 47 + nhieu(x, y, 1.6, 3) * 20 + nhieu(x, y, 30, 4) * 12;
      d[i] = v; d[i + 1] = v + 3; d[i + 2] = v + 8; d[i + 3] = 255;
    }
  ctx.putImageData(im, 0, 0);

  // Mép phim hai bên: dải sẫm chạy dọc, trên đó đục lỗ răng. Phải vẽ dải nền
  // trước thì lỗ mới ra lỗ — không có dải, mấy ô đen lơ lửng trông như vết bẩn.
  for (const [lx, rong] of [[g.x0 - le, le], [g.x0 + w, le]]) {
    ctx.fillStyle = '#151a22';
    ctx.fillRect(lx, g.y0, rong, man.cao * g.o);
    ctx.strokeStyle = 'rgba(150,175,205,.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx + (rong > 0 ? rong : 0) - .5, g.y0);
    ctx.lineTo(lx + (rong > 0 ? rong : 0) - .5, g.y0 + man.cao * g.o);
    ctx.stroke();
  }

  for (let y = 0; y < man.cao; y++) {
    const py = g.y0 + y * g.o, he = g.o * .07;
    // hai lỗ răng mỗi khung, mỗi bên — đủ để nói "đây là phim" mà không rối
    ctx.fillStyle = '#04060a';
    for (const lx of [g.x0 - le * .72, g.x0 + w + le * .22])
      for (const k of [.24, .62]) {
        oTron(ctx, lx, py + g.o * k, le * .5, g.o * .16, le * .14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(170,195,225,.16)';
        ctx.lineWidth = 1;
        ctx.stroke();
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

    // Số khung hình, in trên chính dải mép phim dưới hai lỗ răng — đây là thứ
    // nói "hàng = khoảnh khắc". Để ngoài mép thì tràn khỏi canvas và bị cắt.
    ctx.fillStyle = '#7d8ea6';
    ctx.font = `600 ${Math.round(g.o * .17)}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${y + 1}`, g.x0 - le * .47, py + g.o * .88);

    // Tường = mảng tối trong khung hình. Tối hơn nhũ tương đủ để đọc ra ngay,
    // nhưng KHÔNG đen đặc: đen đặc thì mắt đọc nó thành vật thể chính và cả
    // bàn trông như bị thủng, trong khi thứ đáng nhìn phải là chỗ đi được.
    for (let x = 0; x < man.rong; x++)
      if (laTuong(man, x, y)) {
        const px = g.x0 + x * g.o;
        ctx.fillStyle = '#10151d';
        oTron(ctx, px + 2, py + he + 2, g.o - 4, g.o - he * 2 - 4, g.o * .08);
        ctx.fill();
        ctx.strokeStyle = 'rgba(150,175,205,.13)';
        ctx.lineWidth = 1;
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
  toiGoc(ctx, W, H, .4);
}

// Vết nối phim: băng dán chéo qua khung, có răng cưa hai mép. Cắt rồi thì
// thành mối nối đã dùng — xám, không còn ánh. Giữ lại cái xác là cố ý: bàn
// cờ không được phép tự đổi sau lưng người chơi.
function veVetNoi(ctx, px, py, o, con, nay) {
  const w = o * .54, h = o * .78;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-.22);
  ctx.fillStyle = con ? 'rgba(227,173,87,.9)' : 'rgba(96,104,118,.5)';
  oTron(ctx, -w / 2, -h / 2, w, h, o * .05);
  ctx.fill();
  ctx.strokeStyle = con ? 'rgba(255,228,170,.8)' : 'rgba(130,140,155,.45)';
  ctx.lineWidth = Math.max(1, o * .022);
  ctx.stroke();
  // răng cưa: hai hàng vạch ngang, dấu hiệu của mối dán phim
  ctx.strokeStyle = con ? 'rgba(90,58,20,.55)' : 'rgba(40,46,56,.5)';
  for (const sy of [-h * .3, h * .3]) {
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const x = -w / 2 + (w * i) / 6;
      i ? ctx.lineTo(x, sy + (i % 2 ? o * .035 : 0)) : ctx.moveTo(x, sy);
    }
    ctx.stroke();
  }
  if (con) {
    const nhip = .25 + .2 * Math.sin(nay / 500 + px * .01);
    ctx.fillStyle = `rgba(255,236,190,${nhip})`;
    oTron(ctx, -w / 2, -h / 2, w, h * .3, o * .05);
    ctx.fill();
  }
  ctx.restore();
}

function ve(ctx, man, tt, g, phu) {
  ctx.drawImage(phu.van(man.dong.join('|'), phu.W, phu.H, (c, W, H) => veNen(c, W, H, man, g)), 0, 0);

  const tx = phu.truoc ? lerp(phu.truoc.x, tt.x, phu.pm) : tt.x;
  const ty = phu.truoc ? lerp(phu.truoc.y, tt.y, phu.pm) : tt.y;
  const w = man.rong * g.o;

  // KHUNG ĐANG CHIẾU. Cả game đứng trên ý "mỗi hàng là một khoảnh khắc", mà
  // trước đây mọi hàng sáng như nhau nên ý đó không hiện ra ở đâu. Giờ hàng
  // đang đứng được đèn máy chiếu rọi vào, các hàng khác chìm bớt.
  ctx.fillStyle = 'rgba(4,6,11,.2)';
  ctx.fillRect(g.x0 - g.o, g.y0, w + g.o * 2, man.cao * g.o);
  const dy0 = g.y0 + ty * g.o;
  const den = ctx.createLinearGradient(0, dy0, 0, dy0 + g.o);
  den.addColorStop(0, 'rgba(255,240,205,0)');
  den.addColorStop(.5, 'rgba(255,240,205,.11)');
  den.addColorStop(1, 'rgba(255,240,205,0)');
  ctx.fillStyle = den;
  ctx.fillRect(g.x0 - g.o * .4, dy0, w + g.o * .8, g.o);
  ctx.strokeStyle = 'rgba(255,238,200,.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(g.x0 + .5, dy0 + g.o * .07 + .5, w - 1, g.o * .86);

  for (const [x, y] of man.lay('o')) {
    if (tt.lay.has(`${x},${y}`)) continue;
    const [px, py] = tamO(g, x, y);
    const nhip = .8 + .2 * Math.sin(phu.nay / 460 + x * 1.7 + y);
    const q = ctx.createRadialGradient(px, py, 0, px, py, g.o * .42);
    q.addColorStop(0, `rgba(244,201,93,${.34 * nhip})`); q.addColorStop(1, 'rgba(244,201,93,0)');
    ctx.fillStyle = q;
    ctx.beginPath(); ctx.arc(px, py, g.o * .42, 0, 7); ctx.fill();
    // ô phim nhỏ: vật cần nhặt cũng là một mẩu phim, không phải cái chấm vô danh
    ctx.fillStyle = DAU;
    oTron(ctx, px - g.o * .15, py - g.o * .12 * nhip, g.o * .3, g.o * .24 * nhip, g.o * .04);
    ctx.fill();
    ctx.fillStyle = 'rgba(70,48,10,.55)';
    for (const k of [-.09, .02]) ctx.fillRect(px - g.o * .11, py + g.o * k, g.o * .22, g.o * .025);
  }

  for (const [x, y] of man.lay('s')) {
    const [px, py] = tamO(g, x, y);
    veVetNoi(ctx, px, py, g.o, !tt.daCat.has(`${x},${y}`), phu.nay);
  }

  // cửa ra — chỉ mở khi đã đủ đồ, và phải nhìn là biết mở hay chưa
  const [cx, cy] = man.lay('X')[0];
  const du = tt.lay.size === man.lay('o').length;
  const [dpx, dpy] = tamO(g, cx, cy);
  if (du) {
    const q = ctx.createRadialGradient(dpx, dpy, 0, dpx, dpy, g.o * .75);
    q.addColorStop(0, 'rgba(126,224,168,.38)'); q.addColorStop(1, 'rgba(126,224,168,0)');
    ctx.fillStyle = q;
    ctx.beginPath(); ctx.arc(dpx, dpy, g.o * .75, 0, 7); ctx.fill();
  }
  ctx.fillStyle = du ? 'rgba(126,224,168,.2)' : 'rgba(126,224,168,.05)';
  oTron(ctx, dpx - g.o * .28, dpy - g.o * .34, g.o * .56, g.o * .68, g.o * .09);
  ctx.fill();
  ctx.strokeStyle = du ? CUA : 'rgba(126,224,168,.3)';
  ctx.lineWidth = Math.max(2, g.o * .075);
  oTron(ctx, dpx - g.o * .28, dpy - g.o * .34, g.o * .56, g.o * .68, g.o * .09);
  ctx.stroke();
  if (du) {
    // cửa mở thì có khe sáng ở giữa
    const k = .5 + .5 * Math.sin(phu.nay / 380);
    ctx.fillStyle = `rgba(214,255,232,${.3 + k * .35})`;
    ctx.fillRect(dpx - g.o * .035, dpy - g.o * .24, g.o * .07, g.o * .48);
  }

  // BẢN THÂN CŨ — chính mascot, mờ đi và rung như ảnh phim cũ.
  for (const k of tt.ma) {
    const [x, y] = k.split(',').map(Number);
    const [px, py] = tamO(g, x, y);
    const run = Math.sin(phu.nay / 130 + x * 3 + y * 5) * g.o * .014;
    ctx.save();
    ctx.globalAlpha = .34;
    nhanVat(ctx, px + run, py, g.o * .23, {
      nhin: [0, 1], than: '#9fc2e6', toi: 'rgba(20,30,46,.6)',
      nay: phu.nay, mam: x * 5 + y * 11, cam: 'lo',
    });
    ctx.restore();
    ctx.strokeStyle = 'rgba(190,220,250,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(px + run, py, g.o * .3, 0, 7); ctx.stroke();
  }

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
      ctx.fillRect(g.x0, g.y0 + ty * g.o - g.o * .5, w, g.o * 2);
    }
  }
  // cắt phim: cả hàng rung lên rồi khép lại
  if (tt.vuaCat) {
    const t = kep((phu.nay - tt.luc) / 420, 0, 1);
    if (t < 1) {
      ctx.strokeStyle = `rgba(255,228,170,${(1 - t) * .8})`;
      ctx.lineWidth = Math.max(1.5, g.o * .05 * (1 - t));
      ctx.strokeRect(g.x0, g.y0 + ty * g.o + g.o * .07, w, g.o * .86);
    }
  }

  bongMem(ctx, px, py + g.o * .28, g.o * .3, .42);
  nhanVat(ctx, px, py, g.o * .25, {
    nhin: BUOC[phu.huongCuoi] ?? [0, 1],
    ep: (1 - muot(phu.p)) * .22,
    than: NGUOI, toi: 'rgba(9,11,16,.82)', nay: phu.nay,
    cam: du ? 'vui' : tt.ma.size >= 3 ? 'gang' : 'thuong',
  });

  veHud(ctx, g, tt.lay.size, man.lay('o').length, tt.ma.size);
}

// "ĐÃ LẤY 2/4 · 3 BÓNG" — cửa chỉ mở khi đủ đồ, mà trước đây không chỗ nào
// nói còn thiếu mấy món. Số bóng ma đi kèm vì nó là thứ người chơi tự tạo ra
// và hay quên mình đã tạo bao nhiêu.
function veHud(ctx, g, daLay, tong, soMa) {
  // Đặt trong hàng tường trên cùng — mọi màn đều có một hàng tường ở đó, nên
  // bảng không bao giờ che mất ô chơi được. Phía trên dải phim không đủ chỗ.
  const h = Math.max(19, g.o * .34), cx = g.x0 + g.o * .12, cy = g.y0 + g.o * .5;
  const chu = `ĐÃ LẤY ${daLay}/${tong}${soMa ? ` · ${soMa} BÓNG` : ''}`;
  ctx.font = `700 ${Math.round(h * .54)}px system-ui, sans-serif`;
  const w = ctx.measureText(chu).width + h * 1.1;
  ctx.fillStyle = 'rgba(9,11,16,.85)';
  oTron(ctx, cx, cy - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = daLay === tong ? 'rgba(126,224,168,.5)' : 'rgba(244,201,93,.4)';
  ctx.lineWidth = 1.5;
  oTron(ctx, cx, cy - h / 2, w, h, h / 2); ctx.stroke();
  ctx.fillStyle = daLay === tong ? CUA : DAU;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(chu, cx + h * .55, cy + 1);
}

export default {
  ten: 'Cuộn Phim',
  goi: 'Mỗi hàng là một khoảnh khắc. ← → đi trong không gian, ↑ ↓ đi trong thời gian. Rời một khung là để lại bản thân cũ chắn chỗ đó. Bước lên vết nối phim là cắt bỏ cả khoảnh khắc ấy — mọi bản thân cũ trong hàng đó biến mất, nhưng mỗi vết nối chỉ cắt được một lần. Nhặt đủ đồ rồi mới ra được cửa.',
  tyLe: .78,
  mau: { chinh: NGUOI, nen: NEN, phu: DAU },
  batDau, buoc, ve,
  MAN: MAN.thoiGian,
};
