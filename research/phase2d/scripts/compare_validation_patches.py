#!/usr/bin/env python3
"""Read-only patch comparison for verification-disagreement analysis."""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from research.phase2d.harness import extract_patch

ARTIFACT_ROOT = ROOT / "research/phase2d/raw-one-task-strategy-validation"


def sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def extract_baseline_patch(text: str) -> str:
    m = re.search(r"^PATCH:\n(.*?)\nTRANSCRIPT:", text, re.DOTALL | re.M)
    return m.group(1) if m else ""


def extract_current_patch(text: str) -> str:
    m = re.search(r"^ATTEMPT 1 PATCH:\n(.*?)\nTRANSCRIPT:", text, re.DOTALL | re.M)
    return m.group(1) if m else ""


def extract_layered_patches(text: str) -> dict[int, str]:
    out = {}
    for m in re.finditer(
        r"ATTEMPT (\d+) PATCH:\n(.*?)\nTRANSCRIPT:",
        text,
        re.DOTALL,
    ):
        out[int(m.group(1))] = m.group(2)
    return out


def extract_transcript_patch(text: str) -> str:
    m = re.search(r"TRANSCRIPT:\n```diff\n(.*?)```", text, re.DOTALL)
    if not m:
        m = re.search(r"TRANSCRIPT:\n(.*?)(?:\n===== ATTEMPT =====|\Z)", text, re.DOTALL)
    block = m.group(1) if m else ""
    return extract_patch(block)


def analyze_patch(name: str, patch: str) -> dict:
    lines = patch.splitlines()
    hunks = [i for i, ln in enumerate(lines) if ln.startswith("@@")]
    last_hunk = hunks[-1] if hunks else None
    trailing = lines[last_hunk:] if last_hunk is not None else lines
    return {
        "name": name,
        "bytes": len(patch.encode()),
        "lines": len(lines),
        "sha256": sha256_text(patch),
        "has_index_line": any(ln.startswith("index ") for ln in lines[:5]),
        "hunk_count": len(hunks),
        "last_line": lines[-1] if lines else "",
        "ends_mid_hunk": bool(lines and not lines[-1].startswith(("+", "-", " ", "diff", "---", "+++", "@@", "index"))),
        "truncated_no_closing_context": bool(
            lines and lines[-1].startswith(" ") and "errno" in lines[-1]
        ),
        "hunk_headers": [lines[i] for i in hunks],
    }


def main():
    baseline_t = (ARTIFACT_ROOT / "baseline/transcript_pallets__flask-4992.txt").read_text()
    current_t = (ARTIFACT_ROOT / "current/transcript_pallets__flask-4992.txt").read_text()
    layered_t = (ARTIFACT_ROOT / "layered/transcript_pallets__flask-4992.txt").read_text()

    patches = {
        "baseline_logged": extract_baseline_patch(baseline_t),
        "current_logged": extract_current_patch(current_t),
        **{f"layered_a{n}_logged": p for n, p in extract_layered_patches(layered_t).items()},
    }

    # Re-extract from TRANSCRIPT blocks where possible
    patches["baseline_reextract"] = extract_transcript_patch(baseline_t)
    patches["current_reextract"] = extract_transcript_patch(current_t)

    analyses = [analyze_patch(k, v) for k, v in patches.items()]
    print(json.dumps({"patches": analyses}, indent=2))

    base = patches["baseline_logged"]
    keys = list(patches.keys())
    print("\nPAIRWISE_EQUAL_TO_BASELINE:")
    for k in keys:
        if k == "baseline_logged":
            continue
        p = patches[k]
        print(f"  {k}: bytes_equal={p == base} sha_equal={sha256_text(p) == sha256_text(base)}")

    # First differing line vs baseline
    print("\nFIRST_DIFF_VS_BASELINE:")
    for k in keys:
        if k == "baseline_logged":
            continue
        p = patches[k]
        bl = base.splitlines()
        pl = p.splitlines()
        for i, (a, b) in enumerate(zip(bl, pl)):
            if a != b:
                print(f"  {k} line {i+1}: baseline={a!r} other={b!r}")
                break
        else:
            if len(bl) != len(pl):
                print(f"  {k}: same prefix; len baseline={len(bl)} other={len(pl)}")


if __name__ == "__main__":
    main()
