# Docker Diagnostics Script

## Overview
The `docker_diagnostics.ps1` script is a comprehensive diagnostic tool designed to troubleshoot Docker command hanging issues in the chat agent environment. It gathers extensive diagnostic information and outputs everything to timestamped log files to prevent timeout issues.

## Usage

### Basic Usage
```powershell
.\scripts\docker_diagnostics.ps1
```

### With Custom Output Directory
```powershell
.\scripts\docker_diagnostics.ps1 -OutputDir "custom_debug_logs"
```

### With Custom Timeout
```powershell
.\scripts\docker_diagnostics.ps1 -CommandTimeout 60
```

## Parameters

- **OutputDir** (string, default: "debug_logs"): Directory where diagnostic logs will be saved
- **CommandTimeout** (int, default: 30): Timeout in seconds for each diagnostic command

## What It Checks

The script performs comprehensive diagnostics across 17 categories:

1. **System Information**: OS version, PowerShell version, user context
2. **Docker Installation**: Verifies Docker and Docker Compose executables are in PATH
3. **Docker Version**: Gets version information for Docker and Docker Compose
4. **Docker Daemon Status**: Checks if Docker daemon is running and accessible
5. **Windows-Specific Checks**: WSL2 status, Docker Desktop services, Hyper-V status
6. **Docker Containers**: Lists all containers (running and stopped)
7. **Docker Images**: Lists all Docker images
8. **Docker Networks**: Lists all Docker networks
9. **Docker Volumes**: Lists all Docker volumes
10. **Docker Compose Status**: Validates compose file and checks service status
11. **Disk Space**: Checks available disk space on all drives
12. **Network Connectivity**: Checks network adapter status
13. **Process Information**: Lists all Docker-related processes
14. **Docker Logs**: Captures logs from known containers
15. **Environment Variables**: Lists Docker-related environment variables
16. **Permissions Check**: Verifies if running as administrator
17. **Docker Build Test**: Validates Dockerfile syntax (dry-run)

## Output Structure

The script creates a timestamped directory structure:

```
debug_logs/
└── docker_diagnostics_YYYYMMDD_HHMMSS/
    ├── diagnostics.log              # Main diagnostic log
    ├── summary.json                  # Summary of findings
    ├── system_info.json              # System information
    ├── docker_path.txt               # Docker executable path
    ├── docker_version.txt            # Docker version
    ├── docker_compose_version.txt     # Docker Compose version
    ├── docker_info.txt               # Docker daemon info
    ├── wsl_status.txt                # WSL2 status
    ├── wsl_list.txt                  # WSL2 distributions
    ├── docker_services.txt           # Docker services
    ├── hyperv_status.json            # Hyper-V status
    ├── containers.txt                # All containers
    ├── running_containers.txt        # Running containers
    ├── images.txt                    # Docker images
    ├── networks.txt                  # Docker networks
    ├── volumes.txt                   # Docker volumes
    ├── compose_config.txt            # Docker Compose config
    ├── compose_services.txt          # Compose services status
    ├── disk_space.json               # Disk space information
    ├── network_adapters.json         # Network adapters
    ├── docker_processes.json         # Docker processes
    ├── docker_env_vars.json          # Environment variables
    ├── is_admin.txt                  # Administrator status
    └── logs_*.txt                    # Container logs (if containers exist)
```

## Features

### Timeout Protection
All commands are executed with configurable timeouts to prevent the script itself from hanging. Commands that exceed the timeout are logged as "TIMEOUT" with the timeout duration.

### Comprehensive Logging
Every diagnostic check is logged with:
- Timestamp
- Description of the check
- Command executed
- Results (success, timeout, or error)

### Non-Blocking Execution
Commands are executed in background jobs to prevent blocking, allowing the script to continue even if individual commands hang.

### Summary Report
A JSON summary is generated at the end with key findings:
- Docker installation status
- Docker daemon running status
- Administrator privileges
- WSL2 availability

## Interpreting Results

### Docker Daemon Not Running
If `docker_info.txt` contains "Cannot connect" or "TIMEOUT":
- Start Docker Desktop
- Check WSL2 status
- Verify Docker Desktop service is running

### Commands Timing Out
If multiple commands show "TIMEOUT":
- Increase `-CommandTimeout` parameter
- Check system resource usage
- Verify Docker daemon is responsive

### WSL2 Issues
If `wsl_status.txt` shows errors:
- Verify WSL2 is installed and enabled
- Check WSL2 distribution status
- Restart WSL2 if needed

### Permission Issues
If `is_admin.txt` shows `False`:
- Some operations may require administrator privileges
- Consider running PowerShell as administrator

## Integration with 5 Why Analysis

The diagnostic script provides evidence for the 5 Why analysis:
- **Why 1**: Command execution times and timeout occurrences
- **Why 2**: Docker daemon status and connectivity
- **Why 3**: WSL2 and service status
- **Why 4**: Environment and permission checks
- **Why 5**: Process and resource information

## Integration with CTQ Analysis

The diagnostic script supports CTQ metrics:
- **CTQ 1 (Reliability)**: Docker daemon status, command success rates
- **CTQ 2 (Output Visibility)**: Logging completeness
- **CTQ 3 (Error Handling)**: Error detection and logging
- **CTQ 4 (Performance)**: Command execution times
- **CTQ 5 (Stability)**: Environment health checks

## Troubleshooting the Diagnostic Script

If the script itself hangs or fails:

1. **Check PowerShell Execution Policy**:
   ```powershell
   Get-ExecutionPolicy
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Run with Elevated Privileges**:
   Right-click PowerShell and select "Run as Administrator"

3. **Increase Timeout**:
   ```powershell
   .\scripts\docker_diagnostics.ps1 -CommandTimeout 60
   ```

4. **Check Disk Space**:
   Ensure sufficient disk space for log files

## Next Steps

After running the diagnostic script:

1. Review `summary.json` for quick overview
2. Check `diagnostics.log` for detailed information
3. Review specific log files for areas of concern
4. Refer to [5 Why Analysis](../docs/DOCKER_TROUBLESHOOTING_5WHY.md) for root cause analysis
5. Refer to [CTQ Analysis](../docs/DOCKER_TROUBLESHOOTING_CTQ.md) for quality improvements

## Example Output

```
[2024-01-15 10:30:00] Docker Diagnostics Started
[2024-01-15 10:30:00] Starting: Docker Version
[2024-01-15 10:30:01] SUCCESS: Docker Version
[2024-01-15 10:30:01] Starting: Docker Info
[2024-01-15 10:30:02] SUCCESS: Docker Info
...

=== DIAGNOSTICS SUMMARY ===
DockerInstalled      : True
DockerComposeInstalled : True
DockerDaemonRunning  : True
IsAdministrator      : False
WSLAvailable         : True

Full diagnostics saved to: debug_logs\docker_diagnostics_20240115_103000
```

## Related Documentation

- [5 Why Analysis](../docs/DOCKER_TROUBLESHOOTING_5WHY.md)
- [CTQ Analysis](../docs/DOCKER_TROUBLESHOOTING_CTQ.md)
- [Docker Compose Configuration](../docker-compose.yml)



