// Dò màn cho cả 4 game rồi GHI THẲNG ra ../man.js.
// Điều kiện kép: giải được VÀ phải dùng tới cơ chế — thiếu vế sau thì ra một đống
// màn "giải được" mà đi vòng vòng không đụng luật.
// Chạy: node scripts/tim-man.mjs
import { writeFileSync } from 'node:fs';
import { MAN as MAN_CU } from '../man.js';
import { docMan } from '../nen.js';
import { giai, diLai, docDoHoc } from './giai.mjs';
import { doKho, doKhoTia, doKhoPhim, doKhoThung } from './nguoi-tham.mjs';
import lo from '../game/lo.js';
import thoiGian from '../game/thoi-gian.js';
import xoay from '../game/xoay.js';
import tachDoi from '../game/tach-doi.js';

const MOI_GAME = 20;
const GIOI_HAN = Number(process.env.THU ?? 12000);   // THU=30000 node ... để quét kỹ hơn          // 1 màn dạy luật + 19 màn dò ra

let hat = 20261113;           // mầm cố định: chạy lại ra đúng bộ màn cũ
const rnd = () => ((hat = (hat * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function dungMan(khung, dat) {
  const o = khung.map((d) => [...d]);
  const san = [];
  khung.forEach((d, y) => [...d].forEach((c, x) => c === '.' && san.push([x, y])));
  for (let i = san.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [san[i], san[j]] = [san[j], san[i]];
  }
  let k = 0;
  for (const [ky, so] of Object.entries(dat))
    for (let i = 0; i < so; i++) {
      if (k >= san.length) return null;
      const [x, y] = san[k++];
      o[y][x] = ky;
    }
  return o.map((d) => d.join(''));
}

const VIEC = [
  {
    khoa: 'lo', game: lo,
    // Bốn màn dạy, mỗi màn MỘT luật mới: ăn → lớn rồi ăn thứ to → ngõ cụt phải
    // ăn trước khi lớn → chum để nhỏ lại mà chui vào ngõ.
    // Ba màn dạy, mỗi màn MỘT luật mới: ăn rồi lớn → ngõ cụt phải ăn trước khi
    // lớn → chum để nhỏ lại mà chui vào ngõ (11 nước, có một chỗ then chốt).
    dayDs: [
      ['#######', '#@1.12#', '#.....#', '#######'],
      ['#######', '#1#...#', '#.@.1.#', '#.1.2.#', '#######'],
      ['#######', '#12####', '##.c..#', '##@11.#', '#######'],
    ],
    // Bốn bậc: bàn to dần, vật nhiều dần. Khung vẽ tay (chữ L, hai phòng, hành
    // lang, ngõ cụt) cho mỗi màn một dáng riêng; chỉ thêm ít tường ngẫu nhiên.
    bac: [
      { so: 4, khung: [
        ['########', '#......#', '#......#', '#......#', '########'],
        ['########', '#...####', '#...####', '#......#', '#......#', '########'],
        ['#########', '#...#...#', '#.......#', '#...#...#', '#########'],
      // bậc 1 chưa có chum: chỉ luyện "ăn ngõ cụt trước khi lớn" cho quen tay.
      // Mỗi bậc có VÀI bộ vật khác nhau — một bộ duy nhất thì các màn chơi y hệt nhau.
      ], dat: [
        { '@': 1, '#': 1, '1': 4, '2': 2 },
        { '@': 1, '#': 1, '1': 5, '2': 1 },
        { '@': 1, '#': 2, '1': 3, '2': 2 },
        { '@': 1, '#': 1, '1': 4, '2': 1, '3': 1 },
      ], min: 8, max: 22 },
      { so: 4, khung: [
        ['#########', '#....####', '#....#..#', '#.......#', '#....#..#', '#########'],
        ['##########', '#..#.....#', '#..#.....#', '#........#', '####.....#', '##########'],
        ['#########', '#...#...#', '#.......#', '#...#...#', '#.......#', '#########'],
      ], dat: [
        { '@': 1, '#': 1, '1': 3, '2': 2, '3': 1, 'c': 1 },
        { '@': 1, '#': 1, '1': 4, '2': 3, 'c': 1 },
        { '@': 1, '#': 2, '1': 4, '2': 1, '3': 1, 'c': 1 },
        { '@': 1, '#': 1, '1': 5, '2': 2, 'c': 1 },
      ], min: 10, max: 28 },
      { so: 4, khung: [
        ['#########', '#..###..#', '#.......#', '#..#.#..#', '#.......#', '#..###..#', '#########'],
        ['##########', '#....#...#', '#....#...#', '#........#', '#.##.....#', '#....#...#', '##########'],
        ['##########', '#..#.....#', '#..#.....#', '#........#', '####.....#', '##########'],
      ], dat: [
        { '@': 1, '#': 2, '1': 3, '2': 2, '3': 2, 'c': 2 },
        { '@': 1, '#': 2, '1': 4, '2': 3, '3': 1, 'c': 1 },
        { '@': 1, '#': 1, '1': 5, '2': 1, '3': 2, 'c': 2 },
        { '@': 1, '#': 2, '1': 4, '2': 2, '3': 1, 'c': 2 },
      ], min: 14, max: 32 },
      { so: 5, khung: [
        ['##########', '#....#...#', '#....#...#', '#........#', '#.##.....#', '#....#...#', '##########'],
        ['#########', '#..###..#', '#.......#', '#..#.#..#', '#.......#', '#..###..#', '#########'],
        ['###########', '#...#.....#', '#...#.....#', '#.........#', '#...###...#', '###########'],
      ], dat: [
        { '@': 1, '#': 2, '1': 4, '2': 2, '3': 2, 'c': 2 },
        { '@': 1, '#': 2, '1': 5, '2': 3, '3': 1, 'c': 2 },
        { '@': 1, '#': 1, '1': 4, '2': 2, '3': 3, 'c': 2 },
        { '@': 1, '#': 2, '1': 6, '2': 2, '3': 2, 'c': 3 },
      ], min: 16, max: 36 },
    ],
    // Độ khó = số chỗ then chốt (ăn thứ gần nhất là thua) + phần kẻ tham thua.
    // Mọi màn dò ra phải buộc người chơi nghĩ: có then chốt, hoặc kẻ tham thua quá nửa.
    doKho: (man, hoc) => {
      const d = doKho(man, hoc);
      // Thêm độ dài làm vế phụ, như ba game kia. Trước đây điểm chỉ là then
      // chốt cộng tỉ lệ tham, mà then chốt là số nguyên nhỏ nên rất nhiều màn
      // bằng điểm nhau; lúc đó thứ tự lấy gần như ngẫu nhiên.
      return {
        ...d, chet: hoc.chet,
        diem: d.thenChot + (1 - d.tham) + hoc.duong.length / 30,
        dat: d.thenChot >= 1 || d.tham < .5,
      };
    },
    dac: (c) => Math.max(...c.map((t) => t.nuot)) >= 3,     // hố buộc phải lớn lên
    // Chum phải BẮT BUỘC: bỏ hết chum đi mà vẫn giải được thì chum chỉ là đồ trang trí.
    canVatPhu: (o) => !o.join('').includes('c')
      || giai(lo, docMan(o.map((d) => d.replaceAll('c', '.'))), 120000).bi,
  },
  {
    khoa: 'thoiGian', game: thoiGian,
    // Ba màn dạy, mỗi màn một luật: hàng là khoảnh khắc → bản thân cũ chắn
    // đường → vết nối cắt bỏ cả khoảnh khắc.
    // Màn 1 và màn 2 cố ý CÙNG MỘT BÀN, chỉ khác đúng một viên tường ở giữa.
    // Màn 1 đi kiểu gì cũng thắng; thêm viên tường vào là thứ tự bỗng thành
    // vấn đề, vì xuống sớm là tự bịt mất lối về. Dạy luật bằng cách đặt hai
    // bàn gần giống nhau cạnh nhau, không cần một chữ hướng dẫn nào.
    dayDs: [
      ['#####', '#@.o#', '#...#', '#X..#', '#####'],
      ['#####', '#@.o#', '#.#.#', '#X..#', '#####'],
      ['#######', '#@..X.#', '##.#s##', '#..o..#', '#######'],
    ],
    // Bậc 1 KHÔNG có vết nối: chỉ luyện "đổi khung là để lại mình cũ" cho quen,
    // y như Hố Sụt để dành chum và Tia Sét để dành cọc tới bậc 2.
    bac: [
      { so: 5, khung: [
        ['#######', '#.....#', '#.....#', '#.....#', '#######'],
        ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
      ], dat: [
        { '@': 1, 'X': 1, 'o': 2, '#': 4 },
        { '@': 1, 'X': 1, 'o': 3, '#': 3 },
        { '@': 1, 'X': 1, 'o': 2, '#': 5 },
      ], min: 7, max: 18 },
      { so: 5, khung: [
        ['########', '#......#', '#......#', '#......#', '#......#', '########'],
        ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
      ], dat: [
        { '@': 1, 'X': 1, 'o': 3, 's': 1, '#': 5 },
        { '@': 1, 'X': 1, 'o': 3, 's': 2, '#': 4 },
        { '@': 1, 'X': 1, 'o': 4, '#': 5 },
      ], min: 10, max: 24 },
      { so: 4, khung: [
        ['########', '#......#', '#......#', '#......#', '#......#', '########'],
        ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
      ], dat: [
        { '@': 1, 'X': 1, 'o': 4, 's': 2, '#': 6 },
        { '@': 1, 'X': 1, 'o': 4, 's': 1, '#': 7 },
        { '@': 1, 'X': 1, 'o': 5, 's': 2, '#': 5 },
      ], min: 12, max: 28 },
      { so: 3, khung: [
        ['########', '#......#', '#......#', '#......#', '#......#', '#......#', '########'],
        ['#########', '#.......#', '#.......#', '#.......#', '#.......#', '#########'],
      ], dat: [
        { '@': 1, 'X': 1, 'o': 5, 's': 2, '#': 7 },
        { '@': 1, 'X': 1, 'o': 4, 's': 2, '#': 9 },
        { '@': 1, 'X': 1, 'o': 5, 's': 3, '#': 6 },
      ], min: 14, max: 34 },
    ],
    // Ở game này kẻ chơi tham là thước tốt — đo bộ màn cũ ra nó thắng 100% ở 6
    // màn và trên 80% ở 9 màn, tức phần lớn màn chỉ là đi nhặt đồ theo thứ tự
    // gần nhất, cơ chế bóng ma không được dùng tới. Chặn thẳng chỗ đó.
    doKho: (man, hoc) => {
      const d = doKhoPhim(man, hoc);
      return {
        ...d, chet: hoc.chet,
        diem: d.thenChot + (1 - d.tham) + hoc.duong.length / 30,
        dat: d.thenChot >= 1 || d.tham <= .25,
      };
    },
    // phải đổi khung hình ít nhất 2 lần, tức thật sự dùng trục thời gian
    dac: (c) => c.filter((t, i) => i && t.y !== c[i - 1].y).length >= 2,
    // Vết nối phải được DÙNG trong lời giải ngắn nhất, không thì là đồ trang trí.
    canVatPhu: (o, chuoi) => !o.join('').includes('s') || chuoi.some((t) => t.vuaCat),
  },
  {
    khoa: 'xoay', game: xoay,
    // Ba màn dạy: đi bộ → đẩy vào thành thùng là cả thùng nghiêng → chạm kiện
    // thì trèo lên. Màn 2 chỉ cần bấm một phím sáu lần, nên cú nghiêng hiện ra
    // không lẫn vào đâu được.
    dayDs: [
      ['......', '......', '......', '......', '......', '@....X'],
      ['X.....', '......', '......', '......', '......', '@.....'],
      ['......', '......', '......', '......', '......', '@o...X'],
    ],
    // BẮT BUỘC vuông, nếu không phép quay 90° không còn khớp lưới.
    // Bậc 1 chưa có kiện dễ vỡ lẫn kiện bắt đinh: chỉ luyện nghiêng và trèo.
    bac: [
      { so: 5, khung: [
        ['.....', '.....', '.....', '.....', '.....'],
        ['......', '......', '......', '......', '......', '......'],
      ], dat: [
        { '@': 1, 'X': 1, 'o': 2, '#': 2 },
        { '@': 1, 'X': 1, 'o': 3, '#': 3 },
        { '@': 1, 'X': 1, 'o': 2, 'h': 1, '#': 2 },
      ], min: 5, max: 14 },
      { so: 5, khung: [
        ['......', '......', '......', '......', '......', '......'],
      ], dat: [
        { '@': 1, 'X': 1, 'o': 2, 'v': 2, 'h': 1, '#': 3 },
        { '@': 1, 'X': 1, 'o': 3, 'v': 2, '#': 4 },
        { '@': 1, 'X': 1, 'o': 2, 'v': 1, 'h': 1, 'd': 1, '#': 3 },
      ], min: 8, max: 20 },
      { so: 4, khung: [
        ['......', '......', '......', '......', '......', '......'],
        ['.......', '.......', '.......', '.......', '.......', '.......', '.......'],
      ], dat: [
        { '@': 1, 'X': 1, 'o': 2, 'v': 3, 'h': 2, 'd': 2, '#': 4 },
        { '@': 1, 'X': 1, 'o': 3, 'v': 2, 'h': 1, 'd': 2, '#': 5 },
        { '@': 1, 'X': 1, 'o': 2, 'v': 3, 'h': 1, 'd': 1, '#': 4 },
      ], min: 10, max: 26 },
      { so: 3, khung: [
        ['.......', '.......', '.......', '.......', '.......', '.......', '.......'],
      ], dat: [
        { '@': 1, 'X': 1, 'o': 3, 'v': 3, 'h': 2, 'd': 3, '#': 5 },
        { '@': 1, 'X': 1, 'o': 2, 'v': 4, 'h': 2, 'd': 2, '#': 6 },
        { '@': 1, 'X': 1, 'o': 3, 'v': 4, 'h': 2, 'd': 2, '#': 5 },
      ], min: 13, max: 32 },
    ],
    doKho: (man, hoc) => {
      const d = doKhoThung(man, hoc);
      return {
        ...d, chet: hoc.chet,
        diem: d.thenChot + (1 - d.tham) + hoc.duong.length / 30,
        dat: d.thenChot >= 1 || d.tham <= .25,
      };
    },
    // phải có ít nhất một cú NGHIÊNG, không thì ra toàn màn đi bộ là xong
    dac: (c) => c.some((t) => t.quay),
  },
  {
    khoa: 'tachDoi', game: tachDoi,
    // Bốn màn dạy, mỗi màn MỘT luật mới, và không màn nào dài hơn mức cần để
    // thấy luật đó. Ngạnh với cọc đi liền nhau vì chúng là một cặp: cái làm
    // tia nhiều lên, cái làm tia ít đi. Hiểu cặp đó là hiểu cả game.
    dayDs: [
      ['#######', '#@...X#', '#######'],                               // một phím, mọi tia
      ['#######', '#...X.#', '#@..Y.#', '#...X.#', '#######'],         // ngạnh chẻ đôi
      ['#######', '#...T.#', '#@..Y.#', '#...X.#', '#######'],         // cọc nuốt tia thừa
      ['########', '#....X.#', '#......#', '#@...G.#', '########'],    // gương bẻ 90 độ
    ],
    // Bốn bậc: bàn to dần, chấu nhiều dần, nên số tia phải gom đúng cũng tăng.
    // Ngạnh luôn nhiều hơn chấu để còn đường chẻ dư rồi vứt bớt vào cọc —
    // chẻ vừa đủ thì không có gì để tính.
    bac: [
      { so: 4, khung: [
        ['########', '#......#', '#......#', '#......#', '########'],
        ['#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
      // Bậc 1 KHÔNG có cọc: chỉ luyện chẻ và bẻ gương cho quen tay, y như Hố Sụt
      // để dành chum tới bậc 2. Thêm cọc ngay từ đầu thì người chơi phải cân ba
      // thứ cùng lúc trong khi còn chưa chắc tay với cái thứ nhất.
      ], dat: [
        { '@': 1, 'X': 2, 'Y': 2, 'G': 1, 'B': 1, '#': 2 },
        { '@': 1, 'X': 2, 'Y': 3, 'G': 1, 'B': 1, '#': 2 },
        { '@': 1, 'X': 2, 'Y': 2, 'G': 2, 'B': 1, '#': 3 },
      ], min: 5, max: 16 },
      { so: 5, khung: [
        ['########', '#......#', '#......#', '#......#', '#......#', '########'],
        ['#########', '#.......#', '#.......#', '#.......#', '#########'],
      ], dat: [
        { '@': 1, 'X': 3, 'Y': 3, 'G': 1, 'B': 1, 'T': 1, '#': 2 },
        { '@': 1, 'X': 3, 'Y': 4, 'G': 2, 'B': 1, 'T': 1, '#': 3 },
        { '@': 1, 'X': 3, 'Y': 3, 'G': 2, 'B': 2, '#': 3 },
      ], min: 7, max: 24 },
      { so: 4, khung: [
        ['#########', '#.......#', '#.......#', '#.......#', '#.......#', '#########'],
        ['##########', '#........#', '#........#', '#........#', '#........#', '##########'],
      ], dat: [
        { '@': 1, 'X': 3, 'Y': 4, 'G': 2, 'B': 2, 'T': 1, '#': 4 },
        { '@': 1, 'X': 4, 'Y': 4, 'G': 2, 'B': 1, 'T': 2, '#': 3 },
        { '@': 1, 'X': 3, 'Y': 4, 'G': 3, 'B': 2, 'T': 2, '#': 4 },
      ], min: 9, max: 28 },
      { so: 3, khung: [
        ['##########', '#........#', '#........#', '#........#', '#........#', '##########'],
        ['#########', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#########'],
      ], dat: [
        { '@': 1, 'X': 4, 'Y': 5, 'G': 2, 'B': 2, 'T': 2, '#': 4 },
        { '@': 1, 'X': 4, 'Y': 5, 'G': 3, 'B': 2, 'T': 2, '#': 5 },
        { '@': 1, 'X': 3, 'Y': 5, 'G': 3, 'B': 3, 'T': 2, '#': 5 },
      ], min: 11, max: 32 },
    ],
    // Độ khó = số chỗ MỌI nước hiển nhiên đều sai. Bắt buộc ≥ 1: bộ màn cũ có
    // 13/20 màn bằng 0, tức là lùa tia về phía chấu là xong, không phải câu đố.
    doKho: (man, hoc) => {
      const d = doKhoTia(man, hoc);
      // Ở Hố Sụt, tỉ lệ kẻ tham thắng chạy từ 0 tới 53% nên nó phân loại tốt.
      // Ở đây kẻ lùa tia gần như không bao giờ thắng — đo ra 0% ở cả 20 màn cũ —
      // nên nó vô dụng làm thước. Dùng hai vế khác:
      //   thenChot  chỗ mọi nước hiển nhiên đều sai      (hóc tới đâu)
      //   chet      phần trạng thái đã hết đường thắng   (dễ làm hỏng tới đâu)
      // Lấy cả hai vì chúng bắt hai kiểu khó khác nhau, và riêng thenChot thì
      // chỉ nhận giá trị 0/1/2 — đo trên bàn lớn ra quá ít ứng viên để chọn.
      return {
        ...d, chet: hoc.chet,
        diem: d.thenChot + hoc.chet + hoc.duong.length / 30,
        dat: d.thenChot >= 1 || hoc.chet >= .25,
      };
    },
    dac: (c) => Math.max(...c.map((t) => t.tia.length)) >= 2,   // thật sự chẻ ra
    // Cọc phải được DÙNG trong lời giải ngắn nhất, không thì nó là đồ trang trí.
    // Đã thử điều kiện chặt hơn — "bỏ cọc đi là bí" như chum của Hố Sụt — nhưng
    // đo ra chỉ 1.3% ứng viên đạt, không đủ màn để chọn. Ở Hố Sụt chum chỉ chỉnh
    // cỡ hố nên dễ thành thiết yếu; ở đây bỏ một cọc thì thường vẫn còn đường
    // gom tia kiểu khác. Lấy "có dùng" là mức vừa đủ để cọc có việc thật.
    canVatPhu: (o, chuoi) => !o.join('').includes('T') || chuoi.some((t) => t.hut?.length),
  },
];

const chiLam = process.argv[2];
const ra = Object.fromEntries(Object.entries(MAN_CU).map(([k, v]) => [k, { giu: v }]));

// Dò theo bậc: mỗi bậc một cỡ bàn + bộ vật riêng, lấy đều từ dễ tới khó TRONG bậc.
// Độ khó = bẫy một nước + tỉ lệ trạng thái đã bí (bẫy sâu). Chỉ độ dài thì không đo được.
function doTheoBac(v) {
  const ungVien = [];
  for (const [ib, b] of v.bac.entries()) {
    const tim = [], daCo = new Set();
    let thu = 0;
    while (thu < GIOI_HAN && tim.length < 60) {
      thu++;
      const kh = Math.floor(rnd() * b.khung.length);
      const dsDat = Array.isArray(b.dat) ? b.dat : [b.dat];
      const di = Math.floor(rnd() * dsDat.length);
      const o = dungMan(b.khung[kh], dsDat[di]);
      if (!o || daCo.has(o.join('|'))) continue;
      daCo.add(o.join('|'));
      let man;
      try { man = docMan(o); } catch { continue; }
      const kq = giai(v.game, man, 120000);
      if (!kq.duong || kq.duong.length < b.min || kq.duong.length > b.max) continue;
      const lai = diLai(v.game, man, kq.duong);
      if (!lai.thang || !v.dac(lai.chuoi)) continue;
      if (v.canVatPhu && !v.canVatPhu(o, lai.chuoi)) continue;
      const hoc = docDoHoc(v.game, man, 150000);
      if (!hoc.duong) continue;
      const d = v.doKho(man, hoc);
      if (!d.dat) continue;
      tim.push({ o, kh, di, nuoc: kq.duong.length, bay: hoc.bay, thenChot: d.thenChot, tham: d.tham, chet: d.chet, diem: d.diem + kq.duong.length / 100 });
    }
    console.log(`  bậc ${ib + 1}: thử ${thu}, đạt ${tim.length}`);
    ungVien.push(tim);
  }

  // Trong mỗi bậc: sắp ứng viên theo điểm khó rồi lấy đều từ đầu tới cuối, lấy
  // theo THỨ HẠNG chứ không theo mốc điểm.
  //
  // Bản trước đặt mốc điểm trên thang chung của cả game. Nhưng tới bậc 2 trở đi
  // thì mốc đã vượt quá điểm của MỌI ứng viên trong bậc, nên lần nào thuật toán
  // cũng chọn con khó nhất còn lại — và độ khó trong bậc đi GIẢM dần. Đo trên
  // Tia Sét ra: bậc 2 được 3 2 1 1 2, bậc 3 được 6 3 2 2, bậc 4 được 11 5 5.
  // Mỗi bậc mở màn bằng chính màn khó nhất của nó. Lấy theo thứ hạng thì đường
  // cong không bao giờ tụt trong một bậc, và con lệch đàn cũng tự nằm ở cuối.
  const chon = [];
  for (const [ib, b] of v.bac.entries()) {
    const sap = [...ungVien[ib]].sort((a, b2) => a.diem - b2.diem);
    if (!sap.length) continue;
    let sauCung = 0;                       // chỉ lấy tiến lên, không lùi lại
    for (let j = 0; j < b.so; j++) {
      // Bậc sau bỏ qua 25% ứng viên dễ nhất của nó. Bậc nào cũng quét từ 0 thì
      // mỗi lần lên bậc độ khó lại tụt hẳn xuống đáy — bàn to hơn thật, nhưng
      // người chơi vừa qua một màn hóc lại gặp ngay một màn dễ hơn cả màn đầu.
      const dau = ib === 0 ? 0 : .25;
      const phan = b.so > 1 ? dau + (1 - dau) * (j / (b.so - 1)) : (1 + dau) / 2;
      const goc = Math.max(Math.round(phan * (sap.length - 1)), sauCung);
      if (goc >= sap.length) break;        // bậc này hết ứng viên
      // Không lặp: màn liền trước dùng khung nào, bộ vật nào thì màn này tránh
      // cả hai. Nhưng chỉ dò quanh thứ hạng lý tưởng trong BÁN KÍNH HẸP: dò xa
      // thì một màn nhảy lên hạng cao, các màn sau buộc phải cao hơn nữa, và
      // bậc hết ứng viên trước khi lấy đủ. Đó là lý do lần chạy trước chỉ ra
      // 14 màn trên 16.
      const sat = chon[chon.length - 1];
      const hop = (k) => k >= sauCung && k < sap.length
        && (!sat || (sap[k].kh !== sat.kh && sap[k].di !== sat.di));
      const banKinh = Math.max(1, Math.round(sap.length / (b.so * 2)));
      let lay = hop(goc) ? goc : -1;
      for (let d = 1; d <= banKinh && lay < 0; d++)
        for (const k of [goc - d, goc + d]) if (hop(k)) { lay = k; break; }
      if (lay < 0) lay = goc;              // không có bản khác kiểu thì cứ lấy đúng thứ hạng
      sap[lay].bac = ib;
      chon.push(sap[lay]);
      sauCung = lay + 1;
    }
  }
  return chon;
}

for (const v of VIEC) {
  if (chiLam && v.khoa !== chiLam) continue;
  if (v.bac) {
    console.log(v.game.ten);
    const chon = doTheoBac(v);
    ra[v.khoa] = { dayDs: v.dayDs, chon };
    console.log(`  then chốt:  ${chon.map((c) => c.thenChot).join(' ')}`);
    console.log(`  tham thắng: ${chon.map((c) => Math.round(c.tham * 100)).join(' ')}`);
    if (chon.some((c) => c.chet !== undefined))
      console.log(`  chết %:     ${chon.map((c) => Math.round((c.chet ?? 0) * 100)).join(' ')}`);
    console.log(`  nước:       ${chon.map((c) => c.nuoc).join(' ')}`);
    continue;
  }
  const tim = [];
  const daCo = new Set();
  let thu = 0;

  while (thu < GIOI_HAN && tim.length < 120) {
    thu++;
    const khung = v.khung[Math.floor(rnd() * v.khung.length)];
    const o = dungMan(khung, v.dat);
    if (!o) continue;
    const dau = o.join('|');
    if (daCo.has(dau)) continue;
    daCo.add(dau);

    let man;
    try { man = docMan(o); } catch { continue; }
    const kq = giai(v.game, man, 120000);
    if (!kq.duong || kq.duong.length < v.min || kq.duong.length > v.max) continue;
    const lai = diLai(v.game, man, kq.duong);
    if (!lai.thang || !v.dac(lai.chuoi)) continue;

    // Thước đo thật: số nước sai dẫn vào ngõ cụt. Chọn theo độ dài thì ra một
    // hành lang 25 nước hiển nhiên — dài nhưng không phải câu đố.
    const hoc = docDoHoc(v.game, man, 150000);
    if (!hoc.duong || hoc.bay < 1) continue;
    tim.push({ o, nuoc: kq.duong.length, bay: hoc.bay, thatCo: hoc.thatCo });
  }

  // xếp từ dễ tới khó theo bẫy, bẫy bằng nhau thì theo độ dài
  tim.sort((a, b) => a.bay - b.bay || a.nuoc - b.nuoc);
  // Rải đều từ dễ tới khó, nhưng KHÔNG lấy trùng: ứng viên ít hơn số cần thì
  // thà ra ít màn còn hơn lặp lại cùng một màn hai lần.
  const can = MOI_GAME - 1;
  const chon = [];
  const daLay = new Set();
  for (let i = 0; i < can && tim.length; i++) {
    const j = Math.min(tim.length - 1, Math.round((i * (tim.length - 1)) / Math.max(1, can - 1)));
    for (let b = 0; b < tim.length; b++) {            // trùng thì lấn sang ứng viên kế
      const k = (j + b) % tim.length;
      if (daLay.has(k)) continue;
      daLay.add(k);
      chon.push(tim[k]);
      break;
    }
  }
  chon.sort((a, b) => a.bay - b.bay || a.nuoc - b.nuoc);

  ra[v.khoa] = { day: v.day, chon };
  console.log(`${v.game.ten}: thử ${thu}, đạt ${tim.length}, lấy ${chon.length}`);
  console.log(`  bẫy:  ${chon.map((c) => c.bay).join(' ')}`);
  console.log(`  nước: ${chon.map((c) => c.nuoc).join(' ')}`);
}

const than = Object.entries(ra).map(([khoa, m]) => {
  const dong = [`  ${khoa}: [`];
  if (m.giu) {                                 // game lần này không quét thì giữ nguyên
    for (const c of m.giu) dong.push(`    { o: ${JSON.stringify(c.o)} },`);
  } else {
    for (const d of m.dayDs ?? [m.day]) dong.push(`    { o: ${JSON.stringify(d)} },   // màn dạy luật, vẽ tay`);
    for (const c of m.chon) {
      const phan = [`${c.nuoc} nước`];
      if (c.thenChot === undefined) phan.push(`${c.bay} bẫy`);
      else {
        phan.push(`${c.thenChot} then chốt`, `tham thắng ${Math.round(c.tham * 100)}%`);
        if (c.chet !== undefined) phan.push(`chết ${Math.round(c.chet * 100)}%`);
      }
      const ghi = phan.join(' · ');
      dong.push(`    { o: ${JSON.stringify(c.o)} },   // ${ghi}`);
    }
  }
  dong.push('  ],');
  return dong.join('\n');
}).join('\n');

writeFileSync(new URL('../man.js', import.meta.url), `// TỆP NÀY DO MÁY SINH — đừng sửa tay.
// Sinh lại: node scripts/tim-man.mjs   ·  Kiểm: node scripts/kiem-man.mjs
// Mỗi màn đều đã được bộ giải xác nhận giải được, và lời giải phải dùng tới cơ chế.
// Màn xếp theo số nước đi của lời giải ngắn nhất, dễ tới khó.
export const MAN = {
${than}
};
`);
console.log('\nĐã ghi man.js');
