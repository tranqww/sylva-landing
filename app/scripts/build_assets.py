"""
Asset pipeline for the Sylva landing page.

Downloads the CC-licensed source photographs (see ATTRIBUTIONS.md), then
composites the hero "branch" artwork procedurally:

  * a swept, tapering silhouette with fractal-noise edge displacement
  * lichen bark texture mapped along the branch axis
  * cylindrical + directional shading so the branch reads as a solid volume
  * a separate moss layer with organic patch masks and a fuzzy silhouette

Bark and moss are emitted as two aligned RGBA layers so the page can animate
the moss in independently (the reference video "grows" the moss on load).

Run:  python scripts/build_assets.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request

import numpy as np
from PIL import Image, ImageFilter

# Generous, but not unbounded: the sources here are 4–7 MP, so Pillow's
# decompression-bomb guard was never going to fire on them. Disabling it
# outright only removed the one protection against a hostile or accidentally
# enormous response exhausting memory.
Image.MAX_IMAGE_PIXELS = 200_000_000

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts", ".cache")
OUT = os.path.join(ROOT, "public", "assets")
UA = "SylvaAssetPipeline/1.0 (+https://github.com/tranqww)"

# Wikimedia Commons file titles; the exact thumbnail URLs are resolved through
# the API so we never hand-craft a hash path or an unsupported thumbnail width.
SOURCES = {
    "bark.jpg": ("Lichen-Covered Tree Bark Close-Up.jpg", 2560),
    "moss.jpg": ("Green moss growing on a rock.jpg", 2048),
    "valley.jpg": ("Half Dome and Bridalveil Falls from Tunnel View "
                   "Yosemite National Park ,( 2012) (2).jpg", 2560),
}

W, H = 2400, 900          # branch canvas

# How many times each texture repeats along the branch. The texture is loaded
# pre-scaled to match this footprint so sampling stays close to 1:1.
BARK_TILES = 2.0
MOSS_TILES = 3.0
BARK_TEX = (int(W / BARK_TILES), 700)
MOSS_TEX = (int(W / MOSS_TILES), 540)


# --------------------------------------------------------------------------- io

def http(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=240) as r:
        return r.read()


def resolve(title: str, width: int) -> str:
    q = urllib.parse.quote("File:" + title)
    api = ("https://commons.wikimedia.org/w/api.php?action=query&format=json"
           f"&titles={q}&prop=imageinfo&iiprop=url&iiurlwidth={width}")
    pages = json.loads(http(api))["query"]["pages"]
    url = next(iter(pages.values()))["imageinfo"][0]["thumburl"]

    # The URL comes back over the wire and is handed straight to urlopen, whose
    # default opener also speaks file:// and ftp://. Pinning the host keeps a
    # surprising response from turning into a local file read.
    if not url.startswith("https://upload.wikimedia.org/"):
        raise ValueError(f"unexpected thumbnail host: {url}")
    return url


def fetch(name: str, title: str, width: int) -> str:
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if os.path.exists(path) and os.path.getsize(path) > 4096:
        return path
    data = http(resolve(title, width))
    with open(path, "wb") as f:
        f.write(data)
    print(f"  downloaded {name}  ({len(data) / 1024:.0f} KB)")
    return path


# ------------------------------------------------------------------------ noise

def value_noise(h: int, w: int, freq: float, seed: int,
                octaves: int = 5, persistence: float = 0.5) -> np.ndarray:
    """Fractal value noise in [0, 1], smoothstep-interpolated."""
    rng = np.random.default_rng(seed)
    total = np.zeros((h, w), np.float32)
    amp, norm, f = 1.0, 0.0, float(freq)

    for _ in range(octaves):
        gh = max(2, int(round(f))) + 1
        gw = max(2, int(round(f * w / h))) + 1
        g = rng.random((gh, gw)).astype(np.float32)

        yy = np.linspace(0, gh - 1, h, dtype=np.float32)
        xx = np.linspace(0, gw - 1, w, dtype=np.float32)
        y0, x0 = np.floor(yy).astype(np.int32), np.floor(xx).astype(np.int32)
        y1, x1 = np.minimum(y0 + 1, gh - 1), np.minimum(x0 + 1, gw - 1)
        ty, tx = yy - y0, xx - x0
        ty = (ty * ty * (3 - 2 * ty))[:, None]
        tx = (tx * tx * (3 - 2 * tx))[None, :]

        top = g[np.ix_(y0, x0)] + (g[np.ix_(y0, x1)] - g[np.ix_(y0, x0)]) * tx
        bot = g[np.ix_(y1, x0)] + (g[np.ix_(y1, x1)] - g[np.ix_(y1, x0)]) * tx
        total += (top + (bot - top) * ty) * amp

        norm += amp
        amp *= persistence
        f *= 2.0

    return total / norm


def value_noise_1d(w: int, freq: float, seed: int, octaves: int = 3) -> np.ndarray:
    """1-D fractal value noise in [0, 1].

    Not `value_noise(1, w, …)`: that derives its grid width from w/h and would
    request a control grid far wider than the output, i.e. white noise.
    """
    rng = np.random.default_rng(seed)
    out = np.zeros(w, np.float32)
    amp, norm, f = 1.0, 0.0, float(freq)

    for _ in range(octaves):
        n = max(2, int(round(f))) + 1
        g = rng.random(n).astype(np.float32)
        xx = np.linspace(0, n - 1, w, dtype=np.float32)
        i0 = np.floor(xx).astype(np.int32)
        i1 = np.minimum(i0 + 1, n - 1)
        t = xx - i0
        t = t * t * (3 - 2 * t)
        out += (g[i0] + (g[i1] - g[i0]) * t) * amp

        norm += amp
        amp *= 0.5
        f *= 2.0

    return out / norm


def smoothstep(a: float, b: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------------- texture

def tex_array(path: str, size: tuple[int, int], rotate: int = 0) -> np.ndarray:
    """Load a texture pre-scaled to roughly its on-canvas pixel density.

    Sampling a 2500px photograph down to a ~1000px footprint with point
    sampling aliases badly (it reads as vertical streaking), so the resize
    happens once, up front, with a proper filter.
    """
    im = Image.open(path).convert("RGB")
    if rotate:
        im = im.rotate(rotate, expand=True)

    # centre-crop to the target aspect first: squashing a 0.67 photo into a
    # 1.7 tile smears the bark into horizontal bands
    tw, th = size
    want = tw / th
    have = im.width / im.height
    if have > want:
        nw = int(round(im.height * want))
        left = (im.width - nw) // 2
        im = im.crop((left, 0, left + nw, im.height))
    else:
        nh = int(round(im.width / want))
        top = (im.height - nh) // 2
        im = im.crop((0, top, im.width, top + nh))

    return np.asarray(im.resize(size, Image.LANCZOS), dtype=np.float32) / 255.0


def _pingpong(t: np.ndarray) -> np.ndarray:
    """Mirror-tile a coordinate so repeats never show a seam."""
    return 1.0 - np.abs((t % 2.0) - 1.0)


def sample(tex: np.ndarray, u: np.ndarray, v: np.ndarray) -> np.ndarray:
    """Bilinear, mirror-tiled texture sample."""
    th, tw = tex.shape[:2]
    x = _pingpong(u) * (tw - 1)
    y = _pingpong(v) * (th - 1)

    x0 = np.floor(x).astype(np.int32)
    y0 = np.floor(y).astype(np.int32)
    x1 = np.minimum(x0 + 1, tw - 1)
    y1 = np.minimum(y0 + 1, th - 1)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]

    top = tex[y0, x0] * (1 - fx) + tex[y0, x1] * fx
    bot = tex[y1, x0] * (1 - fx) + tex[y1, x1] * fx
    return top * (1 - fy) + bot * fy


# ----------------------------------------------------------------------- branch

def branch_geometry(seed: int):
    """Centreline and half-width profiles, sampled once per column."""
    x = np.linspace(0.0, 1.0, W, dtype=np.float32)
    rng = np.random.default_rng(seed)

    arc = rng.uniform(0.075, 0.105)
    tilt = rng.uniform(-0.03, 0.03)
    wobble = value_noise_1d(W, 2.4, seed + 17, octaves=3) - 0.5

    cy = (0.50 + arc * np.sin(np.pi * x ** 0.85) + tilt * x + 0.030 * wobble) * H

    # near and heavy on the left, receding to the right
    taper = 1.0 - 0.63 * smoothstep(-0.05, 1.15, x)
    bulge = 1.0 + 0.055 * np.sin(x * np.pi * 2.1 + seed) + 0.035 * wobble
    hw = (0.335 * H) * taper * bulge

    return cy.astype(np.float32), hw.astype(np.float32)


def build_branch(seed: int, bark: np.ndarray, moss: np.ndarray):
    cy, hw = branch_geometry(seed)

    ys = np.arange(H, dtype=np.float32)[:, None]
    xn = (np.arange(W, dtype=np.float32) / (W - 1))[None, :]

    # u: signed cross-section coordinate. -1 is the top silhouette, +1 the belly.
    u = (ys - cy[None, :]) / hw[None, :]
    au = np.abs(u)

    # ---- silhouette --------------------------------------------------------
    # Two noise bands only: a broad one that gives the branch its irregular
    # profile and a tighter one for bark flake. Anything finer reads as fur.
    broad = value_noise(H, W, 3.5, seed + 3, octaves=3) - 0.5
    flake = value_noise(H, W, 11.0, seed + 8, octaves=2) - 0.5
    limit = 1.0 + 0.085 * broad + 0.022 * flake

    alpha = np.clip((limit - au) / 0.028 + 0.5, 0.0, 1.0)
    # Dissolve the far end instead of cutting it off at the canvas edge — the
    # limb has to be able to end mid-frame without showing a straight seam.
    xn_row = xn[0]
    fade = 1.0 - smoothstep(0.70, 1.00, xn_row + 0.06 * (value_noise_1d(W, 5.0, seed + 61) - 0.5))
    alpha = (alpha * fade[None, :]).astype(np.float32)

    # ---- bark, mapped along the branch axis --------------------------------
    bark_u = xn * BARK_TILES + 0.31 * seed
    bark_v = (u * 0.5 + 0.5) * 0.90 + 0.05 + 0.035 * (value_noise(H, W, 4.0, seed + 21, octaves=2) - 0.5)
    col = sample(bark, bark_u, bark_v)

    # ---- shading -----------------------------------------------------------
    cyl = np.sqrt(np.clip(1.0 - np.minimum(au, 1.0) ** 2, 0.0, 1.0))
    shade = 0.42 + 0.62 * cyl ** 0.55                       # cylindrical volume
    shade *= 1.0 - 0.34 * smoothstep(-0.45, 1.0, u)         # key light from above
    shade += 0.34 * np.clip(1.0 - np.abs(u + 0.55) / 0.50, 0.0, 1.0) ** 1.6   # highlight
    shade -= 0.11 * smoothstep(0.58, 1.0, u)                # contact shadow, belly
    shade += 0.06 * (value_noise(H, W, 13.0, seed + 5, octaves=3) - 0.5)
    col = np.clip(col * np.clip(shade, 0.05, 2.0)[..., None] * 1.24, 0.0, 1.0)

    # the far end dissolves into the same haze the hero fades to
    haze = smoothstep(0.30, 1.02, xn) * 0.80
    fog = np.array([0.911, 0.925, 0.917], np.float32)
    col = col * (1.0 - haze[..., None]) + fog * haze[..., None]

    # ---- moss --------------------------------------------------------------
    # Dense on the upward face, thinning toward the belly and toward both ends,
    # broken into patches so it never reads as a painted-on carpet.
    face = np.clip(1.0 - np.abs(u + 0.48) / 0.85, 0.0, 1.0) ** 0.8
    span = smoothstep(-0.04, 0.26, xn) * (1.0 - smoothstep(0.55, 1.0, xn))
    patch = value_noise(H, W, 4.0, seed + 31, octaves=3)
    grain = value_noise(H, W, 16.0, seed + 44, octaves=3)

    drive = patch * 0.62 + grain * 0.18 + face * span * 0.62
    m = smoothstep(0.44, 0.63, drive) * face

    # moss creeps a little past the bark silhouette, which softens the outline
    reach = np.clip((limit + 0.055 - au) / 0.05, 0.0, 1.0)
    moss_a = np.clip(m * reach * (1.0 - haze * 0.65), 0.0, 1.0) * fade[None, :]
    moss_a = moss_a.astype(np.float32)

    moss_col = sample(moss, xn * MOSS_TILES + 0.4 * seed,
                      (u * 0.5 + 0.5) * 1.25 + 0.17 * seed)
    mshade = 0.52 + 0.66 * cyl ** 0.6
    mshade *= 1.0 - 0.38 * smoothstep(-0.55, 0.85, u)
    moss_col = np.clip(moss_col * mshade[..., None] * 1.08, 0.0, 1.0)
    moss_col = moss_col * (1.0 - haze[..., None] * 0.85) + fog * (haze[..., None] * 0.85)

    return to_image(col, alpha), to_image(moss_col, moss_a)


def to_image(rgb: np.ndarray, alpha: np.ndarray) -> Image.Image:
    rgba = np.dstack([np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)])
    return Image.fromarray((rgba * 255).astype(np.uint8), mode="RGBA")


# ------------------------------------------------------------------------- main

def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    print("fetching sources…")
    paths = {name: fetch(name, title, w) for name, (title, w) in SOURCES.items()}

    print("loading textures…")
    bark = tex_array(paths["bark.jpg"], BARK_TEX, rotate=90)  # ridges now run along +x
    moss = tex_array(paths["moss.jpg"], MOSS_TEX)

    for i, seed in enumerate((7, 23), start=1):
        print(f"compositing branch {i}…")
        b, m = build_branch(seed, bark, moss)
        b = b.filter(ImageFilter.GaussianBlur(0.6))
        m = m.filter(ImageFilter.GaussianBlur(0.5))
        b.resize((W // 2, H // 2), Image.LANCZOS).save(
            os.path.join(OUT, f"branch-{i}.webp"), quality=88, method=6)
        m.resize((W // 2, H // 2), Image.LANCZOS).save(
            os.path.join(OUT, f"branch-{i}-moss.webp"), quality=88, method=6)

    print("processing valley photograph…")
    v = Image.open(paths["valley.jpg"]).convert("RGB")
    # Crop into the valley: the panel it fills is nearly square, and the top
    # of the frame is empty sky that only dilutes the composition.
    v = v.crop(
        (int(v.width * 0.13), int(v.height * 0.14), int(v.width * 0.81), v.height)
    )
    # The panel renders at 525 CSS px, so 1100 covers it at DPR 2 with a little
    # headroom. 1440 was ~2.8x oversampled and cost roughly 100 kB for nothing.
    v = v.resize((1100, int(1100 * v.height / v.width)), Image.LANCZOS)

    # Warm it toward the reference's low golden light and lift the shadows so
    # the overlay copy still has something to sit on.
    a = np.asarray(v, dtype=np.float32) / 255.0
    a = np.clip(a * np.array([1.075, 1.015, 0.945], np.float32) + 0.018, 0.0, 1.0)
    a = np.clip((a - 0.5) * 1.06 + 0.5, 0.0, 1.0)
    Image.fromarray((a * 255).astype(np.uint8)).save(
        os.path.join(OUT, "valley.webp"), quality=82, method=6
    )

    for f in sorted(os.listdir(OUT)):
        print(f"  {f:24} {os.path.getsize(os.path.join(OUT, f)) / 1024:7.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
