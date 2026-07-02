"""
- Purpose: generate production app icon assets from one master design.
- Inputs: no CLI args; writes files into build/ directory.
- Outputs: icon.svg, icon.png, icon-*.png, icons/{N}x{N}.png, icon.ico, icon.icns.
- Transparency: outside squircle is fully transparent with anti-aliased alpha.
- Quality: handset keeps readable silhouette at 16x16 and 32x32.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

MASTER_SIZE = 1024
OUTPUT_SIZES = (512, 256, 128, 64, 48, 32, 16)
LINUX_ICON_SIZES = (16, 24, 32, 48, 64, 96, 128, 256, 512)
ICO_SIZES = (16, 32, 48, 256)
ICON_SCALE_FOR_MASKS = 4

DEFAULT_PALETTE = {
    "top": (0, 122, 255),
    "bottom": (0, 84, 205),
    "diag": (38, 170, 255),
    "inner_shadow": (0, 33, 90),
    "specular": (255, 255, 255),
}

LIGHT_PALETTE = {
    "top": (78, 177, 255),
    "bottom": (18, 122, 242),
    "diag": (140, 214, 255),
    "inner_shadow": (10, 78, 160),
    "specular": (255, 255, 255),
}

DARK_PALETTE = {
    "top": (11, 66, 160),
    "bottom": (6, 31, 88),
    "diag": (36, 111, 232),
    "inner_shadow": (3, 16, 52),
    "specular": (200, 230, 255),
}


def clamp(value: float) -> int:
    return max(0, min(255, int(round(value))))


def mix_color(color_a: tuple[int, int, int], color_b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        clamp((1.0 - t) * color_a[0] + t * color_b[0]),
        clamp((1.0 - t) * color_a[1] + t * color_b[1]),
        clamp((1.0 - t) * color_a[2] + t * color_b[2]),
    )


def make_superellipse_points(size: int, inset: float, exponent: float, steps: int = 512) -> list[tuple[float, float]]:
    center = size / 2.0
    radius = center - inset
    points: list[tuple[float, float]] = []

    for index in range(steps):
        angle = 2.0 * math.pi * (index / steps)
        cos_value = math.cos(angle)
        sin_value = math.sin(angle)
        x = center + radius * math.copysign(abs(cos_value) ** (2.0 / exponent), cos_value)
        y = center + radius * math.copysign(abs(sin_value) ** (2.0 / exponent), sin_value)
        points.append((x, y))

    return points


def make_superellipse_mask(size: int, inset: float, exponent: float) -> Image.Image:
    scale = 4
    high_size = size * scale
    high_mask = Image.new("L", (high_size, high_size), 0)
    draw = ImageDraw.Draw(high_mask)
    points = make_superellipse_points(high_size, inset * scale, exponent)
    draw.polygon(points, fill=255)
    return high_mask.resize((size, size), Image.Resampling.LANCZOS)


def make_gradient_base(size: int, palette: dict[str, tuple[int, int, int]]) -> Image.Image:
    color_top = palette["top"]
    color_bottom = palette["bottom"]
    color_diag = palette["diag"]

    gradient = Image.new("RGBA", (size, size))
    pixels = gradient.load()
    max_index = max(1, size - 1)

    for y in range(size):
        for x in range(size):
            vertical_t = y / max_index
            diagonal_t = (x + y) / (2 * max_index)
            base_color = mix_color(color_top, color_bottom, vertical_t)
            final_color = mix_color(base_color, color_diag, 0.22 * (1.0 - diagonal_t))
            pixels[x, y] = (*final_color, 255)

    return gradient


def apply_gloss_and_inner_shadow(
    base: Image.Image,
    shape_mask: Image.Image,
    palette: dict[str, tuple[int, int, int]],
) -> Image.Image:
    size = base.width

    # Top gloss.
    gloss = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    gloss_draw = ImageDraw.Draw(gloss)
    gloss_box = (size * 0.10, size * 0.03, size * 0.90, size * 0.58)
    gloss_draw.ellipse(gloss_box, fill=(255, 255, 255, 110))
    gloss = gloss.filter(ImageFilter.GaussianBlur(radius=size * 0.06))
    base = Image.alpha_composite(base, gloss)

    # Soft inner shadow for raised button effect.
    eroded = shape_mask.filter(ImageFilter.MinFilter(size=37))
    ring = ImageChops.subtract(shape_mask, eroded)
    shadow = Image.new("RGBA", (size, size), (*palette["inner_shadow"], 0))
    shadow.putalpha(ring.point(lambda value: int(value * 0.40)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.018))
    base = Image.alpha_composite(base, shadow)

    # Specular highlight near top-left.
    spark = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    spark_draw = ImageDraw.Draw(spark)
    spark_draw.ellipse(
        (size * 0.17, size * 0.12, size * 0.47, size * 0.30),
        fill=(*palette["specular"], 88),
    )
    spark = spark.filter(ImageFilter.GaussianBlur(radius=size * 0.02))
    return Image.alpha_composite(base, spark)


def draw_handset(size: int) -> Image.Image:
    high_size = size * ICON_SCALE_FOR_MASKS
    handset = Image.new("RGBA", (high_size, high_size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(handset)
    lucide_points = build_lucide_phone_points()
    min_x = min(point[0] for point in lucide_points)
    max_x = max(point[0] for point in lucide_points)
    min_y = min(point[1] for point in lucide_points)
    max_y = max(point[1] for point in lucide_points)
    source_w = max_x - min_x
    source_h = max_y - min_y

    target_w = high_size * 0.51
    target_h = high_size * 0.51
    scale = min(target_w / source_w, target_h / source_h)
    offset_x = (high_size - source_w * scale) / 2.0
    offset_y = (high_size - source_h * scale) / 2.0

    transformed = [
        (
            offset_x + (x - min_x) * scale,
            offset_y + (y - min_y) * scale,
        )
        for x, y in lucide_points
    ]
    stroke = max(6, int(round(2.0 * scale)))
    draw.line(transformed, fill=(255, 255, 255, 255), width=stroke, joint="curve")

    start_x, start_y = transformed[0]
    end_x, end_y = transformed[-1]
    cap_radius = stroke * 0.5
    draw.ellipse((start_x - cap_radius, start_y - cap_radius, start_x + cap_radius, start_y + cap_radius), fill=(255, 255, 255, 255))
    draw.ellipse((end_x - cap_radius, end_y - cap_radius, end_x + cap_radius, end_y + cap_radius), fill=(255, 255, 255, 255))

    return handset.resize((size, size), Image.Resampling.LANCZOS)


def build_lucide_phone_points() -> list[tuple[float, float]]:
    commands = [
        ("M", 13.832, 16.568),
        ("a", 1, 1, 0, 0, 0, 1.213, -0.303),
        ("l", 0.355, -0.465),
        ("A", 2, 2, 0, 0, 1, 17, 15),
        ("h", 3),
        ("a", 2, 2, 0, 0, 1, 2, 2),
        ("v", 3),
        ("a", 2, 2, 0, 0, 1, -2, 2),
        ("A", 18, 18, 0, 0, 1, 2, 4),
        ("a", 2, 2, 0, 0, 1, 2, -2),
        ("h", 3),
        ("a", 2, 2, 0, 0, 1, 2, 2),
        ("v", 3),
        ("a", 2, 2, 0, 0, 1, -0.8, 1.6),
        ("l", -0.468, 0.351),
        ("a", 1, 1, 0, 0, 0, -0.292, 1.233),
        ("a", 14, 14, 0, 0, 0, 6.392, 6.384),
    ]
    x = 0.0
    y = 0.0
    points: list[tuple[float, float]] = []

    for command in commands:
        op = command[0]
        if op == "M":
            x, y = command[1], command[2]
            points.append((x, y))
        elif op == "l":
            x += command[1]
            y += command[2]
            points.append((x, y))
        elif op == "h":
            x += command[1]
            points.append((x, y))
        elif op == "v":
            y += command[1]
            points.append((x, y))
        elif op == "A":
            rx, ry, phi, large, sweep, end_x, end_y = command[1:]
            arc_points = sample_svg_arc(x, y, rx, ry, phi, int(large), int(sweep), end_x, end_y)
            points.extend(arc_points[1:])
            x, y = end_x, end_y
        elif op == "a":
            rx, ry, phi, large, sweep, dx, dy = command[1:]
            end_x = x + dx
            end_y = y + dy
            arc_points = sample_svg_arc(x, y, rx, ry, phi, int(large), int(sweep), end_x, end_y)
            points.extend(arc_points[1:])
            x, y = end_x, end_y

    return points


def sample_svg_arc(
    x1: float,
    y1: float,
    rx: float,
    ry: float,
    x_axis_rotation: float,
    large_arc_flag: int,
    sweep_flag: int,
    x2: float,
    y2: float,
) -> list[tuple[float, float]]:
    if rx == 0 or ry == 0:
        return [(x1, y1), (x2, y2)]

    phi = math.radians(x_axis_rotation % 360.0)
    cos_phi = math.cos(phi)
    sin_phi = math.sin(phi)
    dx2 = (x1 - x2) / 2.0
    dy2 = (y1 - y2) / 2.0
    x1p = cos_phi * dx2 + sin_phi * dy2
    y1p = -sin_phi * dx2 + cos_phi * dy2

    rx = abs(rx)
    ry = abs(ry)
    radius_check = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if radius_check > 1:
        factor = math.sqrt(radius_check)
        rx *= factor
        ry *= factor

    numerator = (rx * rx * ry * ry) - (rx * rx * y1p * y1p) - (ry * ry * x1p * x1p)
    denominator = (rx * rx * y1p * y1p) + (ry * ry * x1p * x1p)
    if denominator == 0:
        return [(x1, y1), (x2, y2)]
    ratio = max(0.0, numerator / denominator)
    coef = math.sqrt(ratio)
    if large_arc_flag == sweep_flag:
        coef = -coef

    cxp = coef * (rx * y1p / ry)
    cyp = coef * (-ry * x1p / rx)

    cx = cos_phi * cxp - sin_phi * cyp + (x1 + x2) / 2.0
    cy = sin_phi * cxp + cos_phi * cyp + (y1 + y2) / 2.0

    ux = (x1p - cxp) / rx
    uy = (y1p - cyp) / ry
    vx = (-x1p - cxp) / rx
    vy = (-y1p - cyp) / ry

    start_angle = math.atan2(uy, ux)
    delta_angle = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    if sweep_flag == 0 and delta_angle > 0:
        delta_angle -= 2.0 * math.pi
    if sweep_flag == 1 and delta_angle < 0:
        delta_angle += 2.0 * math.pi

    steps = max(8, int(abs(delta_angle) * 18))
    points = []
    for index in range(steps + 1):
        t = index / steps
        angle = start_angle + delta_angle * t
        x = cx + rx * math.cos(phi) * math.cos(angle) - ry * math.sin(phi) * math.sin(angle)
        y = cy + rx * math.sin(phi) * math.cos(angle) + ry * math.cos(phi) * math.sin(angle)
        points.append((x, y))
    return points


def compose_master_png(palette: dict[str, tuple[int, int, int]]) -> Image.Image:
    shape_mask = make_superellipse_mask(MASTER_SIZE, inset=36, exponent=4.8)
    base = make_gradient_base(MASTER_SIZE, palette)
    base = apply_gloss_and_inner_shadow(base, shape_mask, palette)
    base.putalpha(shape_mask)

    handset = draw_handset(MASTER_SIZE)
    handset_masked = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (255, 255, 255, 0))
    handset_masked.paste(handset, (0, 0), handset)

    return Image.alpha_composite(base, handset_masked)


def write_svg_master(target_path: Path) -> None:
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0.18" y1="0.05" x2="0.78" y2="0.95">
      <stop offset="0%" stop-color="#249DFF"/>
      <stop offset="45%" stop-color="#007AFF"/>
      <stop offset="100%" stop-color="#0058D6"/>
    </linearGradient>
    <radialGradient id="gloss" cx="0.36" cy="0.16" r="0.48">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.48"/>
      <stop offset="70%" stop-color="#FFFFFF" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="shape">
      <path d="M 150 54 C 93 54 54 93 54 150 L 54 874 C 54 931 93 970 150 970 L 874 970 C 931 970 970 931 970 874 L 970 150 C 970 93 931 54 874 54 Z"/>
    </clipPath>
  </defs>
  <path d="M 150 54 C 93 54 54 93 54 150 L 54 874 C 54 931 93 970 150 970 L 874 970 C 931 970 970 931 970 874 L 970 150 C 970 93 931 54 874 54 Z" fill="url(#bg)"/>
  <g clip-path="url(#shape)">
    <ellipse cx="512" cy="244" rx="396" ry="270" fill="url(#gloss)"/>
    <path d="M 166 867 C 239 926 783 957 887 832" fill="none" stroke="#003D98" stroke-opacity="0.28" stroke-width="42"/>
  </g>
  <g transform="translate(214 214) scale(24.8333333333)">
    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
"""
    target_path.write_text(svg_content, encoding="utf-8")


def resize_for_output(master: Image.Image, size: int) -> Image.Image:
    if size <= 32:
        return master.resize((size, size), Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(radius=0.8, percent=160, threshold=2))
    return master.resize((size, size), Image.Resampling.LANCZOS)


def save_assets(master: Image.Image, light_master: Image.Image, dark_master: Image.Image, build_dir: Path) -> None:
    master_path = build_dir / "icon.png"
    master.save(master_path, format="PNG")

    sized_images: dict[int, Image.Image] = {}
    for size in OUTPUT_SIZES:
        resized = resize_for_output(master, size)
        resized.save(build_dir / f"icon-{size}.png", format="PNG")
        sized_images[size] = resized

    ico_source = sized_images[256]
    ico_source.save(build_dir / "icon.ico", format="ICO", sizes=[(size, size) for size in ICO_SIZES])
    master.save(build_dir / "icon.icns", format="ICNS")

    theme_icons_dir = build_dir / "theme-icons"
    theme_icons_dir.mkdir(parents=True, exist_ok=True)
    dark_master.resize((256, 256), Image.Resampling.LANCZOS).save(
        theme_icons_dir / "icon-dark.png",
        format="PNG",
    )
    light_master.resize((256, 256), Image.Resampling.LANCZOS).save(
        theme_icons_dir / "icon-light.png",
        format="PNG",
    )

    linux_icons_dir = build_dir / "icons"
    linux_icons_dir.mkdir(parents=True, exist_ok=True)
    for size in LINUX_ICON_SIZES:
        resize_for_output(master, size).save(
            linux_icons_dir / f"{size}x{size}.png",
            format="PNG",
        )


def run() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    build_dir = root_dir / "build"
    build_dir.mkdir(parents=True, exist_ok=True)

    write_svg_master(build_dir / "icon.svg")
    master = compose_master_png(DEFAULT_PALETTE)
    light_master = compose_master_png(LIGHT_PALETTE)
    dark_master = compose_master_png(DARK_PALETTE)
    save_assets(master, light_master, dark_master, build_dir)


if __name__ == "__main__":
    run()
