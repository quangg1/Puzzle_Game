"""Biến ảnh sinh ra thành sprite dùng được: cắt nền, xén sát, resize.

Cắt nền bằng LOANG TỪ VIỀN chứ không bằng ngưỡng trắng — ngưỡng trắng sẽ đục
thủng mọi mảng sáng nằm trong thân vật (chấm gai xương rồng, nẹp sáng trên thùng).

Dùng:  python tools/cat-nen.py assets/tho/xuong-rong.png assets/sprite/xuong-rong.webp [--canh 256]
"""
import sys
from pathlib import Path
from collections import deque

from PIL import Image
import numpy as np

NGUONG = 38      # lệch màu tối đa so với màu viền thì vẫn coi là nền
LE = 0.04        # chừa lề quanh vật, theo tỉ lệ cạnh


def cat_nen(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape

    # màu nền = trung vị của bốn mép
    vien = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    nen = np.median(vien, axis=0)
    gan_nen = (np.abs(a - nen).max(axis=2) <= NGUONG)

    # loang từ mọi điểm mép còn giống màu nền
    la_nen = np.zeros((h, w), bool)
    hang = deque()
    for x in range(w):
        for y in (0, h - 1):
            if gan_nen[y, x] and not la_nen[y, x]:
                la_nen[y, x] = True
                hang.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if gan_nen[y, x] and not la_nen[y, x]:
                la_nen[y, x] = True
                hang.append((y, x))
    while hang:
        y, x = hang.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and gan_nen[ny, nx] and not la_nen[ny, nx]:
                la_nen[ny, nx] = True
                hang.append((ny, nx))

    ra = im.convert("RGBA")
    alpha = np.where(la_nen, 0, 255).astype(np.uint8)
    ra.putalpha(Image.fromarray(alpha))
    return ra


def xen_va_thu(im: Image.Image, canh: int) -> Image.Image:
    hop = im.getbbox()
    if hop:
        im = im.crop(hop)
    k = max(im.size)
    le = int(k * LE)
    vuong = Image.new("RGBA", (k + le * 2, k + le * 2), (0, 0, 0, 0))
    vuong.paste(im, ((vuong.width - im.width) // 2, (vuong.height - im.height) // 2))
    # LANCZOS khi thu nhỏ cũng làm mịn luôn mép alpha, khỏi phải khử răng cưa riêng
    return vuong.resize((canh, canh), Image.LANCZOS)


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    vao, ra = Path(sys.argv[1]), Path(sys.argv[2])
    canh = 256
    if "--canh" in sys.argv:
        canh = int(sys.argv[sys.argv.index("--canh") + 1])

    im = xen_va_thu(cat_nen(Image.open(vao)), canh)
    ra.parent.mkdir(parents=True, exist_ok=True)
    im.save(ra, "WEBP", quality=92, method=6)

    trong = int((np.asarray(im)[:, :, 3] == 0).mean() * 100)
    print(f"{vao.name} -> {ra}  {im.size[0]}px  {ra.stat().st_size / 1024:.1f} KB  nen trong {trong}%")


if __name__ == "__main__":
    main()
