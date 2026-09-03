#!/usr/bin/env python3
"""Unit tests for Phase 2D full_eval freshness guarantees."""
import json
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from research.phase2d.harness import (
    MODEL,
    build_evaluation_run_id,
    detect_evaluation_cache_hit,
    evaluation_failure_class,
    evaluation_report_path,
    full_eval,
    validate_evaluation_freshness,
)

SAMPLE_PATCH = """diff --git a/foo.py b/foo.py
--- a/foo.py
+++ b/foo.py
@@ -1 +1 @@
-x = 1
+x = 2
"""

SAMPLE_REPORT = {
    "submitted_ids": ["pallets__flask-4992"],
    "resolved_ids": ["pallets__flask-4992"],
    "infra_failure_ids": [],
}


class TestEvaluationRunId(unittest.TestCase):
    def test_run_id_includes_required_components(self):
        run_id = build_evaluation_run_id(
            "33424b751c06e621",
            "baseline",
            1,
            "pallets__flask-4992",
            now=__import__("datetime").datetime(2026, 9, 3, 12, 0, 0),
            unique="abc123def456",
        )
        self.assertIn("phase2d", run_id)
        self.assertIn("33424b751c06e621", run_id)
        self.assertIn("baseline", run_id)
        self.assertIn("a1", run_id)
        self.assertIn("pallets__flask-4992", run_id)
        self.assertIn("abc123def456", run_id)

    def test_run_ids_are_unique_per_invocation(self):
        ids = {
            build_evaluation_run_id("exp", "current", 2, "inst-1")
            for _ in range(20)
        }
        self.assertEqual(len(ids), 20)


class TestCacheHitDetection(unittest.TestCase):
    def test_detects_swebench_skip_message(self):
        stdout = "1 instances already run, skipping...\nNo instances to run.\n"
        self.assertTrue(detect_evaluation_cache_hit(stdout, ""))

    def test_clean_stdout_is_not_cache_hit(self):
        stdout = "Running 1 instances...\nAll instances run.\n"
        self.assertFalse(detect_evaluation_cache_hit(stdout, ""))


class TestValidateEvaluationFreshness(unittest.TestCase):
    def _write_report(self, work_dir, run_id, *, mtime_offset=0.0):
        report_path = evaluation_report_path(work_dir, MODEL, run_id)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(SAMPLE_REPORT))
        if mtime_offset:
            ts = time.time() + mtime_offset
            import os
            os.utime(report_path, (ts, ts))
        return report_path

    def test_rejects_cache_hit_stdout(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_id = "phase2d-exp-baseline-a1-inst-ts-uid"
            report_path = self._write_report(tmp, run_id)
            result = validate_evaluation_freshness(
                stdout="1 instances already run, skipping...\n",
                stderr="",
                report_path=report_path,
                run_id=run_id,
                instance_id="pallets__flask-4992",
                patch=SAMPLE_PATCH,
                patch_log_path=None,
                invocation_started_at=time.time(),
            )
            self.assertFalse(result["fresh"])
            self.assertTrue(result["cache_hit"])
            self.assertEqual(result["invalid_reason"], "EVALUATION_CACHE_HIT")

    def test_rejects_stale_report_mtime(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_id = "phase2d-exp-current-a2-inst-ts-uid"
            report_path = self._write_report(tmp, run_id, mtime_offset=-60.0)
            patch_log = Path(tmp) / "patch.diff"
            patch_log.write_text(SAMPLE_PATCH)
            result = validate_evaluation_freshness(
                stdout="Running 1 instances...\nAll instances run.\n",
                stderr="",
                report_path=report_path,
                run_id=run_id,
                instance_id="pallets__flask-4992",
                patch=SAMPLE_PATCH,
                patch_log_path=patch_log,
                invocation_started_at=time.time(),
            )
            self.assertFalse(result["fresh"])
            self.assertFalse(result["cache_hit"])
            self.assertEqual(result["invalid_reason"], "EVALUATION_INVALID")

    def test_accepts_fresh_report_with_matching_patch(self):
        with tempfile.TemporaryDirectory() as tmp:
            started = time.time()
            run_id = "phase2d-exp-layered-a1-inst-ts-uid"
            report_path = self._write_report(tmp, run_id)
            patch_log = Path(tmp) / "patch.diff"
            patch_log.write_text(SAMPLE_PATCH)
            result = validate_evaluation_freshness(
                stdout="Running 1 instances...\nAll instances run.\n",
                stderr="",
                report_path=report_path,
                run_id=run_id,
                instance_id="pallets__flask-4992",
                patch=SAMPLE_PATCH,
                patch_log_path=patch_log,
                invocation_started_at=started,
            )
            self.assertTrue(result["fresh"])
            self.assertFalse(result["cache_hit"])
            self.assertTrue(result["patch_verified"])

    def test_rejects_patch_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            started = time.time()
            run_id = "phase2d-exp-baseline-a1-inst-ts-uid2"
            report_path = self._write_report(tmp, run_id)
            patch_log = Path(tmp) / "patch.diff"
            patch_log.write_text("diff --git a/other.py b/other.py\n")
            result = validate_evaluation_freshness(
                stdout="Running 1 instances...\n",
                stderr="",
                report_path=report_path,
                run_id=run_id,
                instance_id="pallets__flask-4992",
                patch=SAMPLE_PATCH,
                patch_log_path=patch_log,
                invocation_started_at=started,
            )
            self.assertFalse(result["fresh"])
            self.assertEqual(result["invalid_reason"], "EVALUATION_INVALID")


class TestEvaluationFailureClass(unittest.TestCase):
    def test_cache_hit_failure_class(self):
        fc = evaluation_failure_class({
            "evaluation_fresh": False,
            "evaluation_cache_hit": True,
        })
        self.assertEqual(fc, "EVALUATION_CACHE_HIT")

    def test_fresh_eval_has_no_failure_class(self):
        self.assertIsNone(evaluation_failure_class({
            "evaluation_fresh": True,
            "evaluation_cache_hit": False,
        }))


class TestFullEvalIntegration(unittest.TestCase):
    @patch("research.phase2d.harness.subprocess.run")
    def test_full_eval_uses_unique_run_id_and_rejects_cache_hit(self, mock_run):
        run_ids = []

        def capture_run(cmd, **kwargs):
            idx = cmd.index("--run-id")
            run_ids.append(cmd[idx + 1])
            return type("R", (), {
                "stdout": "1 instances already run, skipping...\nNo instances to run.\n",
                "stderr": "",
            })()

        mock_run.side_effect = capture_run
        resolved, infra, report, log, latency, meta = full_eval(
            "pallets__flask-4992",
            SAMPLE_PATCH,
            "baseline",
            attempt=1,
            experiment_id="test-exp",
        )
        self.assertFalse(resolved)
        self.assertIsNone(report)
        self.assertFalse(meta["evaluation_fresh"])
        self.assertTrue(meta["evaluation_cache_hit"])
        self.assertEqual(evaluation_failure_class(meta), "EVALUATION_CACHE_HIT")
        self.assertEqual(len(run_ids), 1)
        self.assertIn("test-exp", run_ids[0])
        self.assertIn("baseline", run_ids[0])
        self.assertIn("a1", run_ids[0])

    @patch("research.phase2d.harness.subprocess.run")
    def test_full_eval_accepts_fresh_mocked_report(self, mock_run):
        captured = {}

        def fake_run(cmd, capture_output=True, text=True, timeout=600, cwd=None):
            idx = cmd.index("--run-id")
            run_id = cmd[idx + 1]
            report_dir = Path(cmd[cmd.index("--report-dir") + 1])
            report_path = evaluation_report_path(report_dir, MODEL, run_id)
            report_path.parent.mkdir(parents=True, exist_ok=True)
            report_path.write_text(json.dumps(SAMPLE_REPORT))
            patch_log = (
                report_dir / "logs" / "run_evaluation" / run_id
                / MODEL.replace("/", "__") / "pallets__flask-4992" / "patch.diff"
            )
            patch_log.parent.mkdir(parents=True, exist_ok=True)
            patch_log.write_text(SAMPLE_PATCH)
            captured["run_id"] = run_id
            return type("R", (), {
                "stdout": "Running 1 instances...\nAll instances run.\n",
                "stderr": "",
            })()

        mock_run.side_effect = fake_run
        resolved, infra, report, log, latency, meta = full_eval(
            "pallets__flask-4992",
            SAMPLE_PATCH,
            "current",
            attempt=2,
            experiment_id="test-exp",
        )
        self.assertTrue(resolved)
        self.assertTrue(meta["evaluation_fresh"])
        self.assertFalse(meta["evaluation_cache_hit"])
        self.assertEqual(meta["evaluation_run_id"], captured["run_id"])
        self.assertIn("pallets__flask-4992", report["resolved_ids"])


if __name__ == "__main__":
    unittest.main()
