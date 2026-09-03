#!/usr/bin/env python3
"""Patch application semantics experiment — SWE-bench Flask testbed only."""
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

ARTIFACT_ROOT = ROOT / "research/phase2d/raw-one-task-strategy-validation"
GOLD_PATCH = ROOT / "research/phase2d/fixtures/pallets__flask-4992-gold.patch"
INSTANCE_ID = "pallets__flask-4992"
TARGET_FILE = "src/flask/config.py"
OUT_JSON = ROOT / "research/phase2d/analysis/patch-application-semantics-results.json"

# Mirror SWE-bench harness apply chain (run_evaluation.py GIT_APPLY_CMDS)
SWEBENCH_APPLY_CMDS = [
    ("git_apply_verbose", "git apply --verbose /tmp/patch"),
    ("git_apply_3way", "git apply --verbose --3way /tmp/patch"),
    ("git_apply_reject", "git apply --verbose --reject /tmp/patch"),
    ("patch_fuzz5", "patch --batch --forward --fuzz=5 -p1 -i /tmp/patch"),
]

EXPERIMENT_CMDS = [
    ("git_apply_check", "git apply --check /tmp/patch"),
    *SWEBENCH_APPLY_CMDS,
]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def extract_baseline_patch() -> bytes:
    text = (ARTIFACT_ROOT / "baseline/transcript_pallets__flask-4992.txt").read_text()
    m = re.search(r"^PATCH:\n(.*?)\nTRANSCRIPT:", text, re.DOTALL | re.M)
    if not m:
        raise SystemExit("baseline patch not found in transcript")
    return m.group(1).encode()


def get_image() -> str:
    from research.phase2d.harness import get_image_for_instance
    image, _, _ = get_image_for_instance(INSTANCE_ID)
    return image


def docker_run(image: str, patch_host_path: str, inner: str, timeout: int = 180) -> subprocess.CompletedProcess:
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{patch_host_path}:/tmp/patch:ro",
        "--entrypoint", "bash",
        image, "-c", inner,
    ]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def run_case(image: str, patch_path: Path, case_name: str, apply_cmd: str) -> dict:
    inner = f"""
set -euo pipefail
cd /testbed
git checkout -- . >/dev/null 2>&1 || true
git clean -fd >/dev/null 2>&1 || true
set +e
{apply_cmd}
rc=$?
set -e
applied=0
if [ $rc -eq 0 ]; then
  applied=1
else
  reverse=$(git apply --check --reverse /tmp/patch 2>/dev/null; echo $?)
  if [ "$reverse" = "0" ]; then applied=1; fi
fi
tree_hash=$(git hash-object {TARGET_FILE} 2>/dev/null || echo MISSING)
git_diff=$(git -c core.fileMode=false diff -- {TARGET_FILE} | head -c 12000)
echo "EXIT:$rc"
echo "APPLIED:$applied"
echo "TREE_HASH:$tree_hash"
echo "GIT_DIFF_BEGIN"
echo "$git_diff"
echo "GIT_DIFF_END"
""".strip()
    r = docker_run(image, str(patch_path), inner)
    combined = (r.stdout or "") + (r.stderr or "")
    exit_m = re.search(r"EXIT:(\d+)", combined)
    applied_m = re.search(r"APPLIED:(\d+)", combined)
    tree_m = re.search(r"TREE_HASH:([0-9a-f]+|MISSING)", combined)
    diff_m = re.search(r"GIT_DIFF_BEGIN\n(.*?)GIT_DIFF_END", combined, re.DOTALL)
    return {
        "case": case_name,
        "command": apply_cmd,
        "patch_file": patch_path.name,
        "exit_code": int(exit_m.group(1)) if exit_m else r.returncode,
        "applied": bool(int(applied_m.group(1))) if applied_m else False,
        "tree_hash": tree_m.group(1) if tree_m else None,
        "stdout": (r.stdout or "")[:8000],
        "stderr": (r.stderr or "")[:8000],
        "git_diff_head": (diff_m.group(1) if diff_m else "")[:4000],
    }


def gold_tree_hash(image: str, gold_patch_path: Path) -> str:
    inner = """
cd /testbed
git checkout -- . >/dev/null 2>&1 || true
git clean -fd >/dev/null 2>&1 || true
# SWE-bench chain until one succeeds
for cmd in \
  'git apply --verbose /tmp/patch' \
  'git apply --verbose --3way /tmp/patch' \
  'git apply --verbose --reject /tmp/patch' \
  'patch --batch --forward --fuzz=5 -p1 -i /tmp/patch'; do
  if eval "$cmd"; then break; fi
  git checkout -- . >/dev/null 2>&1 || true
  git clean -fd >/dev/null 2>&1 || true
done
git hash-object src/flask/config.py
"""
    r = docker_run(image, str(gold_patch_path), inner)
    lines = [ln.strip() for ln in (r.stdout or "").splitlines() if ln.strip()]
    return lines[-1] if lines else "MISSING"


def main():
    image = get_image()
    original = extract_baseline_patch()
    with tempfile.TemporaryDirectory(prefix="phase2d-patch-semantics-") as td:
        td_path = Path(td)
        orig_path = td_path / "baseline_original.patch"
        nl_path = td_path / "baseline_plus_newline.patch"
        gold_path = td_path / "gold.patch"
        orig_path.write_bytes(original)
        nl_path.write_bytes(original + b"\n")
        gold_path.write_bytes(GOLD_PATCH.read_bytes())

        meta = {
            "instance_id": INSTANCE_ID,
            "image": image,
            "original_patch_sha256": sha256_bytes(original),
            "original_patch_bytes": len(original),
            "original_has_trailing_newline": original.endswith(b"\n"),
            "newline_patch_sha256": sha256_bytes(original + b"\n"),
            "gold_patch_sha256": sha256_bytes(gold_path.read_bytes()),
        }
        print("Resolving gold reference tree hash...", flush=True)
        meta["gold_tree_hash"] = gold_tree_hash(image, gold_path)

        results = []
        for patch_label, patch_file in [("original", orig_path), ("plus_newline", nl_path)]:
            for case_name, apply_cmd in EXPERIMENT_CMDS:
                full_case = f"{patch_label}__{case_name}"
                print(f"Running {full_case}...", flush=True)
                row = run_case(image, patch_file, full_case, apply_cmd)
                row["matches_gold_tree"] = row.get("tree_hash") == meta["gold_tree_hash"]
                results.append(row)

        payload = {"meta": meta, "results": results}
        OUT_JSON.write_text(json.dumps(payload, indent=2))
        print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
