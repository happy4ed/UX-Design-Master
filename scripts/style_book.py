#!/usr/bin/env python3
"""Merge and maintain project/user/default style guide indexes without copying images."""

from __future__ import annotations

import argparse
import os
import re
import shutil
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
DEFAULT = SKILL / "references" / "style-book"
USER = Path(os.environ.get("UX_DESIGN_MASTER_USER_STYLE_BOOK", "~/.claude/ux-design-master/style-book")).expanduser()
HEADER = "# {layer} 스타일북\n\n| ID | 표시 이름 | 분류 | 성격 | 가까운 기본 스타일 | 이미지 수 | 등록일 | 가이드 |\n|---|---|---|---|---|---:|---|---|\n"
ID_RE = re.compile(r"^[a-z][a-z0-9]*(?:-[a-z0-9]+){1,3}(?:--[a-z0-9-]+)?$")


def guides(folder: Path) -> dict[str, Path]:
    return {p.stem: p for p in folder.glob("*.md") if p.name != "README.md"} if folder.is_dir() else {}


def merged(project: Path | None, user: Path) -> dict[str, tuple[str, Path]]:
    layers = [("기본", DEFAULT), ("사용자", user)]
    if project is not None:
        layers.append(("프로젝트", project / "design" / "style-book"))
    result = {}
    for name, folder in layers:
        result.update({key: (name, path) for key, path in guides(folder).items()})
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", type=Path)
    parser.add_argument("--user-dir", type=Path, default=USER)
    parser.add_argument("--init-user", action="store_true")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--register", type=Path, help="Completed, reviewed A–L guide to copy into user layer")
    parser.add_argument("--layer", choices=("user", "project"), default="user")
    parser.add_argument("--display-name", default="")
    parser.add_argument("--category", choices=("플랫폼", "실물", "자유"), default="자유")
    parser.add_argument("--character", default="")
    parser.add_argument("--closest", default="")
    parser.add_argument("--image-count", type=int, default=0)
    parser.add_argument("--date", default="")
    args = parser.parse_args()
    user = args.user_dir.expanduser().resolve()
    if args.layer == "project" and args.project_root is None:
        parser.error("--project-root is required for project registration")
    destination = user if args.layer == "user" else args.project_root.resolve() / "design" / "style-book"
    if args.init_user or args.register:
        destination.mkdir(parents=True, exist_ok=True)
        index = destination / "README.md"
        if not index.exists():
            index.write_text(HEADER.format(layer="사용자" if args.layer == "user" else "프로젝트"), encoding="utf-8")
    if args.register:
        source = args.register.resolve()
        if not source.is_file() or source.suffix != ".md" or not ID_RE.fullmatch(source.stem):
            parser.error("guide must be an existing .md with meaningful kebab-case ID")
        if not args.display_name or not args.date or not args.character or args.image_count < 1:
            parser.error("display name, date, character and at least one evidence image are required")
        body = source.read_text(encoding="utf-8")
        if not all(f"## {letter}." in body for letter in "ABCDEFGHIJKL"):
            parser.error("reviewed guide needs A–L sections")
        if "SHA-256" not in body or not ("http" in body or "이미지" in body):
            parser.error("guide needs source image URL/path and SHA-256")
        target = destination / source.name
        if target.exists() and source != target:
            parser.error(f"ID already exists in {args.layer} layer: {target}")
        if source != target:
            shutil.copyfile(source, target)
        row = f"| {source.stem} | {args.display_name} | {args.category} | {args.character} | {args.closest or '없음'} | {args.image_count} | {args.date} | [{source.name}]({source.name}) |\n"
        index = destination / "README.md"
        lines = index.read_text(encoding="utf-8").splitlines(keepends=True)
        lines = [line for line in lines if not line.startswith(f"| {source.stem} |")]
        index.write_text("".join(lines) + row, encoding="utf-8")
        print(target)
    if args.list:
        for key, (layer, path) in sorted(merged(args.project_root, user).items()):
            first = path.read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
            print(f"{key}\t{first}\t{layer}\t{path}")
    if not (args.list or args.init_user or args.register):
        parser.print_help()


if __name__ == "__main__":
    main()
