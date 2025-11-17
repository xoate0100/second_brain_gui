#!/usr/bin/env python3
"""
Test feature flags validation and loading.

Tests that feature flags can be temporarily modified for framework setup
and that validation scripts can handle the modified flags correctly.
"""
import sys
import pathlib
import yaml
import tempfile
import shutil

# Add parent directory to path for imports
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent.parent.parent / "3_bootstrap_scripts"))


def test_load_feature_flags():
    """Test that feature flags can be loaded from YAML file."""
    flags_path = pathlib.Path("0_phase0_bootstrap/feature_flags.yml")
    assert flags_path.exists(), "feature_flags.yml should exist"

    flags = yaml.safe_load(open(flags_path))
    assert flags is not None, "Feature flags should load successfully"
    assert "mode" in flags, "Feature flags should have 'mode' section"
    assert "permissions" in flags, "Feature flags should have 'permissions' section"
    assert "components" in flags, "Feature flags should have 'components' section"


def test_feature_flags_temporary_modification():
    """Test that feature flags can be temporarily modified."""
    flags_path = pathlib.Path("0_phase0_bootstrap/feature_flags.yml")
    original_flags = yaml.safe_load(open(flags_path))

    # Create temporary copy
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as tmp:
        yaml.dump(original_flags, tmp)
        tmp_path = pathlib.Path(tmp.name)

    try:
        # Modify temporarily
        modified_flags = yaml.safe_load(open(tmp_path))
        modified_flags["mode"]["modify_meta_framework"] = True
        modified_flags["permissions"]["write_to"].append("0_phase0_bootstrap/")
        modified_flags["permissions"]["write_to"].append("5_reference_architectures/")

        # Save modified version
        with open(tmp_path, 'w') as f:
            yaml.dump(modified_flags, f)

        # Verify modification
        loaded = yaml.safe_load(open(tmp_path))
        assert loaded["mode"]["modify_meta_framework"] is True
        assert "0_phase0_bootstrap/" in loaded["permissions"]["write_to"]
        assert "5_reference_architectures/" in loaded["permissions"]["write_to"]

    finally:
        # Cleanup
        tmp_path.unlink()


def test_coverage_threshold_loading():
    """Test that coverage thresholds can be loaded correctly."""
    flags_path = pathlib.Path("0_phase0_bootstrap/feature_flags.yml")
    flags = yaml.safe_load(open(flags_path))

    frontend_threshold = flags.get("components", {}).get("frontend", {}).get("coverage_threshold")
    assert frontend_threshold is not None, "Frontend coverage threshold should exist"
    assert isinstance(frontend_threshold, int), "Coverage threshold should be an integer"
    assert 0 <= frontend_threshold <= 100, "Coverage threshold should be between 0 and 100"


if __name__ == "__main__":
    test_load_feature_flags()
    test_feature_flags_temporary_modification()
    test_coverage_threshold_loading()
    print("All tests passed!")
