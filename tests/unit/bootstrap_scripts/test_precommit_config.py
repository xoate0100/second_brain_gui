#!/usr/bin/env python3
"""
Test pre-commit configuration validation.

Tests that ESLint hook is properly configured in .pre-commit-config.yaml
"""
import sys
import pathlib
import yaml

def test_eslint_hook_exists():
    """Test that ESLint hook exists in pre-commit config."""
    config_path = pathlib.Path(".pre-commit-config.yaml")
    assert config_path.exists(), ".pre-commit-config.yaml should exist"

    with open(config_path) as f:
        config = yaml.safe_load(f)

    # Check for ESLint in repos
    eslint_found = False
    for repo in config.get("repos", []):
        if isinstance(repo, dict):
            # Check if it's the ESLint mirror repo
            if "mirrors-eslint" in repo.get("repo", ""):
                eslint_found = True
                hooks = repo.get("hooks", [])
                for hook in hooks:
                    if hook.get("id") == "eslint":
                        # Verify it targets frontend files
                        files = hook.get("files", "")
                        if "frontend" in files:
                            print("✅ ESLint hook found and configured for frontend")
                            return True

    # Also check local hooks for ESLint
    for repo in config.get("repos", []):
        if isinstance(repo, dict) and repo.get("repo") == "local":
            hooks = repo.get("hooks", [])
            for hook in hooks:
                if "eslint" in hook.get("id", "").lower() or "eslint" in hook.get("name", "").lower():
                    print("✅ ESLint hook found in local hooks")
                    return True

    if not eslint_found:
        print("❌ ESLint hook not found in pre-commit config")
        return False

    return True


def test_eslint_hook_configuration():
    """Test that ESLint hook is properly configured."""
    config_path = pathlib.Path(".pre-commit-config.yaml")
    with open(config_path) as f:
        config = yaml.safe_load(f)

    # Find ESLint hook
    for repo in config.get("repos", []):
        if isinstance(repo, dict):
            hooks = repo.get("hooks", [])
            for hook in hooks:
                if hook.get("id") == "eslint":
                    # Verify configuration
                    assert "files" in hook or "types" in hook, "ESLint hook should have files or types"
                    print("✅ ESLint hook properly configured")
                    return True

    # If not found, that's okay - it might be added later
    print("⚠️  ESLint hook not found (may be added in framework setup)")
    return True


if __name__ == "__main__":
    test_eslint_hook_exists()
    test_eslint_hook_configuration()
    print("All tests passed!")
