#!/usr/bin/env python3
"""Tests for EOF patch normalization before structural apply gates."""
import hashlib
import re
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from research.phase2d.harness import (
    apply_check_in_testbed,
    normalize_patch,
    patch_was_normalized,
)

VALIDATION_TRANSCRIPT = (
    ROOT / "research/phase2d/raw-one-task-strategy-validation/baseline/transcript_pallets__flask-4992.txt"
)

SAMPLE_PATCH_NO_NL = "diff --git a/foo.py b/foo.py\n--- a/foo.py\n+++ b/foo.py\n@@ -1 +1 @@\n-x\n+y"
SAMPLE_PATCH_WITH_NL = SAMPLE_PATCH_NO_NL + "\n"


def load_validation_baseline_patch() -> str:
    text = VALIDATION_TRANSCRIPT.read_text()
    m = re.search(r"^PATCH:\n(.*?)\nTRANSCRIPT:", text, re.DOTALL | re.M)
    if not m:
        raise unittest.SkipTest("validation baseline transcript not available")
    return m.group(1)


class TestNormalizePatch(unittest.TestCase):
    def test_empty_patch_unchanged(self):
        self.assertEqual(normalize_patch(""), "")
        self.assertFalse(patch_was_normalized(""))

    def test_patch_with_newline_unchanged(self):
        self.assertEqual(normalize_patch(SAMPLE_PATCH_WITH_NL), SAMPLE_PATCH_WITH_NL)
        self.assertFalse(patch_was_normalized(SAMPLE_PATCH_WITH_NL))

    def test_patch_without_newline_gets_exactly_one(self):
        out = normalize_patch(SAMPLE_PATCH_NO_NL)
        self.assertTrue(out.endswith("\n"))
        self.assertEqual(out, SAMPLE_PATCH_NO_NL + "\n")
        self.assertEqual(out.count("\n"), SAMPLE_PATCH_NO_NL.count("\n") + 1)
        self.assertTrue(patch_was_normalized(SAMPLE_PATCH_NO_NL))

    def test_no_other_bytes_change(self):
        raw = load_validation_baseline_patch()
        normalized = normalize_patch(raw)
        self.assertEqual(normalized[:-1], raw)
        self.assertEqual(normalized, raw + "\n")
        self.assertNotEqual(
            hashlib.sha256(raw.encode()).hexdigest(),
            hashlib.sha256(normalized.encode()).hexdigest(),
        )
        self.assertTrue(patch_was_normalized(raw))


class TestFlaskSmokeApplyCheck(unittest.TestCase):
    @unittest.skipUnless(
        VALIDATION_TRANSCRIPT.exists() and subprocess.run(["which", "docker"], capture_output=True).returncode == 0,
        "docker or validation transcript unavailable",
    )
    @patch("research.phase2d.harness._docker_testbed_run")
    @patch("research.phase2d.harness.get_image_for_instance")
    def test_raw_validation_patch_fails_apply_check_without_normalization(self, mock_image, mock_docker):
        raw = load_validation_baseline_patch()
        self.assertFalse(raw.endswith("\n"))
        mock_image.return_value = ("img:flask", [], [])
        mock_docker.return_value = subprocess.CompletedProcess(
            args=[], returncode=0, stdout="error: corrupt patch at line 42\nEXIT:128\n", stderr=""
        )
        fc, _ = apply_check_in_testbed("pallets__flask-4992", raw, image="img:flask")
        self.assertEqual(fc, "MODEL_OUTPUT_INVALID")

    @unittest.skipUnless(
        VALIDATION_TRANSCRIPT.exists() and subprocess.run(["which", "docker"], capture_output=True).returncode == 0,
        "docker or validation transcript unavailable",
    )
    def test_normalized_validation_patch_passes_apply_check_in_testbed(self):
        raw = load_validation_baseline_patch()
        normalized = normalize_patch(raw)
        fc, log = apply_check_in_testbed("pallets__flask-4992", normalized)
        self.assertIsNone(fc, msg=log)
        self.assertIn("EXIT:0", log)


if __name__ == "__main__":
    unittest.main()
