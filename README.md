# Bốn Cơ Chế

Bốn game giải đố nhỏ chạy trên web, mỗi game một luật chơi khác hẳn và một thế giới
riêng để **nhìn là hiểu luật, không cần đọc hướng dẫn**.

| # | Game | Luật | Đã có ai làm |
|---|---|---|---|
| 01 | Hố Sụt | Bạn là cái hố. Chỉ nuốt được thứ không to hơn mình; nuốt đủ thì hố rộng ra | Donut County, Hole.io |
| 02 | Cuộn Phim | Mỗi hàng là một khoảnh khắc. Ngang là không gian, dọc là thời gian; rời một khung là để lại bản thân cũ chắn chỗ | chưa thấy ai làm |
| 03 | Thùng Hàng | Nghiêng cả thùng 90°, mọi thứ rơi theo chiều "dưới" mới | Turnabout (PS1, 2000) |
| 04 | Tia Sét | Một phím điều khiển mọi tia; ngạnh chữ Y chẻ tia ra, cọc thu lôi nuốt tia đi | chưa thấy ai làm |

Không một tệp âm thanh, không thư viện ngoài. Cát, vân gỗ, thớ nhũ tương phim,
trời bão, tia điện và nhân vật — tất cả sinh bằng code lúc chạy; riêng Hố Sụt và
Thùng Hàng có thêm ít sprite `.webp` cho đồ vật trên bàn.

Bốn game nhưng **một nhân vật**: cùng một sinh vật, nhận ra nhờ cái chỏm trên
đầu, hai con mắt nhìn theo hướng vừa đi và đôi lông mày biết lo. Ở Tia Sét nó
chính là tia — chẻ đôi là nó thành hai đứa.

## Chạy tại máy

```bash
npm run dev
```

Mở http://localhost:4192

## Kiểm màn — chạy trước mỗi lần deploy

Mọi màn đều phải **giải được**, và lời giải ngắn nhất phải **dùng tới cơ chế** của
game đó. Bộ giải gọi chính hàm `buoc()` mà trang chơi dùng, nên không thể có chuyện
bộ kiểm bảo đạt mà game chơi lại khác.

```bash
npm run kiem
```

Vẽ màn bằng tay là không đáng tin — lần đầu 5/16 màn bị bí. Muốn thêm màn thì để máy
dò, nó tự ghi đè `man.js`:

```bash
npm run tim-man          # cả 4 game
node scripts/tim-man.mjs tachDoi   # một game thôi
THU=30000 npm run tim-man          # quét kỹ hơn, lâu hơn
```

### Độ khó đo bằng gì

Không đo bằng số nước đi: một màn 25 nước có thể là 25 nước hiển nhiên trong một
hành lang. Thước đo thật là **then chốt** — số chỗ trên lời giải mà MỌI nước đi
hiển nhiên đều dẫn tới thua. Mỗi chỗ như vậy là một lần người chơi buộc phải
dừng lại nghĩ.

"Hiển nhiên" là gì thì mỗi game một khác, nên mỗi game có một kẻ chơi tham riêng
trong `scripts/nguoi-tham.mjs`: ở Hố Sụt nó luôn ăn thứ gần nhất ăn được, ở Tia
Sét nó luôn lùa tia về phía chấu chưa phủ. Màn nào kẻ đó thắng được là màn đó
chưa phải câu đố.

```bash
node scripts/nguoi-tham.mjs tachDoi   # in bảng then-chốt của bộ màn hiện tại
```

Màn sinh ra theo **bậc**: bàn to dần, vật nhiều dần, và mỗi bậc chỉ thêm MỘT thứ
mới. Trong từng bậc, màn được chọn sao cho điểm khó không bao giờ tụt so với màn
trước — nếu không thì đường cong độ khó răng cưa, màn 4 khó hơn màn 9.

## Cấu trúc

```
index.html        trang chủ + 4 sân chơi, toàn bộ CSS và giao diện
nen.js            nền chung: đọc màn, phím, lùi nước, nội suy chuyển động, hạt bụi, vân nhiễu
man.js            40 màn — MÁY SINH, đừng sửa tay
game/*.js         4 cơ chế: mỗi tệp lo batDau / buoc / ve
scripts/giai.mjs  bộ giải BFS dùng chung cho mọi cơ chế
```

Luật và hoạt ảnh **tách hẳn nhau**: `buoc()` cập nhật trạng thái đồng bộ, `ve()` chỉ
để nhìn. Nhờ vậy `requestAnimationFrame` có ngừng (tab nền) cũng không bao giờ chặn
được thao tác — lỗi này từng làm treo cứng một bản trước.

## Đưa lên host

Trang tĩnh thuần, **không có bước build**, thư mục gốc chính là thư mục xuất bản.

### Cloudflare Pages

```bash
npx wrangler pages deploy . --project-name=bon-co-che
```

### Vercel

```bash
npx vercel deploy --prod
```

Cả hai lệnh sẽ hỏi đăng nhập ở lần chạy đầu. Nếu nối qua Git thay vì đẩy trực tiếp:

- **Build command**: để trống
- **Output directory**: `.` (thư mục gốc)
- **Framework preset**: None / Static

Bắt buộc: host phải trả tệp `.js` với `Content-Type: text/javascript`. Cả Cloudflare
Pages lẫn Vercel đều làm đúng mặc định; chỉ cần để ý nếu đổi sang host khác, vì các
tệp game nạp bằng ES module.
