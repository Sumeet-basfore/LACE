#!/usr/bin/env python3
"""Regression tests for layered verification (apply-check in testbed, pytest parsing)."""
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from research.phase2d.harness import (
    apply_check_in_testbed,
    build_pytest_k_expr,
    detect_docker_infra,
    extract_failure_evidence,
    parse_pytest_output,
    validate_patch_format,
)

VALID_PATCH = """diff --git a/src/flask/config.py b/src/flask/config.py
--- a/src/flask/config.py
+++ b/src/flask/config.py
@@ -234,6 +234,7 @@ class Config(dict):
         silent: bool = False,
+        text: bool = True,
     ) -> bool:
"""

MALFORMED_PATCH = "diff --git a/foo b/foo\nnot a hunk\n"

PYTEST_ALL_PASSED = """
tests/test_config.py::test_from_toml PASSED
======================== 1 passed in 0.12s ========================
EXIT:0
"""

PYTEST_TARGETED_FAILED = """
tests/test_config.py::test_from_toml FAILED
======================== 1 failed in 0.15s ========================
EXIT:1
"""

PYTEST_NO_TESTS = """
======================== no tests ran in 0.03s ========================
EXIT:5
"""

DOCKER_INFRA = """
Unable to find image 'swebench/missing:latest' locally
docker: Error response from daemon: pull access denied
"""


class TestPatchFormat(unittest.TestCase):
    def test_empty_patch(self):
        self.assertEqual(validate_patch_format(""), "EMPTY_OUTPUT")

    def test_malformed_patch_missing_hunk(self):
        self.assertEqual(validate_patch_format(MALFORMED_PATCH), "MODEL_OUTPUT_INVALID")

    def test_valid_patch_format(self):
        self.assertIsNone(validate_patch_format(VALID_PATCH))


class TestApplyCheckInTestbed(unittest.TestCase):
    @patch("research.phase2d.harness._docker_testbed_run")
    @patch("research.phase2d.harness.get_image_for_instance")
    def test_valid_patch_apply_check_ok(self, mock_image, mock_docker):
        mock_image.return_value = ("img:flask", [], [])
        mock_docker.return_value = subprocess.CompletedProcess(
            args=[], returncode=0, stdout="EXIT:0\n", stderr=""
        )
        fc, log = apply_check_in_testbed("pallets__flask-4992", VALID_PATCH, image="img:flask")
        self.assertIsNone(fc)
        self.assertIn("EXIT:0", log)

    def test_malformed_patch_skips_docker(self):
        fc, log = apply_check_in_testbed("pallets__flask-4992", MALFORMED_PATCH, image="img:flask")
        self.assertEqual(fc, "MODEL_OUTPUT_INVALID")
        self.assertEqual(log, "")

    @patch("research.phase2d.harness._docker_testbed_run")
    def test_apply_check_rejected_in_testbed(self, mock_docker):
        mock_docker.return_value = subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout="error: patch does not apply\nEXIT:1\n",
            stderr="",
        )
        fc, log = apply_check_in_testbed("pallets__flask-4992", VALID_PATCH, image="img:flask")
        self.assertEqual(fc, "MODEL_OUTPUT_INVALID")
        self.assertIn("does not apply", log)

    @patch("research.phase2d.harness._docker_testbed_run")
    def test_apply_check_docker_infra(self, mock_docker):
        mock_docker.return_value = subprocess.CompletedProcess(
            args=[], returncode=125, stdout=DOCKER_INFRA, stderr=""
        )
        fc, log = apply_check_in_testbed("pallets__flask-4992", VALID_PATCH, image="img:missing")
        self.assertEqual(fc, "INFRA_FAILURE")
        self.assertTrue(detect_docker_infra(log))


class TestPytestParsing(unittest.TestCase):
    def test_all_targeted_passed(self):
        p = parse_pytest_output(PYTEST_ALL_PASSED)
        self.assertEqual(p["status"], "all_passed")
        self.assertEqual(p["passed_count"], 1)
        self.assertEqual(p["failed_count"], 0)

    def test_targeted_failure(self):
        p = parse_pytest_output(PYTEST_TARGETED_FAILED)
        self.assertEqual(p["status"], "targeted_failed")
        self.assertEqual(p["failed_count"], 1)
        self.assertTrue(p["failed_lines"])

    def test_no_tests_collected(self):
        p = parse_pytest_output(PYTEST_NO_TESTS)
        self.assertEqual(p["status"], "no_tests_collected")

    def test_docker_infra(self):
        p = parse_pytest_output(DOCKER_INFRA)
        self.assertEqual(p["status"], "infra_failure")

    def test_loose_passed_substring_not_used(self):
        # "passed" appears in FAILED line context but summary shows failure
        out = "tests/test_x.py::test_y FAILED\n===== 1 failed, 0 passed in 0.1s =====\n"
        p = parse_pytest_output(out)
        self.assertEqual(p["status"], "targeted_failed")

    def test_extract_failure_evidence(self):
        p = parse_pytest_output(PYTEST_TARGETED_FAILED)
        ft, ass, tb = extract_failure_evidence(PYTEST_TARGETED_FAILED, p)
        self.assertIn("FAILED", ft)

    def test_build_pytest_k_expr(self):
        expr = build_pytest_k_expr(["tests/t.py::test_from_toml[param]"])
        self.assertEqual(expr, "test_from_toml")


if __name__ == "__main__":
    unittest.main()
