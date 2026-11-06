#!/usr/bin/env python3
"""Inspect screenshot color samples and repeated edge spacing without claiming tokens."""

from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--point", nargs=2, type=int, metavar=("X", "Y"), required=True)
    parser.add_argument("--dpr", type=float, default=1.0)
    parser.add_argument("--axis", choices=("x", "y"), default="x")
    args = parser.parse_args()
    if args.dpr <= 0:
        parser.error("DPR must be positive")
    with Image.open(args.image) as im:
        im = im.convert("RGB")
        x, y = args.point
        if not (2 <= x < im.width - 2 and 2 <= y < im.height - 2):
            parser.error("point needs a 2px margin")
        patch = [im.getpixel((xx, yy)) for yy in range(y - 2, y + 3) for xx in range(x - 2, x + 3)]
        rgb = tuple(int(statistics.median(values)) for values in zip(*patch))
        line = [im.getpixel((i, y)) for i in range(im.width)] if args.axis == "x" else [im.getpixel((x, i)) for i in range(im.height)]
        transitions = [i for i in range(1, len(line)) if max(abs(line[i][c] - line[i - 1][c]) for c in range(3)) >= 40]
        distances = [b - a for a, b in zip(transitions, transitions[1:]) if 2 <= b - a <= 200]
        result = {"image": str(args.image), "size_px": [im.width, im.height], "dpr_assumed": args.dpr,
                  "sample_5x5_median": "#%02X%02X%02X" % rgb, "point_px": [x, y],
                  "edge_distance_histogram_px": Counter(distances).most_common(12),
                  "edge_distance_histogram_logical": [(round(gap / args.dpr, 2), count) for gap, count in Counter(distances).most_common(12)],
                  "caveat": "Edges include text, antialiasing and image texture; inspect the image before treating any value as a component token."}
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
