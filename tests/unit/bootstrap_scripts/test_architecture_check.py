#!/usr/bin/env python3
"""
Test architecture check, specifically vanilla TypeScript DIP logic.

Tests that vanilla TypeScript projects don't get false DIP violations
for direct imports from api/, services/, utils/.
"""
import sys
import pathlib
import tempfile
import json

# Add parent directory to path for imports
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent / "3_bootstrap_scripts"))


def test_vanilla_typescript_detection():
    """Test that vanilla TypeScript projects are detected correctly."""
    from architecture_check import is_vanilla_typescript_project

    # Create temporary frontend with vanilla TS (no framework)
    with tempfile.TemporaryDirectory() as tmpdir:
        frontend_dir = pathlib.Path(tmpdir) / "frontend"
        frontend_dir.mkdir()
        package_json = frontend_dir / "package.json"

        # Vanilla TS package.json (no framework)
        pkg_data = {
            "dependencies": {
                "typescript": "^5.0.0"
            },
            "devDependencies": {
                "vitest": "^1.0.0"
            }
        }
        with open(package_json, 'w') as f:
            json.dump(pkg_data, f)

        # Temporarily change to test directory
        original_cwd = pathlib.Path.cwd()
        try:
            import os
            os.chdir(tmpdir)
            result = is_vanilla_typescript_project(pathlib.Path("frontend"))
            assert result is True, "Vanilla TS project should be detected"
        finally:
            os.chdir(original_cwd)


def test_framework_typescript_detection():
    """Test that framework TypeScript projects are NOT detected as vanilla."""
    from architecture_check import is_vanilla_typescript_project

    # Create temporary frontend with React
    with tempfile.TemporaryDirectory() as tmpdir:
        frontend_dir = pathlib.Path(tmpdir) / "frontend"
        frontend_dir.mkdir()
        package_json = frontend_dir / "package.json"

        # React project package.json
        pkg_data = {
            "dependencies": {
                "react": "^18.0.0",
                "typescript": "^5.0.0"
            }
        }
        with open(package_json, 'w') as f:
            json.dump(pkg_data, f)

        # Temporarily change to test directory
        original_cwd = pathlib.Path.cwd()
        try:
            import os
            os.chdir(tmpdir)
            result = is_vanilla_typescript_project(pathlib.Path("frontend"))
            assert result is False, "React project should NOT be detected as vanilla TS"
        finally:
            os.chdir(original_cwd)


if __name__ == "__main__":
    test_vanilla_typescript_detection()
    test_framework_typescript_detection()
    print("All tests passed!")
