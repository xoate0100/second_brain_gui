# Docker Diagnostics Script
# Comprehensive diagnostic tool to troubleshoot Docker command hanging issues
# Outputs all diagnostics to timestamped log files in debug_logs directory

param(
    [string]$OutputDir = "debug_logs",
    [int]$CommandTimeout = 30  # Timeout in seconds for each command
)

# Create output directory with timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogDir = Join-Path $OutputDir "docker_diagnostics_$Timestamp"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

# Logging function
function Write-DiagnosticLog {
    param(
        [string]$Message,
        [string]$LogFile = "diagnostics.log"
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogPath = Join-Path $LogDir $LogFile
    "$Timestamp - $Message" | Out-File -FilePath $LogPath -Append
    Write-Host "[$Timestamp] $Message" -ForegroundColor Cyan
}

# Execute command with timeout
function Invoke-CommandWithTimeout {
    param(
        [string]$Command,
        [string]$Description,
        [string]$LogFile = "diagnostics.log",
        [int]$TimeoutSeconds = $CommandTimeout
    )

    Write-DiagnosticLog "Starting: $Description" $LogFile
    Write-DiagnosticLog "Command: $Command" $LogFile

    try {
        $Job = Start-Job -ScriptBlock {
            param($Cmd)
            & powershell -Command $Cmd 2>&1
        } -ArgumentList $Command

        $Result = Wait-Job -Job $Job -Timeout $TimeoutSeconds

        if ($Result) {
            $Output = Receive-Job -Job $Job
            Remove-Job -Job $Job
            Write-DiagnosticLog "SUCCESS: $Description" $LogFile
            Write-DiagnosticLog "Output: $($Output -join "`n")" $LogFile
            return $Output
        } else {
            Stop-Job -Job $Job
            Remove-Job -Job $Job
            Write-DiagnosticLog "TIMEOUT: $Description (exceeded $TimeoutSeconds seconds)" $LogFile
            return "TIMEOUT: Command exceeded $TimeoutSeconds seconds"
        }
    } catch {
        Write-DiagnosticLog "ERROR: $Description - $($_.Exception.Message)" $LogFile
        return "ERROR: $($_.Exception.Message)"
    }
}

Write-DiagnosticLog "========================================" "diagnostics.log"
Write-DiagnosticLog "Docker Diagnostics Started" "diagnostics.log"
Write-DiagnosticLog "Timestamp: $Timestamp" "diagnostics.log"
Write-DiagnosticLog "Output Directory: $LogDir" "diagnostics.log"
Write-DiagnosticLog "========================================" "diagnostics.log"

# ============================================
# 1. SYSTEM INFORMATION
# ============================================
Write-DiagnosticLog "`n=== SYSTEM INFORMATION ===" "diagnostics.log"
$SystemInfo = @{
    OSVersion = (Get-CimInstance Win32_OperatingSystem).Version
    OSName = (Get-CimInstance Win32_OperatingSystem).Caption
    PowerShellVersion = $PSVersionTable.PSVersion
    User = $env:USERNAME
    ComputerName = $env:COMPUTERNAME
    Architecture = $env:PROCESSOR_ARCHITECTURE
}
$SystemInfo | ConvertTo-Json | Out-File -FilePath (Join-Path $LogDir "system_info.json")
Write-DiagnosticLog "System Info: $($SystemInfo | ConvertTo-Json)" "diagnostics.log"

# ============================================
# 2. DOCKER INSTALLATION CHECK
# ============================================
Write-DiagnosticLog "`n=== DOCKER INSTALLATION CHECK ===" "diagnostics.log"

# Check if docker.exe exists
$DockerPath = Get-Command docker -ErrorAction SilentlyContinue
if ($DockerPath) {
    Write-DiagnosticLog "Docker executable found at: $($DockerPath.Source)" "diagnostics.log"
    $DockerPath.Source | Out-File -FilePath (Join-Path $LogDir "docker_path.txt")
} else {
    Write-DiagnosticLog "WARNING: Docker executable not found in PATH" "diagnostics.log"
}

# Check if docker-compose exists
$DockerComposePath = Get-Command docker-compose -ErrorAction SilentlyContinue
if ($DockerComposePath) {
    Write-DiagnosticLog "Docker Compose executable found at: $($DockerComposePath.Source)" "diagnostics.log"
} else {
    Write-DiagnosticLog "WARNING: Docker Compose executable not found in PATH" "diagnostics.log"
}

# ============================================
# 3. DOCKER VERSION INFORMATION
# ============================================
Write-DiagnosticLog "`n=== DOCKER VERSION INFORMATION ===" "diagnostics.log"
Invoke-CommandWithTimeout -Command "docker --version" -Description "Docker Version" -LogFile "docker_version.log" | Out-File -FilePath (Join-Path $LogDir "docker_version.txt")
Invoke-CommandWithTimeout -Command "docker-compose --version" -Description "Docker Compose Version" -LogFile "docker_compose_version.log" | Out-File -FilePath (Join-Path $LogDir "docker_compose_version.txt")

# ============================================
# 4. DOCKER DAEMON STATUS
# ============================================
Write-DiagnosticLog "`n=== DOCKER DAEMON STATUS ===" "diagnostics.log"
$DaemonStatus = Invoke-CommandWithTimeout -Command "docker info" -Description "Docker Info" -LogFile "docker_daemon.log" -TimeoutSeconds 10
$DaemonStatus | Out-File -FilePath (Join-Path $LogDir "docker_info.txt")

# Check if daemon is running (more accurate check)
$DaemonRunning = $false
if ($DaemonStatus -and $DaemonStatus -notmatch "Cannot connect" -and $DaemonStatus -notmatch "TIMEOUT" -and $DaemonStatus -notmatch "error" -and $DaemonStatus -match "Server:") {
    $DaemonRunning = $true
    Write-DiagnosticLog "Docker daemon is running and accessible" "diagnostics.log"
} else {
    Write-DiagnosticLog "CRITICAL: Docker daemon appears to be not running or unreachable" "diagnostics.log"
    Write-DiagnosticLog "Note: On Windows, Docker Desktop uses WSL2 backend. The Windows service may show as stopped even when Docker is running." "diagnostics.log"
}

# ============================================
# 5. WINDOWS-SPECIFIC CHECKS
# ============================================
Write-DiagnosticLog "`n=== WINDOWS-SPECIFIC CHECKS ===" "diagnostics.log"

# Check WSL2 status
$WSLStatus = Invoke-CommandWithTimeout -Command "wsl --status" -Description "WSL Status" -LogFile "wsl_status.log" -TimeoutSeconds 10
$WSLStatus | Out-File -FilePath (Join-Path $LogDir "wsl_status.txt")

# Check WSL2 distribution
$WSLList = Invoke-CommandWithTimeout -Command "wsl --list --verbose" -Description "WSL Distributions" -LogFile "wsl_list.log" -TimeoutSeconds 10
$WSLList | Out-File -FilePath (Join-Path $LogDir "wsl_list.txt")

# Check Docker Desktop service (note: service may show as stopped even when Docker Desktop is running)
$DockerDesktopService = Get-Service -Name "*docker*" -ErrorAction SilentlyContinue
if ($DockerDesktopService) {
    $DockerDesktopService | Format-List | Out-File -FilePath (Join-Path $LogDir "docker_services.txt")
    Write-DiagnosticLog "Docker Services: $($DockerDesktopService | Format-List | Out-String)" "diagnostics.log"
    Write-DiagnosticLog "Note: On Windows, Docker Desktop uses WSL2 backend. Service status may not reflect actual Docker daemon status." "diagnostics.log"
} else {
    Write-DiagnosticLog "No Docker services found" "diagnostics.log"
}

# Better check: Try to connect to Docker daemon directly
$DockerPing = Invoke-CommandWithTimeout -Command "docker version --format '{{.Server.Version}}'" -Description "Docker Daemon Ping" -LogFile "docker_ping.log" -TimeoutSeconds 5
if ($DockerPing -and $DockerPing -notmatch "TIMEOUT" -and $DockerPing -notmatch "ERROR" -and $DockerPing -notmatch "Cannot connect") {
    Write-DiagnosticLog "Docker daemon is accessible (version: $DockerPing)" "diagnostics.log"
    $DockerPing | Out-File -FilePath (Join-Path $LogDir "docker_daemon_version.txt")
} else {
    Write-DiagnosticLog "WARNING: Cannot connect to Docker daemon" "diagnostics.log"
}

# Check Hyper-V status
$HyperV = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -ErrorAction SilentlyContinue
if ($HyperV) {
    $HyperV | ConvertTo-Json | Out-File -FilePath (Join-Path $LogDir "hyperv_status.json")
    Write-DiagnosticLog "Hyper-V Status: $($HyperV.State)" "diagnostics.log"
}

# ============================================
# 6. DOCKER CONTAINERS
# ============================================
Write-DiagnosticLog "`n=== DOCKER CONTAINERS ===" "diagnostics.log"
$Containers = Invoke-CommandWithTimeout -Command "docker ps -a" -Description "List All Containers" -LogFile "containers.log" -TimeoutSeconds 10
$Containers | Out-File -FilePath (Join-Path $LogDir "containers.txt")

$RunningContainers = Invoke-CommandWithTimeout -Command "docker ps" -Description "List Running Containers" -LogFile "running_containers.log" -TimeoutSeconds 10
$RunningContainers | Out-File -FilePath (Join-Path $LogDir "running_containers.txt")

# ============================================
# 7. DOCKER IMAGES
# ============================================
Write-DiagnosticLog "`n=== DOCKER IMAGES ===" "diagnostics.log"
$Images = Invoke-CommandWithTimeout -Command "docker images" -Description "List Docker Images" -LogFile "images.log" -TimeoutSeconds 10
$Images | Out-File -FilePath (Join-Path $LogDir "images.txt")

# ============================================
# 8. DOCKER NETWORKS
# ============================================
Write-DiagnosticLog "`n=== DOCKER NETWORKS ===" "diagnostics.log"
$Networks = Invoke-CommandWithTimeout -Command "docker network ls" -Description "List Docker Networks" -LogFile "networks.log" -TimeoutSeconds 10
$Networks | Out-File -FilePath (Join-Path $LogDir "networks.txt")

# ============================================
# 9. DOCKER VOLUMES
# ============================================
Write-DiagnosticLog "`n=== DOCKER VOLUMES ===" "diagnostics.log"
$Volumes = Invoke-CommandWithTimeout -Command "docker volume ls" -Description "List Docker Volumes" -LogFile "volumes.log" -TimeoutSeconds 10
$Volumes | Out-File -FilePath (Join-Path $LogDir "volumes.txt")

# ============================================
# 10. DOCKER COMPOSE STATUS
# ============================================
Write-DiagnosticLog "`n=== DOCKER COMPOSE STATUS ===" "diagnostics.log"
$ComposeFile = "docker-compose.yml"
if (Test-Path $ComposeFile) {
    Write-DiagnosticLog "Found docker-compose.yml" "diagnostics.log"

    # Validate compose file
    $ComposeConfig = Invoke-CommandWithTimeout -Command "docker-compose config" -Description "Validate Docker Compose Config" -LogFile "compose_config.log" -TimeoutSeconds 10
    $ComposeConfig | Out-File -FilePath (Join-Path $LogDir "compose_config.txt")

    # Check compose services
    $ComposeServices = Invoke-CommandWithTimeout -Command "docker-compose ps" -Description "Docker Compose Services Status" -LogFile "compose_services.log" -TimeoutSeconds 10
    $ComposeServices | Out-File -FilePath (Join-Path $LogDir "compose_services.txt")
} else {
    Write-DiagnosticLog "WARNING: docker-compose.yml not found in current directory" "diagnostics.log"
}

# ============================================
# 11. DISK SPACE
# ============================================
Write-DiagnosticLog "`n=== DISK SPACE ===" "diagnostics.log"
$DiskSpace = Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free, @{Name="UsedGB";Expression={[math]::Round($_.Used/1GB,2)}}, @{Name="FreeGB";Expression={[math]::Round($_.Free/1GB,2)}}
$DiskSpace | ConvertTo-Json | Out-File -FilePath (Join-Path $LogDir "disk_space.json")
Write-DiagnosticLog "Disk Space: $($DiskSpace | ConvertTo-Json)" "diagnostics.log"

# ============================================
# 12. NETWORK CONNECTIVITY
# ============================================
Write-DiagnosticLog "`n=== NETWORK CONNECTIVITY ===" "diagnostics.log"
$NetworkInfo = Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object Name, InterfaceDescription, LinkSpeed, Status
$NetworkInfo | ConvertTo-Json | Out-File -FilePath (Join-Path $LogDir "network_adapters.json")
Write-DiagnosticLog "Network Adapters: $($NetworkInfo | ConvertTo-Json)" "diagnostics.log"

# ============================================
# 13. PROCESS INFORMATION
# ============================================
Write-DiagnosticLog "`n=== PROCESS INFORMATION ===" "diagnostics.log"
$DockerProcesses = Get-Process -Name "*docker*" -ErrorAction SilentlyContinue
if ($DockerProcesses) {
    $DockerProcesses | Select-Object ProcessName, Id, CPU, WorkingSet, StartTime | ConvertTo-Json | Out-File -FilePath (Join-Path $LogDir "docker_processes.json")
    Write-DiagnosticLog "Docker Processes: $($DockerProcesses.Count) found" "diagnostics.log"
} else {
    Write-DiagnosticLog "No Docker processes found" "diagnostics.log"
}

# ============================================
# 14. DOCKER LOGS (if containers exist)
# ============================================
Write-DiagnosticLog "`n=== DOCKER LOGS ===" "diagnostics.log"
$ContainerNames = @("review-gui-frontend", "review-gui-backend")
foreach ($ContainerName in $ContainerNames) {
    $ContainerLogs = Invoke-CommandWithTimeout -Command "docker logs --tail 50 $ContainerName" -Description "Logs for $ContainerName" -LogFile "container_logs_$ContainerName.log" -TimeoutSeconds 10
    if ($ContainerLogs -notmatch "TIMEOUT" -and $ContainerLogs -notmatch "ERROR") {
        $ContainerLogs | Out-File -FilePath (Join-Path $LogDir "logs_$ContainerName.txt")
    }
}

# ============================================
# 15. ENVIRONMENT VARIABLES
# ============================================
Write-DiagnosticLog "`n=== ENVIRONMENT VARIABLES ===" "diagnostics.log"
$DockerEnvVars = Get-ChildItem Env: | Where-Object {$_.Name -like "*DOCKER*" -or $_.Name -like "*COMPOSE*"}
$DockerEnvVars | ConvertTo-Json | Out-File -FilePath (Join-Path $LogDir "docker_env_vars.json")
Write-DiagnosticLog "Docker Environment Variables: $($DockerEnvVars | ConvertTo-Json)" "diagnostics.log"

# ============================================
# 16. PERMISSIONS CHECK
# ============================================
Write-DiagnosticLog "`n=== PERMISSIONS CHECK ===" "diagnostics.log"
$CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$Principal = New-Object System.Security.Principal.WindowsPrincipal($CurrentUser)
$IsAdmin = $Principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
Write-DiagnosticLog "Running as Administrator: $IsAdmin" "diagnostics.log"
$IsAdmin | Out-File -FilePath (Join-Path $LogDir "is_admin.txt")

# ============================================
# 17. DOCKER BUILD TEST (if Dockerfile exists)
# ============================================
Write-DiagnosticLog "`n=== DOCKER BUILD TEST ===" "diagnostics.log"
$DockerfilePath = "frontend\Dockerfile"
if (Test-Path $DockerfilePath) {
    Write-DiagnosticLog "Found Dockerfile at: $DockerfilePath" "diagnostics.log"
    # Don't actually build, just validate syntax
    $BuildContext = Invoke-CommandWithTimeout -Command "docker build --dry-run frontend" -Description "Docker Build Dry Run" -LogFile "build_test.log" -TimeoutSeconds 15
    if ($BuildContext -match "TIMEOUT" -or $BuildContext -match "ERROR") {
        Write-DiagnosticLog "Build test could not complete (may be expected)" "diagnostics.log"
    }
} else {
    Write-DiagnosticLog "Dockerfile not found at expected path" "diagnostics.log"
}

# ============================================
# SUMMARY
# ============================================
Write-DiagnosticLog "`n========================================" "diagnostics.log"
Write-DiagnosticLog "DIAGNOSTICS COMPLETE" "diagnostics.log"
Write-DiagnosticLog "All logs saved to: $LogDir" "diagnostics.log"
Write-DiagnosticLog "========================================" "diagnostics.log"

# Generate summary report
$Summary = @{
    Timestamp = $Timestamp
    LogDirectory = $LogDir
    DockerInstalled = ($DockerPath -ne $null)
    DockerComposeInstalled = ($DockerComposePath -ne $null)
    DockerDaemonRunning = $DaemonRunning
    IsAdministrator = $IsAdmin
    WSLAvailable = ($WSLStatus -notmatch "TIMEOUT" -and $WSLStatus -notmatch "ERROR")
}
$Summary | ConvertTo-Json | Out-File -FilePath (Join-Path $LogDir "summary.json")
Write-Host "`n=== DIAGNOSTICS SUMMARY ===" -ForegroundColor Green
$Summary | Format-List | Out-String | Write-Host
Write-Host "`nFull diagnostics saved to: $LogDir" -ForegroundColor Green
