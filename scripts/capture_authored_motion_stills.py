#!/usr/bin/env python3
"""Capture stills from this skill's own motion renderer for the sample gallery."""

import asyncio
import hashlib
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "samples/motion-stills"
MOTIONS = (
    ("line-draw", "선 그리기"),
    ("odometer-roll", "숫자 릴 굴리기"),
    ("shutter-wipe", "셔터 와이프"),
    ("brush-wipe", "붓 와이프"),
    ("kaleidoscope", "만화경"),
    ("ripple-ring", "외곽 파문"),
    ("paper-cut", "페이퍼 컷"),
)
DEFAULT_PHASES = (0.08, 0.48, 0.86)
SPECIAL_PHASES = {
    "shutter-wipe": (0.12, 0.24, 0.30),
    "brush-wipe": (0.12, 0.27, 0.42),
}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


async def capture():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    rows = []
    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            page = await browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1, reduced_motion="reduce")
            for motion_id, name in MOTIONS:
                frames = []
                for phase in SPECIAL_PHASES.get(motion_id, DEFAULT_PHASES):
                    url = f"http://127.0.0.1:{server.server_port}/samples/motion-verified-lab.html?phase={phase}#{motion_id}"
                    await page.goto(url, wait_until="networkidle")
                    await page.wait_for_function("document.querySelector('#motionName').textContent !== '모션 준비 중'")
                    observed_name = await page.locator("#motionName").inner_text()
                    if observed_name == "시연을 불러오지 못했습니다":
                        raise RuntimeError(f"renderer failed for {motion_id}: {await page.locator('#behavior').inner_text()}")
                    path = OUTPUT / f"{motion_id}-{round(phase * 100):02d}.png"
                    await page.locator("#stage").screenshot(path=str(path))
                    frames.append({"phase": phase, "file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
                rows.append({"id": motion_id, "name": name, "frames": frames})
            await browser.close()
    finally:
        server.shutdown()
        server.server_close()
    expected = {frame["file"] for row in rows for frame in row["frames"]}
    for old in OUTPUT.glob("*.png"):
        if old.name not in expected:
            old.unlink()
    manifest = {
        "schemaVersion": "1.0",
        "origin": "self-authored-renderer-capture",
        "renderer": "assets/layout/motion-verified-engine.mjs",
        "gallery": "samples/motion-verified-lab.html",
        "captureScript": "scripts/capture_authored_motion_stills.py",
        "purpose": "Representative static frames for preview; the linked HTML gallery provides the full motion.",
        "motions": rows,
    }
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"captured {sum(len(row['frames']) for row in rows)} authored motion stills")


if __name__ == "__main__":
    asyncio.run(capture())
