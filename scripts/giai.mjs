// Bộ giải chung cho mọi cơ chế: chỉ cần game có batDau() và buoc().
// Dùng chính hàm của game nên không thể lệch luật giữa bộ kiểm và trang chơi.
export const TEN_HUONG = ['len', 'xuong', 'trai', 'phai'];

// Khoá trạng thái nằm ở nen.js để trang chơi (dò "đã bí") và bộ giải dùng CÙNG một hàm.
import { khoa } from '../nen.js';
export { khoa };

export function giai(game, man, capNut = 600000) {
  const dau = game.batDau(man);
  const hang = [[dau, []]];
  const daXet = new Set([khoa(dau)]);
  let i = 0;
  while (i < hang.length) {
    const [tt, duong] = hang[i++];
    for (const h of TEN_HUONG) {
      const kq = game.buoc(man, tt, h);
      if (!kq) continue;
      if (kq.thang) return { duong: [...duong, h], nut: daXet.size };
      const k = khoa(kq.tt);
      if (daXet.has(k)) continue;
      if (daXet.size >= capNut) return { qua: true, nut: daXet.size };
      daXet.add(k);
      hang.push([kq.tt, [...duong, h]]);
    }
  }
  return { bi: true, nut: daXet.size };
}

// ĐỘ HÓC, không phải độ dài.
//
// Số nước đi là thước đo sai: một màn 25 nước có thể là 25 nước hiển nhiên
// trong hành lang. Cái làm nên câu đố là CHỖ CÓ THỂ ĐI SAI.
//
// Dựng cả đồ thị trạng thái, lần ngược từ các nước thắng để biết trạng thái nào
// còn đường thắng, rồi đi theo lời giải ngắn nhất và đếm:
//   bay      — nước đi khác dẫn vào ngõ cụt (đi là hỏng màn, phải lùi)
//   ngaRe    — chỗ có từ 2 nước trở lên vẫn thắng được (đường rộng, dễ mò)
//   thatCo   — chỗ chỉ còn ĐÚNG MỘT nước đi đúng giữa nhiều lựa chọn
export function docDoHoc(game, man, capNut = 150000) {
  const dau = game.batDau(man);
  const kDau = khoa(dau);
  const nut = new Map([[kDau, { tt: dau, tiep: null, cha: null, nuocCha: null }]]);
  const nguoc = new Map();          // khoá -> các khoá đi tới được nó
  const hang = [dau];
  let i = 0, thangTu = null;

  while (i < hang.length) {
    const tt = hang[i++];
    const k = khoa(tt);
    const tiep = [];
    for (const h of TEN_HUONG) {
      const kq = game.buoc(man, tt, h);
      if (!kq) { tiep.push({ h, k: null, thang: false }); continue; }
      if (kq.thang) { tiep.push({ h, k: null, thang: true }); if (!thangTu) thangTu = { k, h }; continue; }
      const k2 = khoa(kq.tt);
      if (!nut.has(k2)) {
        if (nut.size >= capNut) return { qua: true };
        nut.set(k2, { tt: kq.tt, tiep: null, cha: k, nuocCha: h });
        hang.push(kq.tt);
      }
      if (!nguoc.has(k2)) nguoc.set(k2, []);
      nguoc.get(k2).push(k);
      tiep.push({ h, k: k2, thang: false });
    }
    nut.get(k).tiep = tiep;
  }
  if (!thangTu) return { bi: true, nut: nut.size };

  // lần ngược: trạng thái nào còn đường thắng
  const conDuong = new Set();
  const queue = [];
  for (const [k, n] of nut) if (n.tiep.some((t) => t.thang)) { conDuong.add(k); queue.push(k); }
  for (let j = 0; j < queue.length; j++)
    for (const truoc of nguoc.get(queue[j]) ?? [])
      if (!conDuong.has(truoc)) { conDuong.add(truoc); queue.push(truoc); }

  // dựng lại đường ngắn nhất (BFS nên cha chính là đường ngắn nhất)
  const duong = [];
  const chuoi = [];
  let k = thangTu.k;
  while (k !== null) { chuoi.unshift(k); const n = nut.get(k); if (n.cha === null) break; duong.unshift(n.nuocCha); k = n.cha; }
  duong.push(thangTu.h);

  let bay = 0, ngaRe = 0, thatCo = 0;
  chuoi.forEach((kc, idx) => {
    const n = nut.get(kc);
    const diTheo = duong[idx];
    let songKhac = 0;
    for (const t of n.tiep) {
      if (t.h === diTheo) continue;
      if (!t.k && !t.thang) continue;       // đâm tường, không phải lựa chọn
      if (t.k === kc) continue;             // không đổi gì
      if (t.thang || conDuong.has(t.k)) songKhac++;
      else bay++;                           // đi là hỏng màn
    }
    if (songKhac === 0) thatCo++;
    else ngaRe += songKhac;
  });

  // chet: tỉ lệ trạng thái đi tới được mà đã hết đường thắng — "dễ bí tới đâu".
  // Bắt được bẫy sâu nhiều nước, thứ mà `bay` (chỉ nhìn một nước) bỏ sót.
  const chet = 1 - conDuong.size / nut.size;
  // conDuong + trangThai: để thước đo riêng từng game (vd. người chơi tham) dùng lại
  const trangThai = chuoi.map((kc) => nut.get(kc).tt);
  return { duong, bay, ngaRe, thatCo, chet, nut: nut.size, conDuong, trangThai };
}

// Đi lại lời giải, trả về danh sách trạng thái — để kiểm nó thật sự thắng,
// và để xét màn có dùng tới cơ chế hay không.
export function diLai(game, man, duong) {
  let tt = game.batDau(man);
  const chuoi = [tt];
  for (const h of duong) {
    const kq = game.buoc(man, tt, h);
    if (!kq) return { loi: 'nước đi không hợp lệ' };
    tt = kq.tt;
    chuoi.push(tt);
    if (kq.thang) return { chuoi, thang: true };
  }
  return { loi: 'đi hết lời giải mà chưa thắng' };
}
