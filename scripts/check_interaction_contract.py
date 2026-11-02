#!/usr/bin/env python3
"""Check that every interactive component instance has an explicit input contract."""

import argparse
import json
from pathlib import Path

MODES = ("clickTap", "hover", "longPress", "dragDrop", "swipe", "keyboard")
STATUSES = {"supported", "unsupported", "conditional", "unknown"}


def validate(data):
    errors = []
    stage = data.get("stage")
    if stage not in {"analysis", "design"}:
        errors.append("stage must be analysis or design")
    components = data.get("components")
    if not isinstance(components, list) or not components:
        return errors + ["components must be a nonempty list"]
    seen = set()
    for index, component in enumerate(components):
        label = f"components[{index}]"
        if not isinstance(component, dict):
            errors.append(f"{label}: must be an object")
            continue
        component_id = component.get("id")
        if not isinstance(component_id, str) or not component_id.strip():
            errors.append(f"{label}: id required")
        elif component_id in seen:
            errors.append(f"{label}: duplicate id {component_id}")
        else:
            seen.add(component_id)
        for field in ("screen", "role", "variant", "hitArea", "stateChange", "conflicts", "verification"):
            if not isinstance(component.get(field), str) or not component[field].strip():
                errors.append(f"{label}: {field} required")
        modes = component.get("modes", {})
        if not isinstance(modes, dict):
            errors.append(f"{label}: modes must be an object")
            continue
        for mode in MODES:
            item = modes.get(mode)
            if not isinstance(item, dict):
                errors.append(f"{label}: {mode} contract required")
                continue
            status = item.get("status")
            if status not in STATUSES:
                errors.append(f"{label}: {mode} invalid status")
            if status == "unknown" and stage == "design":
                errors.append(f"{label}: {mode} unknown is not allowed in design")
            if not isinstance(item.get("behavior"), str) or not item["behavior"].strip():
                errors.append(f"{label}: {mode} behavior/reason required")
            if status == "conditional" and not item.get("condition"):
                errors.append(f"{label}: {mode} condition required")
        drag = modes.get("dragDrop") or {}
        if isinstance(drag, dict) and drag.get("status") in {"supported", "conditional"}:
            for field in ("dragStart", "dropTarget", "cancel", "nonDragAlternative"):
                if not isinstance(component.get(field), str) or not component[field].strip():
                    errors.append(f"{label}: {field} required for dragDrop")
        long_press = modes.get("longPress") or {}
        if isinstance(long_press, dict) and long_press.get("status") in {"supported", "conditional"}:
            for field in ("longPressThreshold", "longPressAlternative"):
                if not isinstance(component.get(field), str) or not component[field].strip():
                    errors.append(f"{label}: {field} required for longPress")
        hover = modes.get("hover") or {}
        if hover.get("status") in {"supported", "conditional"} and not component.get("hoverAlternative"):
            errors.append(f"{label}: hoverAlternative required")
        swipe = modes.get("swipe") or {}
        if swipe.get("status") in {"supported", "conditional"} and not component.get("nonSwipeAlternative"):
            errors.append(f"{label}: nonSwipeAlternative required")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    errors = validate(data)
    if errors:
        for error in errors:
            print("FAIL", error)
        raise SystemExit(1)
    print(f"PASS {len(data['components'])} interaction contracts complete (field validation only)")


if __name__ == "__main__":
    main()
