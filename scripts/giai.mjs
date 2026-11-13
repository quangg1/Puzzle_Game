// Bộ giải chung cho mọi cơ chế: chỉ cần game có batDau() và buoc().
// Dùng chính hàm của game nên không thể lệch luật giữa bộ kiểm và trang chơi.
export const TEN_HUONG = ['len', 'xuong', 'trai', 'phai'];

// Bỏ các trường chỉ phục vụ hoạt ảnh — chúng không đổi luật, giữ lại chỉ làm phình cây.
const BO = new Set(['luc', 'quay', 'vuaNuot', 'noAt', 'truoc', 'huong']);
const ss = (a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);

function chuan(v) {
  if (v instanceof Set) return [...v].map(chuan).sort(ss);
  if (v instanceof Map) return [...v.entries()].map(([k, x]) => [k, chuan(x)]).sort(ss);
  if (Array.isArray(v)) return v.map(chuan).sort(ss);   // 4 game này không phụ thuộc thứ tự mảng
  if (v && typeof v === 'object')
    return Object.keys(v).filter((k) => !BO.has(k)).sort().map((k) => [k, chuan(v[k])]);
  return v;
}
export const khoa = (tt) => JSON.stringify(chuan(tt));

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
