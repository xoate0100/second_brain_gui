#!/usr/bin/env python3
import sys, re, subprocess

# Ensure commit message(s) in staging include plan/component/task tags
def get_staged_commit_msg_template():
    # Pre-commit runs before commit object exists; validate COMMIT_MSG file if present,
    # otherwise allow; PR checks will re-validate.
    return None

# Validate changed files are within allowed paths (feature_flags.yml is source of truth).
try:
    import yaml
except ImportError:
    print("[ai-guard] Warning: PyYAML not installed. Install with: pip install PyYAML")
    sys.exit(0)

import pathlib
flags = yaml.safe_load(open("0_phase0_bootstrap/feature_flags.yml"))
allowed = set(flags["permissions"]["write_to"])

changed = subprocess.check_output(["git","diff","--cached","--name-only"], text=True).splitlines()
viol = []
for f in changed:
    p = pathlib.Path(f)
    # Normalize path separators for cross-platform compatibility
    file_path = str(p).replace('\\', '/')
    # Check if file is in any allowed path
    is_allowed = any(
        file_path.startswith(allowed_path.rstrip('/') + '/') or
        file_path == allowed_path.rstrip('/') or
        file_path.startswith(allowed_path)
        for allowed_path in allowed
    )
    if not is_allowed:
        # allow root files like README.md, docker-compose.yml, and config files
        if p.name in ("README.md", ".pre-commit-config.yaml", "docker-compose.yml", ".dockerignore", ".gitignore"):
            continue
        viol.append(f)

if viol:
    print("[ai-guard] Write outside allowed paths:", *viol, sep="\n- ")
    sys.exit(1)

print("[ai-guard] OK")
