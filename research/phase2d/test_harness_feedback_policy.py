#!/usr/bin/env python3
"""Tests for Phase 2D Ablation 1 feedback policies."""
import json
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from research.phase2d.feedback_policy import (
    build_retry_feedback,
    classify_failure,
    current_feedback,
    minimal_feedback,
    structured_feedback,
    gather_evidence,
    is_non_retryable_provider,
    MAX_MINIMAL_CHARS,
    MAX_STRUCTURED_CHARS,
)
from research.phase2d.harness import (
    patch_was_normalized,
    normalize_patch,
    patch_normalization_fields,
    ablation_max_attempts,
    ABLATION1_ARMS,
)


SAMPLE_PYTEST_LOG = """
FAILED tests/test_foo.py::test_bar - AssertionError: expected 2 got 1
tests/test_foo.py:42: AssertionError
""".strip()


class TestMinimalFeedback(unittest.TestCase):
    def test_minimal_includes_targeted_evidence_only(self):
        evidence = gather_evidence(
            patch="diff",
            eval_log="x" * 5000,
            failing_test="tests/test_foo.py::test_bar",
            assertion="AssertionError: expected 2 got 1",
            traceback='File "/testbed/foo.py", line 10, in bar',
        )
        text, meta = minimal_feedback(evidence)
        self.assertIn("Failing test:", text)
        self.assertIn("AssertionError", text)
        self.assertIn("Location:", text)
        self.assertNotIn("x" * 100, text)
        self.assertLessEqual(len(text), MAX_MINIMAL_CHARS)
        self.assertIn("failing_test", meta["evidence_categories"])

    def test_minimal_bounded_without_evidence(self):
        text, meta = minimal_feedback({})
        self.assertIn("FAIL_TO_PASS", text)
        self.assertEqual(meta["policy"], "minimal")


class TestStructuredFeedback(unittest.TestCase):
    def test_structured_test_failure_json(self):
        evidence = {
            "failing_test": "tests/test_foo.py::test_bar",
            "assertion": "AssertionError: boom",
            "location": "foo.py:10",
        }
        text, meta = structured_feedback("TEST_FAILURE", evidence)
        payload = json.loads(text)
        self.assertEqual(payload["failure_class"], "TEST_FAILURE")
        self.assertEqual(payload["failing_test"], evidence["failing_test"])
        self.assertIn("action", payload)
        self.assertLessEqual(len(text), MAX_STRUCTURED_CHARS)
        self.assertEqual(meta["policy"], "structured")

    def test_structured_patch_application(self):
        text, meta = structured_feedback(
            "PATCH_APPLICATION_FAILURE",
            {"apply_log": "error: corrupt patch at line 17"},
        )
        payload = json.loads(text)
        self.assertEqual(payload["failure_class"], "PATCH_APPLICATION_FAILURE")
        self.assertIn("complete", payload["action"].lower())


class TestProviderNonRetry(unittest.TestCase):
    def test_provider_rate_limit_no_retry(self):
        fb, meta = build_retry_feedback(
            "minimal",
            patch="",
            eval_log="",
            provider_failure={"failure_class": "PROVIDER_RATE_LIMIT", "message": "429"},
        )
        self.assertIsNone(fb)
        self.assertFalse(meta["retryable"])
        self.assertEqual(meta["failure_class"], "PROVIDER_RATE_LIMIT")

    def test_timeout_no_retry(self):
        fb, meta = build_retry_feedback(
            "structured",
            patch="diff --git a/x b/x",
            eval_log="",
            provider_failure={"failure_class": "TIMEOUT", "message": "TIMEOUT 300s"},
        )
        self.assertIsNone(fb)
        self.assertFalse(meta["retryable"])

    def test_is_non_retryable_provider(self):
        self.assertTrue(is_non_retryable_provider("PROVIDER_RATE_LIMIT"))
        self.assertFalse(is_non_retryable_provider("TEST_FAILURE"))


class TestCurrentFeedbackPreserved(unittest.TestCase):
    def test_current_uses_800_char_tail(self):
        log = "A" * 2000
        text, meta = current_feedback(log)
        self.assertEqual(len(text), 800)
        self.assertEqual(meta["policy"], "current")
        self.assertEqual(meta["evidence_categories"], ["eval_tail"])


class TestFailureClassification(unittest.TestCase):
    def test_empty_output_retryable(self):
        fc, retryable = classify_failure(
            patch="",
            resolved=False,
            infra=False,
            provider_failure=None,
            eval_invalid_reason=None,
            patch_format=None,
            apply_check=None,
        )
        self.assertEqual(fc, "EMPTY_OUTPUT")
        self.assertTrue(retryable)

    def test_evaluation_invalid_not_retryable(self):
        fc, retryable = classify_failure(
            patch="diff",
            resolved=False,
            infra=False,
            provider_failure=None,
            eval_invalid_reason="EVALUATION_CACHE_HIT",
            patch_format=None,
            apply_check=None,
        )
        self.assertEqual(fc, "EVALUATION_CACHE_HIT")
        self.assertFalse(retryable)

    def test_malformed_verification_output_generic_retry(self):
        fb, meta = build_retry_feedback(
            "minimal",
            patch="diff --git a/x b/x\n",
            eval_log="",
            failing_test="",
            assertion="",
            traceback="",
            resolved=False,
        )
        self.assertIsNotNone(fb)
        self.assertTrue(meta["retryable"])


class TestAblationArmConfig(unittest.TestCase):
    def test_four_arms(self):
        self.assertEqual(len(ABLATION1_ARMS), 4)
        self.assertEqual(ablation_max_attempts("baseline"), 1)
        self.assertEqual(ablation_max_attempts("current"), 3)
        self.assertEqual(ablation_max_attempts("minimal"), 2)
        self.assertEqual(ablation_max_attempts("structured"), 2)


class TestPatchNormalizationDistinct(unittest.TestCase):
    def test_raw_and_normalized_differ_when_eof_missing(self):
        raw = "diff --git a/x b/x\n--- a/x\n+++ b/x"
        norm = normalize_patch(raw)
        self.assertNotEqual(raw, norm)
        self.assertTrue(patch_was_normalized(raw))
        fields = patch_normalization_fields(raw)
        self.assertTrue(fields["patch_normalized"])


if __name__ == "__main__":
    unittest.main()
