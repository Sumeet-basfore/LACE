# LACE Security Research — Sandbox Tests

**Status:** HYPOTHESIS · **Scope:** Test specification for verification executor isolation. No implementation yet.
**Date:** 2026-09-03 · **Track:** B — Security/Trust Validation
**Companion:** `docs/security/threat-model.md` (T1, T2, T3, T9), `docs/security/trust-boundaries.md` §2 Z4, `docs/security/security-requirements.md` (SR-T1-01, SR-T1-02, SR-T1-04, SR-T3-04, SR-T9-01, SR-T9-02)
**Predecessors:** `research/security/attack-cases.md`

---

## Purpose

Define test cases to validate that the verification executor (Z4) provides adequate isolation: throwaway container/worktree per attempt, no network egress, read-only baseline, no host privilege escalation, no destructive command execution.

---

## Sandbox Profile (Target Configuration)

| Property | Target | Rationale |
|---|---|---|
| **Runtime** | Docker container (preferred) or `git worktree` + user namespace | Container = stronger isolation; worktree = lighter, fallback |
| **Base Image** | Minimal (distroless / alpine / scratch + only test deps) | Reduce attack surface |
| **User** | Non-root (UID 1000+), no sudo, no docker group | SR-T9-01 |
| **Capabilities** | Drop all (`--cap-drop=ALL`); no `CAP_SYS_ADMIN`, `CAP_DAC_OVERRIDE` | Prevent privilege escalation |
| **Seccomp** | Default deny + allowlist (read, write, open, close, execve, exit, etc.) | Syscall filtering |
| **Filesystem** | Baseline worktree mounted **read-only**; attempt worktree read-write; `/tmp` tmpfs | SR-T1-02, isolation |
| **Network** | **None** (`--network=none`) by default; opt-in per task for deps | SR-T1-04 |
| **PIDs** | Limit (`--pids-limit=100`) | Fork bomb prevention |
| **Memory** | Limit (`--memory=2g` default) | OOM containment |
| **CPU** | Limit (`--cpus=2` default) | DoS prevention |
| **Timeout** | Wall-clock timeout per layer (L1: 10s, L2: 120s, L3: 300s) | SR-T9-04 |
| **Devices** | No device access (`--device=[]`) | Hardware isolation |
| **Volumes** | Only baseline (ro) + attempt worktree (rw) + tmpfs | No host access |
| **Environment** | Allowlist only (`PATH`, `LANG`, `CI`, task-declared) | SR-T5-04 |

---

## Test Categories

### 1. Container/Worktree Lifecycle

| Test ID | Test | Expected Result |
|---|---|---|
| SBX-LIF-01 | Container created for attempt N | Container exists, unique name/ID |
| SBX-LIF-02 | Container destroyed after attempt N | Container removed; no residue |
| SBX-LIF-03 | Worktree created for attempt N | Worktree exists at unique path |
| SBX-LIF-04 | Worktree removed after attempt N | Worktree removed; baseline untouched |
| SBX-LIF-04b | Concurrent attempts (N, N+1) | Separate containers/worktrees; no interference |
| SBX-LIF-05 | Failed attempt (crash/OOM) | Container/worktree still cleaned up |
| SBX-LIF-06 | Baseline worktree mounted read-only | Write to baseline fails with permission error |

### 2. Network Isolation

| Test ID | Test | Expected Result |
|---|---|---|
| SBX-NET-01 | `curl https://httpbin.org/get` from executor | Failure (no network) |
| SBX-NET-02 | `wget https://example.com` from executor | Failure |
| SBX-NET-03 | `nc -zv 8.8.8.8 53` (DNS) from executor | Failure |
| SBX-NET-04 | `ping 8.8.8.8` from executor | Failure (no CAP_NET_RAW) |
| SBX-NET-05 | `pip install requests` (no cache) from executor | Failure (no PyPI access) |
| SBX-NET-06 | `npm install lodash` (no cache) from executor | Failure (no npm registry) |
| SBX-NET-07 | Opt-in network for deps (if implemented) | Only allowed endpoints reachable |

### 3. Filesystem Isolation

| Test ID | Test | Expected Result |
|---|---|---|
| SBX-FS-01 | Write to baseline worktree path | Permission denied (read-only mount) |
| SBX-FS-02 | Write to attempt worktree path | Success (read-write) |
| SBX-FS-03 | Read `/etc/passwd` from executor | Allowed (world-readable) but no write |
| SBX-FS-04 | Write to `/tmp` | Success (tmpfs) |
| SBX-FS-05 | Write to `/root` or `/home/user` | Permission denied (not mounted) |
| SBX-FS-06 | Symlink in attempt worktree → `/etc/passwd`; write via symlink | Write fails or contained in worktree (no follow) |
| SBX-FS-07 | `git clean -fdx` in attempt worktree | Only attempt worktree affected; baseline intact |

### 4. Privilege / Capability Tests

| Test ID | Test | Expected Result |
|---|---|---|
| SBX-PRIV-01 | `whoami` in executor | Non-root user (e.g., `runner` UID 1000) |
| SBX-PRIV-02 | `sudo -n true` | Failure (no sudo) |
| SBX-PRIV-03 | `docker ps` | Failure (no docker socket) |
| SBX-PRIV-04 | `mount` | Failure (no CAP_SYS_ADMIN) |
| SBX-PRIV-05 | `chroot /newroot` | Failure (no CAP_SYS_CHROOT) |
| SBX-PRIV-06 | `ptrace` / `gdb` attach | Failure (no CAP_SYS_PTRACE) |
| SBX-PRIV-07 | Load kernel module | Failure (no CAP_SYS_MODULE) |
| SBX-PRIV-08 | Create raw socket | Failure (no CAP_NET_RAW) |

### 5. Resource Limits

| Test ID | Test | Expected Result |
|---|---|---|
| SBX-RES-01 | Fork bomb (`:(){ :|:& };:`) | Killed by pids limit (100) |
| SBX-RES-02 | Memory allocation >2GB | Killed by memory limit (OOM) |
| SBX-RES-03 | CPU burn (infinite loop) | Throttled by CPU limit (2 cores) |
| SBX-RES-04 | Layer 1 timeout (10s) | Process killed at 10s |
| SBX-RES-05 | Layer 2 timeout (120s) | Process killed at 120s |
| SBX-RES-06 | Layer 3 timeout (300s) | Process killed at 300s |

### 6. Destructive Command Denylist (SR-T9-02)

| Test ID | Command | Expected Result |
|---|---|---|
| SBX-DES-01 | `git push origin main` | Blocked (denylist) |
| SBX-DES-02 | `git clean -fdx` | Blocked or contained (worktree only) |
| SBX-DES-03 | `rm -rf /` | Blocked (no permission) or contained |
| SBX-DES-04 | `docker system prune -af` | Blocked (no docker socket) |
| SBX-DES-05 | `kubectl delete namespace test` | Blocked (no kubectl / no kubeconfig) |
| SBX-DES-06 | `terraform destroy -auto-approve` | Blocked (no terraform / no creds) |
| SBX-DES-07 | `npm publish` | Blocked (no network / no auth) |
| SBX-DES-08 | `pip upload` / `twine upload` | Blocked (no network / no auth) |
| SBX-DES-09 | `ssh-keygen -f /etc/ssh/ssh_host_rsa_key` | Blocked (no write to /etc) |

### 7. Environment Allowlist (SR-T5-04)

| Test ID | Test | Expected Result |
|---|---|---|
| SBX-ENV-01 | Host has `SECRET=real_secret`; executor env | `SECRET` not present |
| SBX-ENV-02 | Host has `PATH=/usr/bin`; executor env | `PATH` present (allowlisted) |
| SBX-ENV-03 | Host has `LANG=en_US.UTF-8`; executor env | `LANG` present (allowlisted) |
| SBX-ENV-04 | Host has `CI=true`; executor env | `CI` present (allowlisted) |
| SBX-ENV-05 | Task declares `NEEDS_DB_URL=true`; executor env | `DB_URL` present (task-declared) |
| SBX-ENV-06 | Task does NOT declare `AWS_KEY`; executor env | `AWS_KEY` not present |

### 8. Verification Command Allowlist

| Test ID | Command | Expected Result |
|---|---|---|
| SBX-CMD-01 | `pytest -k test_foo --json=report.json` | Allowed; produces JSON report |
| SBX-CMD-02 | `git apply --check patch.patch` | Allowed; exit code only |
| SBX-CMD-03 | `cargo test -- --test-threads=1` | Allowed; produces output |
| SBX-CMD-04 | `npm test -- --reporter=json` | Allowed; produces JSON |
| SBX-CMD-05 | `bash -c "rm -rf /"` | Blocked (shell interpolation not allowed; argv array only) |
| SBX-CMD-06 | `python -c "import os; os.system('rm -rf /')"` | Blocked (shell-out not in allowlist) |

### 9. Escape Attempts (Adversarial)

| Test ID | Attack | Expected Result |
|---|---|---|
| SBX-ESC-01 | Container escape via `cgroups` release_agent | Blocked (no CAP_SYS_ADMIN, proper cgroup config) |
| SBX-ESC-02 | Container escape via `/proc` symlink | Blocked (no CAP_DAC_OVERRIDE, hidepid) |
| SBX-ESC-03 | Worktree escape via `git worktree add ../escape` | Blocked (worktree path restricted) |
| SBX-ESC-04 | Mount namespace escape | Blocked (no CAP_SYS_ADMIN) |
| SBX-ESC-05 | User namespace escape (UID mapping) | Blocked (proper UID mapping, no root in container) |
| SBX-ESC-06 | Seccomp bypass via unsupported syscall | Blocked (default deny seccomp) |

---

## Test Fixtures

Located in `research/security/fixtures/sandbox/`:
```
fixtures/sandbox/
├── docker/
│   ├── Dockerfile.executor (minimal base + test deps)
│   ├── seccomp-profile.json
│   └── docker-compose.test.yml
├── worktree/
│   ├── baseline-repo/ (git repo with tests)
│   └── hostile-repo/ (with symlinks, hooks, hostile Makefile)
├── scripts/
│   ├── fork-bomb.sh
│   ├── memory-hog.py
│   ├── cpu-burn.sh
│   └── network-probe.sh
└── commands/
    ├── allowed-commands.json
    └── denied-commands.json
```

---

## Test Execution Plan

### Phase 1: Docker Profile Validation
- Build executor Docker image
- Run `docker run --rm --security-opt seccomp=profile.json ...` with test scripts
- Verify SBX-LIF, SBX-NET, SBX-FS, SBX-PRIV, SBX-RES, SBX-DES, SBX-ENV, SBX-CMD
- **Automated in CI:** Every commit (fast subset); full suite nightly

### Phase 2: Worktree Fallback Validation
- Run same tests using `git worktree` + user namespace (no Docker)
- Compare isolation guarantees
- Document gaps vs Docker

### Phase 3: Adversarial Escape Attempts
- Run SBX-ESC-* with escalated privileges (to verify controls work)
- Document any successful escapes
- **Manual:** Requires privileged CI runner; run pre-release

### Phase 4: Integration with Harness
- Run actual Phase 2D verification tasks in sandbox
- Verify task completion, evidence capture, cleanup
- Measure overhead (latency, memory)

---

## Metrics

| Metric | Definition | Target |
|---|---|---|
| **Container creation latency** | Time to start executor container | <2s |
| **Worktree creation latency** | Time to create attempt worktree | <0.5s |
| **Cleanup latency** | Time to destroy container/worktree | <1s |
| **Network isolation** | % of SBX-NET tests blocked | 100% |
| **Filesystem isolation** | % of SBX-FS tests contained | 100% |
| **Privilege escalation** | % of SBX-PRIV tests blocked | 100% |
| **Resource limit enforcement** | % of SBX-RES tests enforced | 100% |
| **Destructive command block** | % of SBX-DES tests blocked | 100% |
| **Env allowlist compliance** | % of SBX-ENV tests compliant | 100% |
| **Command allowlist compliance** | % of SBX-CMD tests correct | 100% |
| **Escape resistance** | SBX-ESC successful escapes | 0 (documented) |

---

## Reporting Template (for `research/security/analysis.md`)

```markdown
## Sandbox Test Results

### Docker Profile (n=X tests)
| Category | Tests | Passed | Failed | Notes |
|---|---|---|---|---|
| Lifecycle | | | | |
| Network | | | | |
| Filesystem | | | | |
| Privilege | | | | |
| Resources | | | | |
| Destructive | | | | |
| Environment | | | | |
| Commands | | | | |

### Worktree Fallback (n=X tests)
- Gaps vs Docker: [list]
- Acceptable for production: YES/NO

### Adversarial Escape (n=6)
| Attack | Result | Notes |
|---|---|---|
| cgroups release_agent | | |
| /proc symlink | | |
| Worktree escape | | |
| Mount ns escape | | |
| User ns escape | | |
| Seccomp bypass | | |

### Overhead Measurements
- Container start: ms
- Worktree create: ms
- Verification run (typical): ms
- Cleanup: ms

### Overall Assessment
- Isolation sufficient for threat model: YES/NO
- Gaps documented: YES/NO
- Ready for production: NO (HYPOTHESIS until measured)
```

---

## Limitations

- **Docker not available everywhere:** Worktree fallback needed; guarantees weaker.
- **CI runners often lack nested Docker:** GitHub Actions requires `docker: true` or self-hosted.
- **Seccomp profiles are kernel-dependent:** Test on target kernel versions.
- **Escape tests require privileged access:** Cannot run in standard CI; need dedicated environment.
- **Resource limits are best-effort:** OOM killer behavior varies.

---

## Provenance

- Derived from: `docs/security/threat-model.md` T1, T2, T3, T9, `docs/security/trust-boundaries.md` Z4, `docs/security/security-requirements.md` SR-T1-*, SR-T3-04, SR-T9-*
- Sandbox profile based on: gVisor/Kata Containers threat model, Docker security best practices, NIST SP 800-190
- Test design: Unit → Integration → Adversarial progression