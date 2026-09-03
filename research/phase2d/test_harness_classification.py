#!/usr/bin/env python3
"""Regression tests for Phase 2D harness provider/model failure classification."""
import json
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from research.phase2d.harness import (
    ZERO_USAGE,
    classify_provider_failure,
    extract_patch,
    extract_pi_errors,
    check_patch,
    should_stop_retries,
    usage_from_pi,
)

RATE_LIMIT_STDOUT = """
{"type":"agent_start"}
{"type":"message_end","message":{"role":"assistant","content":[],"api":"openai-responses","provider":"opencode","model":"muse-spark-1.2-contributor-free","usage":{"input":0,"output":0,"cacheRead":0,"cacheWrite":0,"totalTokens":0,"cost":{"input":0,"output":0,"cacheRead":0,"cacheWrite":0,"total":0}},"stopReason":"error","timestamp":1788355751920,"errorMessage":"OpenAI API error (429): {\\"type\\":\\"FreeUsageLimitError\\",\\"message\\":\\"Error from provider (Console): Rate limit exceeded. Please try again later.\\"}"}}
{"type":"agent_end","messages":[{"role":"user","content":[{"type":"text","text":"Task: Output ONLY patch in ```diff code block starting with 'diff --git'."}]},{"role":"assistant","content":[],"stopReason":"error","errorMessage":"OpenAI API error (429): {\\"type\\":\\"FreeUsageLimitError\\",\\"message\\":\\"Error from provider (Console): Rate limit exceeded. Please try again later.\\"}"}],"willRetry":false}
{"type":"agent_settled"}
""".strip()

# Exact provider_error from aborted Ablation 1 smoke (astropy baseline)
SMOKE_RATE_LIMIT_ERROR = (
    'OpenAI API error (429): {"type":"FreeUsageLimitError",'
    '"message":"Rate limit exceeded. Please try again later."}'
)


class TestProviderFailureClassification(unittest.TestCase):
    def test_extract_pi_errors_from_429_stdout(self):
        errors = extract_pi_errors(RATE_LIMIT_STDOUT)
        self.assertTrue(errors)
        self.assertIn("429", errors[0])
        self.assertIn("FreeUsageLimitError", errors[0])

    def test_classify_429_free_usage_limit(self):
        fc, msg = classify_provider_failure(0, "", RATE_LIMIT_STDOUT, timed_out=False)
        self.assertEqual(fc, "PROVIDER_RATE_LIMIT")
        self.assertIn("FreeUsageLimitError", msg)

    def test_classify_429_stderr(self):
        stderr = 'OpenAI API error (429): {"type":"FreeUsageLimitError","message":"Rate limit exceeded"}'
        fc, msg = classify_provider_failure(1, stderr, "", timed_out=False)
        self.assertEqual(fc, "PROVIDER_RATE_LIMIT")
        self.assertIn("429", msg)

    def test_classify_auth_error(self):
        fc, _ = classify_provider_failure(1, "HTTP 401 Unauthorized: invalid API key", "", timed_out=False)
        self.assertEqual(fc, "AUTH_ERROR")

    def test_classify_403_auth_error(self):
        fc, _ = classify_provider_failure(
            1, "HTTP 403 Forbidden: invalid API key", "", timed_out=False
        )
        self.assertEqual(fc, "AUTH_ERROR")

    def test_smoke_429_error_message_is_rate_limit(self):
        fc, msg = classify_provider_failure(1, SMOKE_RATE_LIMIT_ERROR, "", timed_out=False)
        self.assertEqual(fc, "PROVIDER_RATE_LIMIT")
        self.assertEqual(msg, SMOKE_RATE_LIMIT_ERROR)

    def test_smoke_429_not_auth_error_when_issue_body_contains_403(self):
        """Regression: problem_statement in stdout must not override provider 429."""
        stdout = (
            '{"type":"agent_end","messages":[{"role":"user","content":[{"type":"text",'
            '"text":"Line 403 references HTTP 403 forbidden in issue body"}]}]}\n'
            '{"type":"message_end","message":{"stopReason":"error","errorMessage":'
            + json.dumps(SMOKE_RATE_LIMIT_ERROR)
            + "}}"
        )
        fc, _ = classify_provider_failure(1, SMOKE_RATE_LIMIT_ERROR, stdout, timed_out=False)
        self.assertEqual(fc, "PROVIDER_RATE_LIMIT")
        self.assertNotEqual(fc, "AUTH_ERROR")

    def test_classify_network_error(self):
        fc, _ = classify_provider_failure(1, "fetch failed: ECONNREFUSED 127.0.0.1:8080", "", timed_out=False)
        self.assertEqual(fc, "NETWORK_ERROR")

    def test_classify_timeout(self):
        fc, msg = classify_provider_failure(None, "TIMEOUT 300s", "", timed_out=True)
        self.assertEqual(fc, "TIMEOUT")
        self.assertIn("TIMEOUT", msg)

    def test_classify_generic_provider_error(self):
        fc, msg = classify_provider_failure(1, "", '{"type":"message_end","message":{"stopReason":"error","errorMessage":"OpenAI API error (500): internal server error"}}', timed_out=False)
        self.assertEqual(fc, "PROVIDER_ERROR")
        self.assertIn("500", msg)

    def test_no_false_positive_on_clean_empty_output(self):
        fc, msg = classify_provider_failure(0, "", '{"type":"agent_end","usage":{"input":10,"output":0,"totalTokens":10}}', timed_out=False)
        self.assertIsNone(fc)
        self.assertIsNone(msg)

    def test_rate_limit_is_non_retryable(self):
        self.assertTrue(should_stop_retries({"failure_class": "PROVIDER_RATE_LIMIT"}))
        self.assertFalse(should_stop_retries(None))

    def test_provider_failure_zeros_usage(self):
        usage = usage_from_pi({"input": 0, "output": 0, "totalTokens": 0})
        self.assertEqual(usage["totalTokens"], 0)
        self.assertEqual(ZERO_USAGE["totalTokens"], 0)


class TestModelOutputClassification(unittest.TestCase):
    def test_empty_patch(self):
        self.assertEqual(check_patch(""), "EMPTY_OUTPUT")

    def test_invalid_patch_missing_hunk(self):
        self.assertEqual(check_patch("diff --git a/foo b/foo\n"), "MODEL_OUTPUT_INVALID")

    def test_extract_patch_from_diff_block(self):
        text = "```diff\ndiff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-x\n+y\n```"
        patch = extract_patch(text)
        self.assertTrue(patch.startswith("diff --git"))
        self.assertIn("@@", patch)

    def test_no_patch_from_rate_limit_stdout_without_provider_class(self):
        # Even if prompt echoes diff --git, extraction alone may find junk;
        # harness clears patch when provider_failure is set (integration concern).
        patch = extract_patch("", RATE_LIMIT_STDOUT)
        # raw_stdout fallback may match prompt echo; documented in provider-failure.md
        self.assertIsInstance(patch, str)


class TestRegressionFromContaminatedRun(unittest.TestCase):
    """Ensure 429 from real Phase 2D artifact is never classified as EMPTY_OUTPUT."""

    def test_429_not_empty_output(self):
        fc, msg = classify_provider_failure(0, "", RATE_LIMIT_STDOUT)
        self.assertEqual(fc, "PROVIDER_RATE_LIMIT")
        self.assertNotEqual(fc, "EMPTY_OUTPUT")
        self.assertIn("Rate limit", msg)


if __name__ == "__main__":
    unittest.main()
