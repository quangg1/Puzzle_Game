"""Ghép nhiều ảnh thành một bảng để xem nhanh.
Dùng: python tools/bang-hinh.py <thư-mục> <ra.png> [cạnh=220]
"""
import sys
from pathlib import Path
from PIL import Image

thu, ra = Path(sys.argv[1]), sys.argv[2]
canh = int(sys.argv[3]) if len(sys.argv) > 3 else 220
ds = sorted(p for p in thu.iterdir() if p.suffix in (".png", ".webp"))
cot = 5
hang = (len(ds) + cot - 1) // cot
bang = Image.new("RGBA", (cot * canh, hang * canh), (214, 186, 140, 255))   # màu cát của game
for i, p in enumerate(ds):
    im = Image.open(p).convert("RGBA")
    im.thumbnail((canh - 10, canh - 10), Image.LANCZOS)
    x = (i % cot) * canh + (canh - im.width) // 2
    y = (i // cot) * canh + (canh - im.height) // 2
    bang.alpha_composite(im, (x, y))
bang.save(ra)
print(ra, [p.stem for p in ds])
