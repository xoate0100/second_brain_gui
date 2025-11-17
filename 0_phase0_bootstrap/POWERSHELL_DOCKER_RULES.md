# PowerShell and Docker Execution Rules

**Last Updated**: 2025-11-17
**Status**: Active

---

## Overview

This document defines best practices and rules for executing Docker commands in PowerShell within the Cursor IDE environment. These rules are based on comprehensive diagnostic testing and troubleshooting analysis.

---

## PowerShell Version Requirements

### Mandatory: Use PowerShell 7+

- **Required Version**: PowerShell 7.0 or higher
- **Check Version**: `$PSVersionTable.PSVersion.Major -ge 7`
- **Edition**: Must be "Core" (not "Desktop")
- **Executable**: Use `pwsh.exe`, not `powershell.exe`

### Configuration

- **Cursor IDE**: Configure `.vscode/settings.json` to use PowerShell 7 as default terminal
- **Terminal Profile**: Set `terminal.integrated.defaultProfile.windows` to "PowerShell"
- **PowerShell Extension**: Set `powershell.powerShellDefaultVersion` to "PowerShell 7"

### Verification

```powershell
# Verify PowerShell version
$PSVersionTable

# Should show:
# PSVersion: 7.x.x
# PSEdition: Core
```

---

## Docker Command Execution Methods

### Method 1: CMD Wrapper (RECOMMENDED for Critical Commands)

**Use Case**: When reliable output capture is essential

**Implementation**:
```powershell
# Synchronous output reading (avoids runspace issues)
$ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
$ProcessInfo.FileName = "cmd.exe"
$ProcessInfo.Arguments = "/c `"docker <command> 2>&1`""
$ProcessInfo.UseShellExecute = $false
$ProcessInfo.RedirectStandardOutput = $true
$ProcessInfo.RedirectStandardError = $true
$ProcessInfo.CreateNoWindow = $true

$Process = New-Object System.Diagnostics.Process
$Process.StartInfo = $ProcessInfo
$Process.Start() | Out-Null

# Read output synchronously (critical: avoids runspace issues)
$Output = $Process.StandardOutput.ReadToEnd()
$ErrorOutput = $Process.StandardError.ReadToEnd()
$Process.WaitForExit($TimeoutSeconds * 1000)
$ExitCode = $Process.ExitCode
```

**Advantages**:
- ✅ Most reliable output capture
- ✅ Works around PowerShell output buffering issues
- ✅ No runspace threading issues
- ✅ Handles both stdout and stderr correctly

**When to Use**:
- Critical Docker commands (build, run, ps, logs)
- Commands that must capture all output
- Production automation scripts

---

### Method 2: PowerShell Job (For Simple Commands)

**Use Case**: Simple commands that don't require complex output handling

**Implementation**:
```powershell
$Job = Start-Job -ScriptBlock {
    param($Cmd)
    & powershell -NoProfile -Command $Cmd 2>&1
} -ArgumentList "docker --version"

$Job | Wait-Job -Timeout 10 | Out-Null
$Output = Receive-Job -Job $Job
Remove-Job -Job $Job
```

**Advantages**:
- ✅ Native PowerShell approach
- ✅ Good for simple commands
- ✅ Easy to implement

**Limitations**:
- ⚠️ May have output redirection issues
- ⚠️ May not capture stderr properly in all scenarios

**When to Use**:
- Simple version checks
- Non-critical commands
- Quick diagnostics

---

### Method 3: Direct Process (Advanced - Use with Caution)

**Use Case**: When you need fine-grained control over process execution

**Implementation**:
```powershell
# Use synchronous reading, NOT async event handlers
$ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
$ProcessInfo.FileName = "docker.exe"
$ProcessInfo.Arguments = "<command>"
$ProcessInfo.UseShellExecute = $false
$ProcessInfo.RedirectStandardOutput = $true
$ProcessInfo.RedirectStandardError = $true

$Process = New-Object System.Diagnostics.Process
$Process.StartInfo = $ProcessInfo
$Process.Start() | Out-Null

# CRITICAL: Read synchronously, not with event handlers
$Output = $Process.StandardOutput.ReadToEnd()
$ErrorOutput = $Process.StandardError.ReadToEnd()
$Process.WaitForExit($TimeoutSeconds * 1000)
```

**⚠️ FORBIDDEN**: Do NOT use async event handlers (`add_OutputDataReceived`, `BeginOutputReadLine`)
- Causes runspace threading issues
- Results in `PSInvalidOperationException: There is no Runspace available`

---

## Output Handling Best Practices

### 1. Explicit String Conversion

**Problem**: Collections may show type names instead of content

**Solution**:
```powershell
# Convert collections to strings explicitly
$OutputStr = if ($Output -is [array]) {
    $Output -join "`n"
} else {
    $Output.ToString()
}
```

### 2. Handle Silent Output

**Problem**: Commands complete but produce no visible output

**Detection**:
```powershell
if ($ExitCode -eq 0 -and [string]::IsNullOrWhiteSpace($Output)) {
    Write-Warning "Silent output detected"
    # Log and handle appropriately
}
```

### 3. Error Stream Handling

**Always capture both stdout and stderr**:
```powershell
# CMD wrapper automatically merges with 2>&1
cmd /c "docker <command> 2>&1"

# Or capture separately
$ProcessInfo.RedirectStandardOutput = $true
$ProcessInfo.RedirectStandardError = $true
```

---

## Timeout Protection

### Mandatory: All Docker Commands Must Have Timeouts

**Default Timeout**: 90 seconds (configurable)

**Implementation**:
```powershell
$TimeoutSeconds = 90
$Completed = $Process.WaitForExit($TimeoutSeconds * 1000)

if (-not $Completed) {
    $Process.Kill()
    Write-Error "Command timed out after $TimeoutSeconds seconds"
    # Log and continue - don't crash script
}
```

**Best Practices**:
- Log timeout events with context
- Continue script execution after timeout (don't crash)
- Provide progress updates for long-running commands
- Use shorter timeouts for quick commands (10-15 seconds)

---

## Error Handling

### Pre-Flight Checks

**Before executing Docker commands, verify**:
1. Docker Desktop is running
2. Docker daemon is accessible
3. PowerShell version is 7+

```powershell
# Check Docker daemon
$DockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker daemon not accessible"
    return
}

# Check PowerShell version
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Error "PowerShell 7+ required"
    return
}
```

### Try-Catch Blocks

**Always wrap Docker commands in try-catch**:
```powershell
try {
    $Result = Invoke-DockerCommand -Command "docker ps"
} catch {
    Write-Error "Docker command failed: $($_.Exception.Message)"
    # Log error with context
    # Continue execution if possible
}
```

---

## Common Patterns

### Pattern 1: Simple Version Check

```powershell
$Version = cmd /c "docker --version 2>&1"
Write-Host "Docker: $Version"
```

### Pattern 2: Command with Output Capture

```powershell
$Output = cmd /c "docker ps 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host $Output
} else {
    Write-Error "docker ps failed"
}
```

### Pattern 3: Command with Timeout

```powershell
$Process = Start-Process -FilePath "docker" -ArgumentList "build", "." -NoNewWindow -PassThru -RedirectStandardOutput "output.txt"
$Completed = $Process.WaitForExit(90000)  # 90 seconds
if (-not $Completed) {
    $Process.Kill()
    Write-Error "Build timed out"
}
```

---

## Forbidden Patterns

### ❌ DO NOT Use Async Event Handlers

```powershell
# FORBIDDEN - Causes runspace issues
$Process.add_OutputDataReceived({
    # This runs in background thread without runspace
    Write-Host $EventArgs.Data  # CRASHES
})
$Process.BeginOutputReadLine()
```

### ❌ DO NOT Use PowerShell 5.1

```powershell
# FORBIDDEN - Use pwsh, not powershell
powershell -File script.ps1  # WRONG
pwsh -File script.ps1         # CORRECT
```

### ❌ DO NOT Ignore Errors

```powershell
# FORBIDDEN - Always check exit codes
docker ps  # Missing error handling

# CORRECT
$Result = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Command failed: $Result"
}
```

---

## Diagnostic Tools

### Comprehensive Diagnostic Script

**Location**: `scripts/docker_comprehensive_diagnostics.ps1`

**Usage**:
```powershell
# Run full diagnostics
pwsh scripts\docker_comprehensive_diagnostics.ps1

# With custom timeout
pwsh scripts\docker_comprehensive_diagnostics.ps1 -CommandTimeout 120
```

**What It Tests**:
- File locations and tool versions
- PowerShell patterns (2>&1, filters, etc.)
- Edge cases and problematic commands
- Environment statistics
- Multiple execution methods

---

## Troubleshooting

### Issue: Commands Return Exit Code 1 with No Output

**Causes**:
- Docker daemon not accessible
- PowerShell output buffering
- Named pipe connection issues

**Solutions**:
1. Check Docker Desktop status
2. Use CMD wrapper method
3. Verify Docker daemon: `docker info`

### Issue: Script Crashes with Runspace Error

**Cause**: Using async event handlers in Process method

**Solution**: Use synchronous output reading (see Method 1)

### Issue: Output Shows Type Names Instead of Content

**Cause**: Collections not converted to strings

**Solution**: Use `$output -join "`n"` or `.ToString()`

---

## References

- `docs/DOCKER_TROUBLESHOOTING_POWERSHELL.md` - Troubleshooting guide
- `docs/POWERSHELL_VERSION_CONFIGURATION.md` - PowerShell setup guide
- `docs/DOCKER_DIAGNOSTICS_ANALYSIS.md` - Comprehensive analysis
- `scripts/README_COMPREHENSIVE_DIAGNOSTICS.md` - Diagnostic script docs

---

## Enforcement

These rules are enforced through:
- Code review guidelines
- Pre-commit hooks (where applicable)
- Documentation requirements
- AI agent instructions

**Status**: Active and enforced as of 2025-11-17

