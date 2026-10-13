import os, json
from PIL import Image

SRC = "/tmp/claude-0/-home-user-goodcallai-memory/0c11a4a4-66a3-50e4-a983-80440b143027/scratchpad/pins"
OUT = "/home/user/remodel-template/assets/img"

# ---- selections -------------------------------------------------------
HERO    = [("kitchen","k15"),("home","h09"),("home","h10"),("home","h07"),("kitchen","k04")]
KITCHEN = ["k04","k06","k07","k08","k12","k15","k16","k17","k18","k19","k20"]
BATH    = ["b04","b05","b07","b11","b13","b15","b17","b18","b19","b22","b26","b27","b33","b34","b36"]
HOME    = ["h04","h05","h06","h07","h09","h10","h12","h17","h18","h28","h31","h47","h52","h54"]
PROCESS = [("kitchen","k21"),("kitchen","k23"),("kitchen","k24"),
           ("home","h02"),("home","h14"),("home","h22"),("home","h23"),
           ("home","h26"),("home","h36"),("home","h49")]

# before/after pairs -> (folder, name, orientation, label)
BA = [
 ("bath","b39","v","bath-1","t"), ("bath","b40","v","bath-2","t"), ("bath","b41","v","bath-3","t"),
 ("bath","b38","v","bath-4","b"),
 ("home","h01","v","kitchen-1","t"), ("home","h08","v","kitchen-2","t"),
 ("home","h20","v","kitchen-3","t"), ("home","h57","v","kitchen-4","t"),
 ("home","h11","v","living-1","t"),  ("home","h27","v","living-2","t"),
 ("home","h30","v","living-3","n"),  ("home","h33","v","living-4","t"),
 ("home","h34","v","living-5","t"),  ("home","h44","v","living-6","t"),
 ("home","h19","v","exterior-1","t"),("home","h48","v","exterior-2","b"),
 ("home","h37","v","exterior-3","t"),
 ("home","h16","h","living-7","t"),  ("home","h32","h","exterior-4","t"),
]

# Source images carry their own burned-in BEFORE/AFTER captions. The site draws its
# own labels, so trim the band that holds the baked-in one.
LABEL_BAND = 0.11
# a few sources carry an oversized caption badge and need a deeper trim
LABEL_BAND_OVERRIDE = {
    "bath-1": 0.18, "bath-2": 0.17, "kitchen-3": 0.18,
    "exterior-3": 0.20, "exterior-4": 0.15,
}

MAXW = 1600

def load(folder, name):
    return Image.open(f"{SRC}/{folder}/{name}.jpg").convert("RGB")

def save(im, path, maxw=MAXW):
    w, h = im.size
    if w > maxw:
        im = im.resize((maxw, round(h * maxw / w)), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path + ".jpg", quality=84, optimize=True, progressive=True)
    im.save(path + ".webp", quality=80, method=5)
    return im.size

manifest = {"hero": [], "kitchen": [], "bath": [], "home": [], "process": [], "ba": []}

for i, (folder, n) in enumerate(HERO, 1):
    s = save(load(folder, n), f"{OUT}/hero/hero-{i}")
    manifest["hero"].append({"file": f"hero/hero-{i}", "src": n, "size": s})

for key, folder, names in [("kitchen","kitchen",KITCHEN), ("bath","bath",BATH), ("home","home",HOME)]:
    for i, n in enumerate(names, 1):
        s = save(load(folder, n), f"{OUT}/{key}/{key}-{i}")
        manifest[key].append({"file": f"{key}/{key}-{i}", "src": n, "size": s})

for i, (folder, n) in enumerate(PROCESS, 1):
    s = save(load(folder, n), f"{OUT}/process/process-{i}")
    manifest["process"].append({"file": f"process/process-{i}", "src": n, "size": s})

def trim_label(im, where, label):
    w, h = im.size
    band = round(h * LABEL_BAND_OVERRIDE.get(label, LABEL_BAND))
    if where == "t":
        return im.crop((0, band, w, h))
    if where == "b":
        return im.crop((0, 0, w, h - band))
    return im

for folder, n, orient, label, where in BA:
    im = load(folder, n); w, h = im.size
    if orient == "v":
        before = im.crop((0, 0, w, h // 2)); after = im.crop((0, h // 2, w, h))
    else:
        before = im.crop((0, 0, w // 2, h)); after = im.crop((w // 2, 0, w, h))
    before = trim_label(before, where, label); after = trim_label(after, where, label)
    sb = save(before, f"{OUT}/ba/{label}-before")
    sa = save(after,  f"{OUT}/ba/{label}-after")
    manifest["ba"].append({"label": label, "src": n, "before": sb, "after": sa})

with open(f"{OUT}/manifest.json", "w") as f:
    json.dump(manifest, f, indent=1)

for k, v in manifest.items():
    print(f"{k:8} {len(v)}")

# ---- small variants (800w) for cards, galleries and before/after -------------
import glob
SMALL = 800
made = 0
for f in glob.glob(f"{OUT}/**/*.jpg", recursive=True):
    if f.endswith("-sm.jpg"):
        continue
    im = Image.open(f)
    w, h = im.size
    # always emit a -sm pair: the markup references it unconditionally
    im2 = im.resize((SMALL, round(h * SMALL / w)), Image.LANCZOS) if w > SMALL else im
    stem = f[:-4]
    im2.save(stem + "-sm.jpg", quality=80, optimize=True, progressive=True)
    im2.save(stem + "-sm.webp", quality=76, method=5)
    made += 1
print("small variants:", made)
