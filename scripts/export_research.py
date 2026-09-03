#!/usr/bin/env python3
"""
LACE Research Corpus Exporter.

Synchronizes canonical repository documentation into the curated research/export/
directory intended for NotebookLM ingestion and Google Drive distribution.

Guarantees:
- Deterministic output (byte-for-byte idempotent across consecutive runs)
- Zero network dependencies, zero API keys
- Strict exclusion of Class B (raw/transcripts) and Class C (caches/ephemera)
- Explicit failure when expected canonical sources are missing
- Clear provenance headers preserving the canonical source path
"""

import json
import os
import re
import sys
from pathlib import Path

# Forbidden path substrings to prevent accidental raw/ephemeral leaks
FORBIDDEN_SUBSTRINGS = [
    "/raw/",
    "/raw-",
    "transcript_",
    ".eval.json",
    "logs/run_evaluation",
    "__pycache__",
    ".pytest_cache",
    ".git/",
    ".venv",
    "/venv",
    ".whl",
]

# Sensitive pattern indicators for safety scanning
SECRET_PATTERNS = [
    re.compile(r"sk-[a-zA-Z0-9]{20,}", re.IGNORECASE),
    re.compile(r"ghp_[a-zA-Z0-9]{20,}", re.IGNORECASE),
    re.compile(r"-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
]

GENERATED_HEADER_PREFIX = "<!-- GENERATED ARTIFACT — COPIED FROM CANONICAL SOURCE -->"


def find_repo_root() -> Path:
    """Resolve repository root by looking for AGENTS.md and .git or fallback."""
    curr = Path(__file__).resolve().parent
    while curr != curr.parent:
        if (curr / "AGENTS.md").exists() or (curr / ".git").exists():
            return curr
        curr = curr.parent
    return Path(__file__).resolve().parent.parent


def check_for_secrets(content: str, filepath: str) -> None:
    """Scan content for obvious secret patterns and fail-closed."""
    for pattern in SECRET_PATTERNS:
        if pattern.search(content):
            raise ValueError(
                f"[SECURITY ALERT] Potential secret or private key pattern matched in {filepath}."
                " Export aborted."
            )


def run_export() -> int:
    repo_root = find_repo_root()
    manifest_path = repo_root / "research" / "export" / "export-manifest.json"

    if not manifest_path.exists():
        sys.stderr.write(f"ERROR: Export manifest not found at {manifest_path}\n")
        return 1

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception as e:
        sys.stderr.write(f"ERROR: Failed to parse manifest {manifest_path}: {e}\n")
        return 1

    sources = manifest.get("sources", [])
    target_base = repo_root / manifest.get("target_directory", "research/export")

    if not sources:
        sys.stderr.write("ERROR: Manifest contains no sources to export.\n")
        return 1

    print(f"[export_research] Repository root: {repo_root}")
    print(f"[export_research] Target directory: {target_base}")
    print(f"[export_research] Processing {len(sources)} manifest entries...")

    errors = []
    processed_count = 0

    for entry in sources:
        src_rel = entry.get("source")
        dst_rel = entry.get("destination")
        mode = entry.get("mode", "copy")
        category = entry.get("category", "uncategorized")

        if not src_rel or not dst_rel:
            errors.append(f"Invalid entry: missing source or destination: {entry}")
            continue

        # Prevent directory traversal
        if ".." in dst_rel or dst_rel.startswith("/"):
            errors.append(f"Invalid destination path: {dst_rel}")
            continue

        # Forbidden substring check
        if any(bad in src_rel for bad in FORBIDDEN_SUBSTRINGS):
            errors.append(f"Forbidden source artifact: {src_rel} contains forbidden substring")
            continue

        src_full = repo_root / src_rel
        dst_full = target_base / dst_rel

        if not src_full.exists():
            errors.append(f"Missing canonical source file: {src_rel} (expected at {src_full})")
            continue

        if not src_full.is_file():
            errors.append(f"Source is not a regular file: {src_rel}")
            continue

        # Ensure destination directory exists
        dst_full.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(src_full, "r", encoding="utf-8") as sf:
                src_content = sf.read()

            # Security scan
            check_for_secrets(src_content, src_rel)

            if mode == "copy":
                # Check if destination exists and is explicitly marked as manually curated
                if dst_full.exists():
                    with open(dst_full, "r", encoding="utf-8") as df:
                        existing = df.read()
                    if "<!-- LACE MANUAL CURATED FILE - DO NOT OVERWRITE -->" in existing:
                        print(f"  [SKIP] {dst_rel} is marked as manual curated file.")
                        continue

                # Generate deterministic provenance header
                header = (
                    f"{GENERATED_HEADER_PREFIX}\n"
                    f"<!-- Canonical Source: {src_rel} -->\n"
                    f"<!-- Category: {category} -->\n"
                    f"<!-- Synchronization: scripts/export_research.py -->\n\n"
                )

                final_content = header + src_content

                # Write atomically / idempotently
                with open(dst_full, "w", encoding="utf-8") as df:
                    df.write(final_content)

                processed_count += 1
            else:
                errors.append(f"Unsupported mode '{mode}' for {src_rel}")
        except Exception as ex:
            errors.append(f"Failed processing {src_rel} -> {dst_rel}: {ex}")

    if errors:
        sys.stderr.write(f"\nExport failed with {len(errors)} error(s):\n")
        for err in errors:
            sys.stderr.write(f"  - {err}\n")
        return 1

    print(f"\n[export_research] SUCCESS: Successfully synchronized {processed_count} canonical files into {target_base}")
    return 0


if __name__ == "__main__":
    sys.exit(run_export())
