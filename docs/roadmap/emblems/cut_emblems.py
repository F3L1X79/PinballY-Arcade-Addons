# Cuts the 12 rank emblems out of the owner's sheet (4 columns from Bronze
# to Platinum; in each, grey, with halo, in colour without halo) onto one
# 256 x 256 transparent canvas each. The halos of two columns touch on the
# sheet: each halo is kept up to KEEP_R, then fades out in its own colour,
# which also drops the cut-out's fringes. Needs ImageMagick; not run by
# PinballY nor by the tests.
# Usage: python3 docs/roadmap/emblems/cut_emblems.py docs/roadmap/emblems/sheet.png assets
import math, re, subprocess, sys
SHEET, OUT = sys.argv[1], sys.argv[2]
W, H = map(int, subprocess.run(["identify", "-format", "%w %h", SHEET], capture_output=True, text=True, check=True).stdout.split())
SIDE = 416
raw = subprocess.run(["convert", SHEET, "-depth", "8", "rgba:-"], capture_output=True, check=True).stdout
px = lambda x, y: raw[4 * (y * W + x): 4 * (y * W + x) + 4] if 0 <= x < W and 0 <= y < H else b"\0\0\0\0"

# The 12 solid emblems (alpha 90 %): 4 columns from Bronze to Platinum,
# each grey, with halo, small from top to bottom.
listing = subprocess.run(["convert", SHEET, "-alpha", "extract", "-threshold", "90%", "-define", "connected-components:verbose=true",
                          "-define", "connected-components:area-threshold=3000", "-connected-components", "8", "null:"],
                         capture_output=True, text=True, check=True).stdout
boxes = []
for line in listing.splitlines():
    m = re.search(r"(\d+)x(\d+)\+(\d+)\+(\d+) .*gray\(255\)", line)
    if m:
        w, h, x, y = map(int, m.groups())
        boxes.append((x, y, w, h))
assert len(boxes) == 12, boxes
boxes.sort(key=lambda b: b[0] + b[2] / 2)
COLUMNS = {}
for rank, i in zip(["bronze", "silver", "gold", "platinum"], range(0, 12, 3)):
    COLUMNS[rank] = sorted(boxes[i:i + 3], key=lambda b: b[1] + b[3] / 2)
# The original halo is kept up to KEEP_R: past the wing tips, short of the
# next column's glow.
KEEP_R = 166
WING_MAX_R = 190
FADE_WIDTH = 16
DILATE = 4

def crop(cx, cy):
    x0, y0 = cx - SIDE // 2, cy - SIDE // 2
    return [bytearray(px(x0 + i, y0 + j)) for j in range(SIDE) for i in range(SIDE)]

def save(pixels, name):
    data = b"".join(bytes(p) for p in pixels)
    subprocess.run(["convert", "-size", f"{SIDE}x{SIDE}", "-depth", "8", "rgba:-", "-filter", "Lanczos",
                    "-resize", "256x256", "-strip", "-define", "png:color-type=6", f"{OUT}/{name}.png"], input=data, check=True)

def only_emblem(pixels):
    # Keeps the solid component under the centre, grown by DILATE pixels.
    solid = [p[3] >= 230 for p in pixels]
    c = SIDE // 2
    start = min((k for k in range(len(solid)) if solid[k]), key=lambda k: (k % SIDE - c) ** 2 + (k // SIDE - c) ** 2)
    keep = [False] * len(solid)
    stack = [start]
    keep[start] = True
    while stack:
        k = stack.pop()
        x, y = k % SIDE, k // SIDE
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                n = (y + dy) * SIDE + x + dx
                if 0 <= x + dx < SIDE and 0 <= y + dy < SIDE and solid[n] and not keep[n]:
                    keep[n] = True
                    stack.append(n)
    for _ in range(DILATE):
        grown = keep[:]
        for k in range(len(keep)):
            if keep[k]:
                x, y = k % SIDE, k // SIDE
                for n in (k - 1 if x else k, k + 1 if x < SIDE - 1 else k, k - SIDE if y else k, k + SIDE if y < SIDE - 1 else k):
                    grown[n] = True
        keep = grown
    return [p if keep[k] else bytearray(4) for k, p in enumerate(pixels)]

def halo(pixels):
    # Beyond KEEP_R, each ray goes on in the halo's own colour at KEEP_R,
    # fading out, so the edge stays continuous and nothing of the next
    # column's glow or of the cut-out fringes remains.
    c = SIDE / 2
    def edge_at(angle):
        near = [pixels[int(c + r * math.sin(angle + d)) * SIDE + int(c + r * math.cos(angle + d))]
                for r in range(KEEP_R - 3, KEEP_R + 1) for d in (-0.01, 0, 0.01)]
        return [sum(p[i] for p in near) / len(near) for i in range(4)]
    edges = {}
    # How far a wing tip reaches along a ray past KEEP_R, without a gap (so
    # another emblem of the sheet never counts): its pixels stay.
    def wing_reach(angle):
        reach = KEEP_R
        for r in range(KEEP_R, WING_MAX_R + 1):
            q = pixels[int(c + r * math.sin(angle)) * SIDE + int(c + r * math.cos(angle))]
            if not (q[3] >= 230 and luma(q) < 0.85 * luma(glow)):
                break
            reach = r + 1
        return reach
    # A ray through a wing tip is darker than the glow: it takes the glow's
    # mean colour and opacity instead, so the wing does not streak outwards.
    luma = lambda e: 0.3 * e[0] + 0.59 * e[1] + 0.11 * e[2]
    all_edges = [edge_at(math.radians(step / 2)) for step in range(-360, 360, 4)]
    glow = [sum(e[i] * e[3] for e in all_edges) / sum(e[3] for e in all_edges) for i in range(3)]
    lit_alphas = sorted(e[3] for e in all_edges if luma(e) >= 0.85 * luma(glow))
    glow_alpha = lit_alphas[len(lit_alphas) // 2]
    out = []
    for k, p in enumerate(pixels):
        dx, dy = k % SIDE + 0.5 - c, k // SIDE + 0.5 - c
        r = math.hypot(dx, dy)
        if r <= KEEP_R:
            out.append(p)
            continue
        step = round(math.degrees(math.atan2(dy, dx)) * 2)
        if step not in edges:
            edge = edge_at(math.radians(step / 2))
            edges[step] = (edge if luma(edge) >= 0.85 * luma(glow) else [*glow, glow_alpha], wing_reach(math.radians(step / 2)))
        (red, green, blue, alpha), reach = edges[step]
        if r <= reach:
            out.append(p)
            continue
        a = alpha * math.exp(-((r - KEEP_R) / FADE_WIDTH) ** 2)
        out.append(bytearray([round(red), round(green), round(blue), round(a)]) if a >= 1 else bytearray(4))
    return out, None, KEEP_R

for rank, (grey, lit, small) in COLUMNS.items():
    centre = lambda b: (b[0] + b[2] // 2, b[1] + b[3] // 2)
    save(only_emblem(crop(*centre(grey))), f"rank_{rank}_missing")
    save(only_emblem(crop(*centre(small))), f"rank_{rank}_small")
    pixels, _, _ = halo(crop(*centre(lit)))
    save(pixels, f"rank_{rank}")
