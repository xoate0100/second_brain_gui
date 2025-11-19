# Comprehensive Docker Diagnostics Script

## Overview
The `docker_comprehensive_diagnostics.ps1` script is an enhanced diagnostic tool specifically designed for troubleshooting Docker command issues in PowerShell 7 within Cursor IDE. It provides comprehensive testing, validation, and logging with advanced timeout handling, progress indicators, and pattern testing.

## Features

### Core Capabilities
- **90-Second Timeout Protection**: All commands are protected with a 90-second timeout (configurable) to prevent hanging
- **Multiple Execution Methods**: Tests commands using Job, Process, and CMD wrapper methods
- **PowerShell Pattern Testing**: Validates common PowerShell patterns like `2>&1` with various filters
- **Edge Case Testing**: Tests problematic Docker commands and scenarios
- **Comprehensive Logging**: Detailed logs with timestamps, levels, and full output capture
- **Progress Indicators**: Real-time progress bars and status updates
- **Silent Output Detection**: Identifies when commands complete but produce no visible output
- **No Hanging**: Script continues execution even if individual commands timeout

### What It Tests

1. **File Location Validation**
   - Docker executables (docker.exe, docker-compose.exe)
   - Docker configuration files (docker-compose.yml, Dockerfiles)
   - Docker Desktop installation paths
   - Common installation locations

2. **Tool Version Validation**
   - PowerShell version and edition
   - Docker version (client and server)
   - Docker Compose version
   - WSL version
   - Git version

3. **Environment Statistics**
   - System information (OS, memory, CPU)
   - PowerShell environment (execution policy, host info)
   - PATH environment variable analysis
   - Docker environment variables
   - Disk space on all drives
   - Network adapter status
   - Docker process information
   - User permissions (administrator check)

4. **PowerShell Pattern Testing**
   - Basic `2>&1` redirection
   - `2>&1` with `Where-Object` filter
   - `2>&1` with `Select-String`
   - `ErrorActionPreference` with `2>&1`
   - `Out-String` with `2>&1`
   - `Tee-Object` with `2>&1`
   - CMD wrapper method
   - Direct Process method
   - Job method (default)

5. **Edge Case Testing**
   - `docker ps` (known problematic command)
   - `docker ps` with CMD wrapper
   - `docker info` (daemon connection)
   - `docker context ls`
   - `docker ps -a`
   - `docker images`
   - `docker network ls`
   - `docker volume ls`
   - Invalid command handling
   - Long-running command timeout

## Usage

### Basic Usage
```powershell
.\scripts\docker_comprehensive_diagnostics.ps1
```

### With Custom Output Directory
```powershell
.\scripts\docker_comprehensive_diagnostics.ps1 -OutputDir "custom_debug_logs"
```

### With Custom Timeout
```powershell
.\scripts\docker_comprehensive_diagnostics.ps1 -CommandTimeout 120
```

### With Verbose Output
```powershell
.\scripts\docker_comprehensive_diagnostics.ps1 -Verbose
```

## Parameters

- **OutputDir** (string, default: "debug_logs"): Directory where diagnostic logs will be saved
- **CommandTimeout** (int, default: 90): Timeout in seconds for each diagnostic command
- **Verbose** (switch): Enable verbose output (currently all output is verbose by default)

## Output Structure

The script creates a timestamped directory structure:

```
debug_logs/
└── docker_comprehensive_diagnostics_YYYYMMDD_HHMMSS/
    ├── comprehensive_diagnostics.log          # Main log file
    ├── powershell_patterns_test.log            # PowerShell pattern test results
    ├── edge_cases_test.log                     # Edge case test results
    ├── environment_validation.log              # Environment validation log
    ├── file_locations.log                      # File location validation log
    ├── tool_versions.log                       # Tool version validation log
    ├── file_locations.json                     # File locations (JSON)
    ├── tool_versions.json                     # Tool versions (JSON)
    ├── environment_stats.json                  # Environment statistics (JSON)
    ├── powershell_patterns_results.json        # Pattern test results (JSON)
    ├── edge_cases_results.json                 # Edge case results (JSON)
    ├── comprehensive_summary.json              # Complete summary (JSON)
    └── tee_test_output.txt                     # Tee-Object test output
```

## Log Levels

The script uses different log levels for better visibility:
- **INFO**: General information
- **WARN**: Warnings
- **ERROR**: Errors
- **SUCCESS**: Successful operations
- **TIMEOUT**: Commands that exceeded timeout
- **SILENT**: Commands that completed but produced no output

## Console Output

The script provides noisy console output with:
- Color-coded messages (Green=Success, Red=Error, Yellow=Warning, Cyan=Info, Magenta=Timeout)
- Progress bars for long-running operations
- Real-time status updates
- Test IDs for tracking individual tests
- Duration information for each test
- Summary statistics at the end

## Timeout Handling

- Commands that exceed the timeout (default 90 seconds) are automatically stopped
- Timeout events are logged with the "TIMEOUT" level
- The script continues execution after timeouts without user intervention
- Progress updates are shown every 10 seconds for long-running commands

## Silent Output Detection

The script detects when:
- A command completes successfully (exit code 0 or null)
- But produces no visible output (empty stdout/stderr)
- This is logged with the "SILENT" level and counted separately

## Execution Methods

The script tests three different execution methods:

1. **Job Method**: Uses PowerShell jobs (default)
   - Pros: Native PowerShell, good for simple commands
   - Cons: May have issues with output redirection

2. **Process Method**: Direct process execution
   - Pros: More control over stdout/stderr
   - Cons: More complex setup

3. **CMD Wrapper Method**: Wraps commands in cmd.exe
   - Pros: Workaround for PowerShell output issues
   - Cons: Less native, may have different behavior

## Example Output

```
╔══════════════════════════════════════════════════════════════════════════════╗
║         COMPREHENSIVE DOCKER DIAGNOSTICS FOR POWERSHELL 7                    ║
║                    Cursor IDE Environment                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

Starting comprehensive diagnostics...
Log directory: debug_logs\docker_comprehensive_diagnostics_20250115_143022
Timeout per command: 90 seconds

═══════════════════════════════════════════════════════════════
STEP 1: FILE LOCATION VALIDATION
═══════════════════════════════════════════════════════════════
  ✓ docker.exe found at: C:\Program Files\Docker\Docker\resources\bin\docker.exe

═══════════════════════════════════════════════════════════════
STEP 2: TOOL VERSION VALIDATION
═══════════════════════════════════════════════════════════════
  PowerShell: 7.4.0 (Core)
  Docker: Docker version 28.5.2, build abc123

...

═══════════════════════════════════════════════════════════════
DIAGNOSTICS SUMMARY
═══════════════════════════════════════════════════════════════

Test Statistics:
  Total Tests: 25
  Passed: 20
  Failed: 3
  Timeouts: 1
  Silent Output: 1
  Success Rate: 80.00%

Total Duration: 45.32 seconds

All diagnostics saved to: debug_logs\docker_comprehensive_diagnostics_20250115_143022
```

## Troubleshooting

### Script Hangs
If the script appears to hang:
1. Check the log files for timeout messages
2. Verify Docker Desktop is running
3. Check if WSL2 is properly configured
4. Review the `comprehensive_summary.json` for patterns

### No Output
If you see no output:
1. Check the log files in the output directory
2. Verify PowerShell execution policy allows script execution
3. Check if the script has write permissions to the output directory

### Timeout Issues
If many commands timeout:
1. Increase the `-CommandTimeout` parameter
2. Check Docker daemon connectivity
3. Verify network connectivity
4. Review Docker Desktop status

## Comparison with Basic Diagnostics

This comprehensive script extends the basic `docker_diagnostics.ps1` with:
- **Advanced timeout handling** (90s vs 30s)
- **Multiple execution methods** (Job, Process, CMD wrapper)
- **PowerShell pattern testing** (2>&1 variations)
- **Edge case testing** (problematic commands)
- **Silent output detection**
- **Progress indicators** (progress bars, status updates)
- **More detailed logging** (levels, timestamps, durations)
- **No hanging guarantee** (continues after timeouts)

## Best Practices

1. **Run regularly**: Use this script to diagnose issues before they become critical
2. **Review logs**: Check the JSON files for structured data analysis
3. **Compare runs**: Save summaries to track changes over time
4. **Share results**: The comprehensive logs help diagnose environment-specific issues

## Notes

- The script is designed to be non-destructive (read-only operations)
- All Docker commands tested are safe and don't modify the system
- The script may take several minutes to complete depending on Docker daemon responsiveness
- Some commands may timeout if Docker Desktop is not running or not fully initialized




