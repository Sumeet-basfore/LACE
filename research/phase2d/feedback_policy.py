"""Feedback construction for Phase 2D Ablation 1 recovery arms."""
from __future__ import annotations

import json
import re
from typing import Any

MAX_MINIMAL_CHARS = 1200
MAX_STRUCTURED_CHARS = 2000

PROVIDER_FAILURE_CLASSES = frozenset({
    "PROVIDER_RATE_LIMIT",
    "PROVIDER_ERROR",
    "AUTH_ERROR",
    "NETWORK_ERROR",
    "TIMEOUT",
})

NON_RETRYABLE_FAILURE_CLASSES = PROVIDER_FAILURE_CLASSES | frozenset({
    "INFRA_FAILURE",
    "EVALUATION_CACHE_HIT",
    "EVALUATION_INVALID",
})


def current_feedback(eval_log: str) -> tuple[str, dict[str, Any]]:
    """Batch 1 Current arm: generic 800-char eval tail."""
    text = (eval_log or "")[-800:]
    if not text.strip():
        text = "Previous patch did not resolve FAIL_TO_PASS. Try different approach."
    meta = {
        "policy": "current",
        "feedback_bytes": len(text.encode("utf-8")),
        "evidence_categories": ["eval_tail"],
    }
    return text, meta


def extract_location(traceback: str, failing_test: str = "") -> str:
    """Best-effort file:line from pytest traceback."""
    for line in (traceback or "").splitlines():
        m = re.search(r'File "([^"]+)", line (\d+)', line)
        if m:
            path = m.group(1)
            if "/testbed/" in path:
                path = path.split("/testbed/", 1)[-1]
            return f"{path}:{m.group(2)}"
    if failing_test and "::" in failing_test:
        parts = failing_test.split("::")
        if len(parts) >= 2:
            return f"{parts[0]}::{parts[1]}"
    return ""


def gather_evidence(
    *,
    patch: str,
    eval_log: str,
    failing_test: str = "",
    assertion: str = "",
    traceback: str = "",
    apply_log: str = "",
) -> dict[str, str]:
    location = extract_location(traceback, failing_test)
    return {
        "failing_test": (failing_test or "").strip(),
        "assertion": (assertion or "").strip()[:300],
        "location": location,
        "traceback": (traceback or "").strip()[:500],
        "apply_log": (apply_log or "").strip()[:300],
        "eval_summary": (eval_log or "").strip()[-400:],
    }


def classify_failure(
    *,
    patch: str,
    resolved: bool,
    infra: bool,
    provider_failure: dict | None,
    eval_invalid_reason: str | None,
    patch_format: str | None,
    apply_check: str | None,
    failing_test: str = "",
    eval_log: str = "",
) -> tuple[str, bool]:
    """
    Classify verification outcome before retry.
    Returns (failure_class, retryable).
    """
    if provider_failure:
        return provider_failure["failure_class"], False
    if eval_invalid_reason in ("EVALUATION_CACHE_HIT", "EVALUATION_INVALID"):
        return eval_invalid_reason, False
    if infra:
        return "INFRA_FAILURE", False
    if resolved:
        return "NONE", False
    if not (patch or "").strip():
        return "EMPTY_OUTPUT", True
    if patch_format:
        return "PATCH_APPLICATION_FAILURE", True
    if apply_check:
        return "PATCH_APPLICATION_FAILURE", True
    lower = (eval_log or "").lower()
    if any(x in lower for x in ("hunk #", "patch failed", "can't find file", "no file to patch")):
        return "PATCH_APPLICATION_FAILURE", True
    if failing_test and any(x in failing_test.lower() for x in ("wrong file", "wrong_file")):
        return "WRONG_FILE", True
    if "wrong file" in lower or "unexpected file" in lower:
        return "WRONG_FILE", True
    return "TEST_FAILURE", True


def minimal_feedback(evidence: dict[str, str]) -> tuple[str, dict[str, Any]]:
    """Bounded minimal targeted evidence — no full problem statement."""
    categories = []
    lines = []
    if evidence.get("failing_test"):
        lines.append(f"Failing test: {evidence['failing_test']}")
        categories.append("failing_test")
    if evidence.get("assertion"):
        lines.append(f"Error: {evidence['assertion']}")
        categories.append("assertion")
    if evidence.get("location"):
        lines.append(f"Location: {evidence['location']}")
        categories.append("location")
    elif evidence.get("traceback"):
        tb_line = next((ln for ln in evidence["traceback"].splitlines() if ln.strip()), "")
        if tb_line:
            lines.append(f"Traceback: {tb_line[:200]}")
            categories.append("traceback")
    if not lines and evidence.get("apply_log"):
        lines.append(f"Patch error: {evidence['apply_log'][:200]}")
        categories.append("apply_log")
    if not lines:
        lines.append("Previous patch did not pass FAIL_TO_PASS tests.")
        categories.append("generic")
    text = "\n".join(lines)[:MAX_MINIMAL_CHARS]
    meta = {
        "policy": "minimal",
        "feedback_bytes": len(text.encode("utf-8")),
        "evidence_categories": categories,
    }
    return text, meta


def structured_feedback(failure_class: str, evidence: dict[str, str]) -> tuple[str, dict[str, Any]]:
    """Failure-class-aware structured payload (bounded JSON text)."""
    categories = ["failure_class"]
    payload: dict[str, Any] = {
        "failure_class": failure_class,
        "instruction": "Produce a corrected unified diff only. Must apply with git apply.",
    }
    if failure_class == "TEST_FAILURE":
        if evidence.get("failing_test"):
            payload["failing_test"] = evidence["failing_test"]
            categories.append("failing_test")
        if evidence.get("assertion"):
            payload["assertion"] = evidence["assertion"]
            categories.append("assertion")
        if evidence.get("location"):
            payload["location"] = evidence["location"]
            categories.append("location")
        payload["action"] = "Fix the failing test without unrelated changes."
    elif failure_class == "PATCH_APPLICATION_FAILURE":
        payload["action"] = "Emit a complete valid unified diff hunk; ensure paths and context match the repository."
        if evidence.get("apply_log"):
            payload["apply_error"] = evidence["apply_log"][:200]
            categories.append("apply_log")
    elif failure_class == "EMPTY_OUTPUT":
        payload["action"] = "Output a non-empty unified diff in a ```diff block starting with diff --git."
    elif failure_class == "WRONG_FILE":
        payload["action"] = "Modify the file that contains the failing logic, not an unrelated file."
        if evidence.get("failing_test"):
            payload["failing_test"] = evidence["failing_test"]
            categories.append("failing_test")
    else:
        payload["action"] = "Address the verification failure and output only a corrected patch."
        if evidence.get("failing_test"):
            payload["failing_test"] = evidence["failing_test"]
            categories.append("failing_test")

    text = json.dumps(payload, indent=2)
    if len(text) > MAX_STRUCTURED_CHARS:
        text = json.dumps({k: payload[k] for k in list(payload)[:5]}, indent=2)[:MAX_STRUCTURED_CHARS]
    meta = {
        "policy": "structured",
        "failure_class": failure_class,
        "feedback_bytes": len(text.encode("utf-8")),
        "evidence_categories": categories,
    }
    return text, meta


def build_retry_feedback(
    policy: str,
    *,
    patch: str,
    eval_log: str,
    failing_test: str = "",
    assertion: str = "",
    traceback: str = "",
    apply_log: str = "",
    provider_failure: dict | None = None,
    eval_invalid_reason: str | None = None,
    resolved: bool = False,
    infra: bool = False,
    patch_format: str | None = None,
    apply_check: str | None = None,
) -> tuple[str | None, dict[str, Any]]:
    """
    Build retry feedback for policy in {current, minimal, structured}.
    Returns (feedback_text, meta) or (None, meta) when non-retryable.
    """
    failure_class, retryable = classify_failure(
        patch=patch,
        resolved=resolved,
        infra=infra,
        provider_failure=provider_failure,
        eval_invalid_reason=eval_invalid_reason,
        patch_format=patch_format,
        apply_check=apply_check,
        failing_test=failing_test,
        eval_log=eval_log,
    )
    meta: dict[str, Any] = {
        "policy": policy,
        "failure_class": failure_class,
        "retryable": retryable,
        "evidence_categories": [],
        "feedback_bytes": 0,
    }
    if not retryable or failure_class in NON_RETRYABLE_FAILURE_CLASSES:
        meta["retryable"] = False
        return None, meta

    evidence = gather_evidence(
        patch=patch,
        eval_log=eval_log,
        failing_test=failing_test,
        assertion=assertion,
        traceback=traceback,
        apply_log=apply_log,
    )

    if policy == "current":
        text, fb_meta = current_feedback(eval_log)
    elif policy == "minimal":
        text, fb_meta = minimal_feedback(evidence)
    elif policy == "structured":
        text, fb_meta = structured_feedback(failure_class, evidence)
    else:
        raise ValueError(f"unknown policy: {policy}")

    meta.update(fb_meta)
    meta["failure_class"] = failure_class
    meta["retryable"] = True
    return text, meta


def is_non_retryable_provider(failure_class: str | None) -> bool:
    return failure_class in PROVIDER_FAILURE_CLASSES
