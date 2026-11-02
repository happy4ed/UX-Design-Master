"""Small, dependency-free sRGB ↔ OKLCH utilities for internal color proposals."""
import math
import re


def normalize_hex(value):
    if isinstance(value, str) and re.fullmatch(r"#[0-9a-fA-F]{3}", value):
        value = "#" + "".join(char * 2 for char in value[1:])
    if not isinstance(value, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ValueError(f"expected #RRGGBB: {value!r}")
    return value.upper()


def srgb_components(value):
    value = normalize_hex(value)
    return [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]


def to_linear(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def from_linear(v):
    return 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055


def hex_to_oklch(value):
    red, green, blue = map(to_linear, srgb_components(value))
    l = (0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue) ** (1 / 3)
    m = (0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue) ** (1 / 3)
    s = (0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue) ** (1 / 3)
    lightness = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    b = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return lightness, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def oklch_to_linear_rgb(lightness, chroma, hue):
    angle = math.radians(hue)
    a, b = chroma * math.cos(angle), chroma * math.sin(angle)
    l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )


def oklch_to_hex(lightness, chroma, hue):
    """Keep L and hue, reduce chroma by binary search until inside sRGB."""
    lightness = max(0, min(1, float(lightness)))
    chroma = max(0, float(chroma))
    hue = float(hue) % 360

    def in_gamut(rgb):
        return all(-1e-9 <= channel <= 1 + 1e-9 for channel in rgb)

    rgb = oklch_to_linear_rgb(lightness, chroma, hue)
    mapped_chroma = chroma
    if not in_gamut(rgb):
        low, high = 0.0, chroma
        for _ in range(36):
            middle = (low + high) / 2
            if in_gamut(oklch_to_linear_rgb(lightness, middle, hue)):
                low = middle
            else:
                high = middle
        mapped_chroma = low
        rgb = oklch_to_linear_rgb(lightness, mapped_chroma, hue)
    encoded = [max(0, min(255, round(from_linear(max(0, min(1, v))) * 255))) for v in rgb]
    value = "#" + "".join(f"{v:02X}" for v in encoded)
    actual = hex_to_oklch(value)
    return value, {"requestedC": round(chroma, 4), "mappedC": round(mapped_chroma, 4), "actualL": round(actual[0], 4), "actualC": round(actual[1], 4), "actualH": round(actual[2], 1), "gamutReduced": mapped_chroma < chroma - 0.0001}


def relative_luminance(value):
    red, green, blue = map(to_linear, srgb_components(value))
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def contrast_ratio(a, b):
    x, y = relative_luminance(a), relative_luminance(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)


def delta_oklab(a, b):
    l1, c1, h1 = hex_to_oklch(a)
    l2, c2, h2 = hex_to_oklch(b)
    a1, b1 = c1 * math.cos(math.radians(h1)), c1 * math.sin(math.radians(h1))
    a2, b2 = c2 * math.cos(math.radians(h2)), c2 * math.sin(math.radians(h2))
    return math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
