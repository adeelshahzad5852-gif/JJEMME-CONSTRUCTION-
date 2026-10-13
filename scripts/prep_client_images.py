"""Put JJEMME's own photos into the template, but only where theirs are better.

Their Google profile is 77 photos, mostly demo, jobsite and in-progress shots.
Those make a site look worse, not more credible. Seven are genuinely good —
finished kitchens and hardscape — and only those go in. Everything else keeps
the stock photo. The hero stays stock: none of theirs is landscape.
"""
import os
from PIL import Image, ImageOps

SRC = "/tmp/claude-0/-home-user/0c11a4a4-66a3-50e4-a983-80440b143027/scratchpad/jjemme"
OUT = "/home/user/jjemme-site/assets/img"

# (file, batch folder, template slot)
SWAPS = [
    ("h29", "raw2", "kitchen/kitchen-6"),  # finished kitchen, quartz run and sink
    ("h54", "raw2", "kitchen/kitchen-1"),  # finished kitchen, dishwasher and counter
    ("g08", "raw",  "kitchen/kitchen-3"),  # the wide finished kitchen
    ("h30", "raw2", "home/home-5"),        # raised planters, cacti, pavers — their best photo
    ("h34", "raw2", "home/home-1"),        # front entry, pavers between turf strips
    ("h41", "raw2", "home/home-2"),        # lawn and ramada, wide
    ("g10", "raw",  "process/process-3"),  # a real jobsite: demo, ladder, open doorway
]

MAXW, SMALL = 1600, 800


def crop_43(im):
    """Template slots are 4:3. Phone shots are tall, so bias the crop upward —
    the work is above the floor."""
    w, h = im.size
    target = 4 / 3
    if w / h > target:
        nw = round(h * target)
        left = round((w - nw) / 2)
        return im.crop((left, 0, left + nw, h))
    nh = round(w / target)
    top = round((h - nh) * 0.30)
    return im.crop((0, top, w, top + nh))


def save(im, stem, width, qj, qw):
    w, h = im.size
    v = im.resize((width, round(h * width / w)), Image.LANCZOS) if w > width else im
    v.save(stem + ".jpg", quality=qj, optimize=True, progressive=True)
    v.save(stem + ".webp", quality=qw, method=6)
    return v.size


for name, folder, slot in SWAPS:
    im = ImageOps.exif_transpose(Image.open(f"{SRC}/{folder}/{name}.jpg")).convert("RGB")
    im = crop_43(im)
    full = save(im, f"{OUT}/{slot}", MAXW, 84, 80)
    save(im, f"{OUT}/{slot}-sm", SMALL, 80, 76)
    print(f"{name} -> {slot:22} {full[0]}x{full[1]}")
