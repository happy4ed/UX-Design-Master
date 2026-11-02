"""Audit a production design-system manifest and trace token changes to surfaces.

This checks declared relationships, not CSS rendering or visual quality.
"""

import argparse
import json
from collections import defaultdict
from pathlib import Path

TIERS = {"primitive", "semantic", "component"}


def issue(items, code, location, message):
    items.append({"code": code, "at": location, "message": message})


def as_map(value, errors, location):
    if not isinstance(value, dict):
        issue(errors, "INVALID_SHAPE", location, "object가 필요합니다.")
        return {}
    return value


def as_list(value, errors, location):
    if not isinstance(value, list):
        issue(errors, "INVALID_SHAPE", location, "array가 필요합니다.")
        return []
    return value


def token_targets(token, themes):
    if not isinstance(token, dict):
        return {}
    if isinstance(token.get("refs"), dict):
        return {theme: token["refs"].get(theme) for theme in themes}
    return {theme: token.get("ref") for theme in themes}


def audit(data):
    errors, warnings = [], []
    if not isinstance(data, dict):
        return {"status": "FAIL", "errors": [{"code": "INVALID_SHAPE", "at": "$", "message": "object가 필요합니다."}], "warnings": [], "summary": {}}
    themes = as_list(data.get("themes", ["default"]), errors, "themes")
    if not themes or any(not isinstance(t, str) or not t for t in themes) or len(themes) != len(set(themes)):
        issue(errors, "INVALID_THEMES", "themes", "중복 없는 theme 이름이 하나 이상 필요합니다.")
        themes = ["default"]
    tokens = as_map(data.get("tokens"), errors, "tokens")
    components = as_map(data.get("components"), errors, "components")
    surfaces = as_list(data.get("surfaces"), errors, "surfaces")

    edges = defaultdict(set)
    for name, token in tokens.items():
        loc = f"tokens.{name}"
        if not isinstance(name, str) or not name or not isinstance(token, dict):
            issue(errors, "INVALID_TOKEN", loc, "토큰 이름과 정의가 필요합니다.")
            continue
        tier, kind = token.get("tier"), token.get("type")
        if tier not in TIERS or not isinstance(kind, str) or not kind:
            issue(errors, "INVALID_TOKEN", loc, "tier와 type을 지정하세요.")
            continue
        if tier == "primitive":
            if "value" not in token or token["value"] is None:
                issue(errors, "MISSING_VALUE", loc, "기초 토큰에는 value가 필요합니다.")
            if "ref" in token or "refs" in token:
                issue(errors, "PRIMITIVE_ALIAS", loc, "기초 토큰은 다른 토큰을 참조하지 않습니다.")
            continue
        if "value" in token:
            issue(warnings, "RAW_VALUE", loc, "의미/컴포넌트 토큰의 직접 값을 검토하세요.")
        if "ref" in token and "refs" in token:
            issue(errors, "AMBIGUOUS_REF", loc, "ref와 refs를 동시에 사용하지 마세요.")
        refs = token_targets(token, themes)
        if isinstance(token.get("refs"), dict):
            for extra in set(token["refs"]) - set(themes):
                issue(warnings, "UNUSED_THEME", loc, f"선언되지 않은 theme: {extra}")
        for theme, target in refs.items():
            where = f"{loc}@{theme}"
            if not isinstance(target, str) or not target:
                issue(errors, "MISSING_THEME_REF", where, "이 theme의 참조가 없습니다.")
                continue
            edges[name].add(target)
            if target not in tokens or not isinstance(tokens[target], dict):
                issue(errors, "UNKNOWN_REF", where, f"없는 토큰: {target}")
                continue
            parent = tokens[target]
            if parent.get("type") != kind:
                issue(errors, "TYPE_MISMATCH", where, f"{target}의 type이 다릅니다.")
            parent_tier = parent.get("tier")
            if tier == "semantic" and parent_tier == "component":
                issue(errors, "REVERSE_TIER", where, "의미 토큰은 컴포넌트 토큰을 참조할 수 없습니다.")
            if tier == "component" and parent_tier == "primitive":
                issue(warnings, "DIRECT_PRIMITIVE", where, "컴포넌트 슬롯이 기초 값을 직접 참조합니다. 의미 토큰 또는 예외 이유를 기록하세요.")

    # A theme can be valid even when the union of different theme graphs cycles.
    for theme in themes:
        visiting, visited, cycle_keys = set(), set(), set()

        def walk(name, path):
            if name in visiting:
                cycle = path[path.index(name):]
                signature = tuple(sorted(set(cycle)))
                if signature not in cycle_keys:
                    cycle_keys.add(signature)
                    issue(errors, "ALIAS_CYCLE", f"tokens.{name}@{theme}", " → ".join(cycle))
                return
            if name in visited:
                return
            visiting.add(name)
            token = tokens[name]
            if isinstance(token, dict) and token.get("tier") != "primitive":
                target = token_targets(token, [theme]).get(theme)
                if isinstance(target, str) and target in tokens:
                    walk(target, path + [target])
            visiting.remove(name)
            visited.add(name)

        for name in tokens:
            walk(name, [name])

    component_tokens = {}
    for name, comp in components.items():
        loc = f"components.{name}"
        if not isinstance(comp, dict):
            issue(errors, "INVALID_COMPONENT", loc, "object가 필요합니다.")
            continue
        used = as_list(comp.get("tokens", []), errors, f"{loc}.tokens")
        component_tokens[name] = set()
        if not used:
            issue(warnings, "NO_COMPONENT_TOKENS", loc, "사용하는 토큰이 기록되지 않았습니다.")
        for token_name in used:
            if not isinstance(token_name, str) or token_name not in tokens:
                issue(errors, "UNKNOWN_COMPONENT_TOKEN", loc, f"없는 토큰: {token_name}")
            else:
                component_tokens[name].add(token_name)
                if tokens[token_name].get("tier") == "primitive":
                    issue(warnings, "DIRECT_PRIMITIVE", loc, f"기초 토큰 {token_name}을 직접 사용합니다.")
        for axis in ("variants", "states"):
            values = comp.get(axis, [])
            if not isinstance(values, list) or any(not isinstance(v, str) or not v for v in values) or len(values) != len(set(values)):
                issue(errors, "INVALID_AXIS", f"{loc}.{axis}", "중복 없는 이름의 배열이어야 합니다.")

    surface_ids = set()
    surface_to_components = defaultdict(set)
    surface_to_tokens = defaultdict(set)
    for surface in surfaces:
        if not isinstance(surface, dict) or not isinstance(surface.get("id"), str) or not surface["id"]:
            issue(errors, "INVALID_SURFACE", "surfaces", "각 화면/페이지에 id가 필요합니다.")
            continue
        sid = surface["id"]
        if sid in surface_ids:
            issue(errors, "DUPLICATE_SURFACE", sid, "화면/페이지 ID가 중복되었습니다.")
        surface_ids.add(sid)
        instances = as_list(surface.get("instances", []), errors, f"surfaces.{sid}.instances")
        instance_ids = set()
        for instance in instances:
            if not isinstance(instance, dict):
                issue(errors, "INVALID_INSTANCE", sid, "인스턴스는 object여야 합니다.")
                continue
            iid, cname = instance.get("id"), instance.get("component")
            loc = f"surfaces.{sid}.{iid or '<id 없음>'}"
            if not isinstance(iid, str) or not iid or iid in instance_ids:
                issue(errors, "INVALID_INSTANCE_ID", loc, "화면 안에서 고유한 인스턴스 ID가 필요합니다.")
            if isinstance(iid, str):
                instance_ids.add(iid)
            if not isinstance(cname, str) or cname not in components:
                issue(errors, "UNKNOWN_COMPONENT", loc, f"없는 컴포넌트: {cname}")
                continue
            surface_to_components[sid].add(cname)
            comp = components[cname] if isinstance(components[cname], dict) else {}
            surface_to_tokens[sid].update(component_tokens.get(cname, ()))
            for axis, singular in (("variants", "variant"), ("states", "state")):
                allowed = comp.get(axis, [])
                chosen = instance.get(singular)
                if chosen is not None and isinstance(allowed, list) and chosen not in allowed:
                    issue(errors, "UNKNOWN_VARIANT_STATE", loc, f"{singular}={chosen}이(가) 컴포넌트 계약에 없습니다.")
                if chosen is None and isinstance(allowed, list) and len(allowed) > 1:
                    issue(warnings, "UNSPECIFIED_VARIANT_STATE", loc, f"{singular} 선택이 기록되지 않았습니다.")
            explicit = instance.get("tokens", [])
            if not isinstance(explicit, list):
                issue(errors, "INVALID_INSTANCE_TOKENS", loc, "tokens는 배열이어야 합니다.")
                explicit = []
            for token_name in explicit:
                if not isinstance(token_name, str) or token_name not in tokens:
                    issue(errors, "UNKNOWN_INSTANCE_TOKEN", loc, f"없는 토큰: {token_name}")
                else:
                    surface_to_tokens[sid].add(token_name)
                    if token_name not in component_tokens.get(cname, set()):
                        issue(warnings, "UNDECLARED_COMPONENT_TOKEN", loc, f"{token_name}이(가) 컴포넌트 계약에 없습니다.")

    pairs = data.get("contrastPairs", [])
    if not isinstance(pairs, list):
        issue(errors, "INVALID_SHAPE", "contrastPairs", "array가 필요합니다.")
        pairs = []
    for index, pair in enumerate(pairs):
        loc = f"contrastPairs[{index}]"
        if not isinstance(pair, dict):
            issue(errors, "INVALID_PAIR", loc, "foreground/background 쌍이 필요합니다.")
            continue
        for role in ("foreground", "background"):
            target = pair.get(role)
            if not isinstance(target, str) or target not in tokens:
                issue(errors, "UNKNOWN_PAIR_TOKEN", loc, f"{role} 토큰이 없습니다: {target}")
            elif isinstance(tokens[target], dict) and tokens[target].get("type") != "color":
                issue(errors, "PAIR_TYPE", loc, f"{role}는 color 토큰이어야 합니다.")
    declared_pairs = {
        (pair.get("foreground"), pair.get("background"))
        for pair in pairs if isinstance(pair, dict)
        and isinstance(pair.get("foreground"), str)
        and isinstance(pair.get("background"), str)
    }
    for cname, used in component_tokens.items():
        for fg in used:
            if fg.endswith(".foreground"):
                bg = fg[:-len(".foreground")] + ".background"
                if bg in used and (fg, bg) not in declared_pairs:
                    issue(warnings, "UNPAIRED_COLOR_ROLE", f"components.{cname}", f"{fg} / {bg}의 전경·배경 짝을 contrastPairs에 기록하세요.")
    if not pairs and any(isinstance(t, dict) and t.get("type") == "color" for t in tokens.values()):
        issue(warnings, "NO_CONTRAST_PAIRS", "contrastPairs", "사용하는 전경/배경 역할쌍을 기록해 실제 렌더에서 대비를 확인하세요.")
    if not surfaces:
        issue(warnings, "NO_SURFACES", "surfaces", "화면/페이지 사용 맵이 비어 있습니다.")

    return {
        "status": "FAIL" if errors else "WARN" if warnings else "PASS",
        "errors": errors,
        "warnings": warnings,
        "summary": {"themes": len(themes), "tokens": len(tokens), "components": len(components), "surfaces": len(surfaces)},
        "graph": {"edges": {k: sorted(v) for k, v in edges.items()}, "componentTokens": {k: sorted(v) for k, v in component_tokens.items()}, "surfaceComponents": {k: sorted(v) for k, v in surface_to_components.items()}, "surfaceTokens": {k: sorted(v) for k, v in surface_to_tokens.items()}},
    }


def changes(before, after):
    old, new = before.get("tokens", {}), after.get("tokens", {})
    old = old if isinstance(old, dict) else {}
    new = new if isinstance(new, dict) else {}
    return {"added": sorted(set(new) - set(old)), "removed": sorted(set(old) - set(new)), "changed": sorted(k for k in set(old) & set(new) if old[k] != new[k])}


def affected(data, changed_names):
    report = audit(data)
    graph = report["graph"]
    edges = graph["edges"]
    reached = set(changed_names)
    while True:
        found = {name for name, targets in edges.items() if set(targets) & reached}
        if found <= reached:
            break
        reached.update(found)
    comps = {name for name, used in graph["componentTokens"].items() if set(used) & reached}
    surfaces = {name for name, used in graph["surfaceTokens"].items() if set(used) & reached}
    surfaces.update(name for name, used in graph["surfaceComponents"].items() if set(used) & comps)
    return {"tokens": sorted(reached), "components": sorted(comps), "surfaces": sorted(surfaces)}


def main():
    parser = argparse.ArgumentParser(description="제작 중 토큰 연결·사용 맵·변경 영향 검사")
    parser.add_argument("--input", required=True, help="현재 제작 명세 JSON")
    parser.add_argument("--baseline", help="변경 영향 비교용 이전 명세 JSON")
    parser.add_argument("--strict", action="store_true", help="경고가 있으면 종료 코드 1")
    args = parser.parse_args()
    current = json.loads(Path(args.input).read_text(encoding="utf-8"))
    result = audit(current)
    if args.baseline:
        old = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
        delta = changes(old, current)
        old_impact = affected(old, delta["removed"] + delta["changed"])
        new_impact = affected(current, delta["added"] + delta["changed"])
        result["diff"] = {**delta, "affected": {key: sorted(set(old_impact[key]) | set(new_impact[key])) for key in ("tokens", "components", "surfaces")}}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["errors"] or (args.strict and result["warnings"]):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
