# Docker CLI Troubleshooting in PowerShell 7

## Issue
Docker commands are returning exit code 1 with no visible output in PowerShell 7.

## Observations
- ✅ Docker CLI is installed (version 28.5.2)
- ✅ Docker Desktop processes are running
- ✅ Docker context is set to `desktop-linux`
- ❌ `docker ps` returns exit code 1 with no output
- ❌ Standard error/output redirection not showing errors

## Possible Causes

### 1. Docker Daemon Connection Issue
The Docker daemon might not be fully initialized or there's a connection issue.

**Check:**
```powershell
# Try using cmd.exe to see if output appears
cmd /c "docker ps"

# Check Docker Desktop status
Get-Process | Where-Object {$_.ProcessName -like "*docker*"}
```

### 2. PowerShell Output Buffering
PowerShell 7 might be buffering Docker output differently than PowerShell 5.

**Try:**
```powershell
# Force immediate output
docker ps | Out-String -Width 4096

# Use cmd.exe wrapper
cmd /c "docker ps"
```

### 3. Docker Context Issue
The active context might not be properly connected.

**Check:**
```powershell
docker context ls
docker context use desktop-linux
```

### 4. Named Pipe Connection Issue
Docker Desktop uses named pipes on Windows. The pipe might be blocked or not accessible.

**Check:**
```powershell
# Test named pipe access
Test-Path "\\.\pipe\dockerDesktopLinuxEngine"
```

## Comprehensive Diagnostic Script

For a complete diagnostic analysis, use the comprehensive diagnostic script:

```powershell
# Run comprehensive diagnostics (recommended)
.\scripts\docker_comprehensive_diagnostics.ps1

# With custom timeout (if commands are timing out)
.\scripts\docker_comprehensive_diagnostics.ps1 -CommandTimeout 120

# Custom output directory
.\scripts\docker_comprehensive_diagnostics.ps1 -OutputDir "my_debug_logs"
```

This script will:
- ✅ Validate all file locations and tool versions
- ✅ Test PowerShell patterns (2>&1, filters, etc.)
- ✅ Test edge cases and problematic commands
- ✅ Collect comprehensive environment statistics
- ✅ Use 90-second timeouts to prevent hanging
- ✅ Provide progress bars and detailed logging
- ✅ Detect silent output issues
- ✅ Test multiple execution methods (Job, Process, CMD wrapper)

See `scripts/README_COMPREHENSIVE_DIAGNOSTICS.md` for full documentation.

## Diagnostic Commands

### Test Docker Connectivity
```powershell
# Basic version check (should work)
docker --version

# Test daemon connection
docker info

# List contexts
docker context ls

# Try switching context
docker context use default
docker ps
docker context use desktop-linux
docker ps
```

### Check Docker Desktop Status
```powershell
# Check if Docker Desktop UI is running
Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

# Check Docker service
Get-Service | Where-Object {$_.Name -like "*docker*"}
```

### Alternative: Use Docker Desktop CLI
```powershell
# Docker Desktop might have its own CLI
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" ps
```

## Workarounds

### Option 1: Use cmd.exe Wrapper
```powershell
function Invoke-Docker {
    param([string[]]$Arguments)
    $output = cmd /c "docker $($Arguments -join ' ') 2>&1"
    Write-Host $output
    return $LASTEXITCODE
}

Invoke-Docker @("ps")
```

### Option 2: Check Docker Desktop UI
1. Open Docker Desktop application
2. Check if it shows "Docker Desktop is running"
3. Look for any error messages in the UI
4. Try restarting Docker Desktop

### Option 3: Use docker-compose directly
```powershell
# docker-compose might work even if docker doesn't
docker-compose ps
docker-compose logs frontend
```

## Next Steps

1. **Verify Docker Desktop is fully started**
   - Open Docker Desktop UI
   - Wait for "Docker Desktop is running" message
   - Check for any warnings or errors

2. **Try restarting Docker Desktop**
   - Close Docker Desktop completely
   - Restart Docker Desktop
   - Wait for full initialization

3. **Check Windows Event Viewer**
   - Look for Docker-related errors
   - Check Application and System logs

4. **Try WSL2 backend** (if using WSL2)
   ```powershell
   wsl --list --verbose
   wsl --status
   ```

## Current Status
- Docker CLI: ✅ Installed (v28.5.2)
- Docker Desktop: ✅ Running (processes visible)
- Docker Context: ✅ Set to `desktop-linux`
- Docker Commands: ❌ Returning exit code 1 with no output

## Recommended Action
1. Check Docker Desktop UI for status/errors
2. Try restarting Docker Desktop
3. Use `cmd /c "docker ps"` as workaround
4. Check if issue is PowerShell-specific or Docker-specific

