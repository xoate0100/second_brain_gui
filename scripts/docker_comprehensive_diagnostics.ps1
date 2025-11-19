# Comprehensive Docker Diagnostics Script
# Enhanced diagnostic tool for PowerShell 7 in Cursor IDE
# Tests Docker commands, PowerShell patterns, edge cases, and environment validation
# Features: Progress bars, timeout handling (90s), comprehensive logging, no hanging

param(
    [string]$OutputDir = "debug_logs",
    [int]$CommandTimeout = 90,  # 90 second timeout as requested
    [switch]$Verbose
)

#region Setup and Configuration
# Immediate output to verify script is running
Write-Host "Starting Docker Comprehensive Diagnostics Script..." -ForegroundColor Green
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$ProgressPreference = "Continue"  # Ensure progress bars work
$OutputEncoding = [System.Text.Encoding]::UTF8

# Create output directory with timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogDir = Join-Path $OutputDir "docker_comprehensive_diagnostics_$Timestamp"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

# Main log file
$MainLogFile = Join-Path $LogDir "comprehensive_diagnostics.log"
$PowerShellPatternsLog = Join-Path $LogDir "powershell_patterns_test.log"
$EdgeCasesLog = Join-Path $LogDir "edge_cases_test.log"
$EnvironmentLog = Join-Path $LogDir "environment_validation.log"
$FileLocationsLog = Join-Path $LogDir "file_locations.log"
$ToolVersionsLog = Join-Path $LogDir "tool_versions.log"

# Statistics tracking
$script:TestCount = 0
$script:PassedTests = 0
$script:FailedTests = 0
$script:TimeoutTests = 0
$script:SilentOutputTests = 0
$script:StartTime = Get-Date
#endregion

#region Logging Functions
function Write-DiagnosticLog {
    param(
        [string]$Message,
        [string]$LogFile = $MainLogFile,
        [string]$Level = "INFO",
        [switch]$NoConsole
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $LogMessage = "$Timestamp [$Level] $Message"

    # Always write to log file
    $LogMessage | Out-File -FilePath $LogFile -Append -Encoding UTF8

    # Write to console unless NoConsole is specified
    if (-not $NoConsole) {
        # Use traditional switch statement for PowerShell 5.1 compatibility
        $Color = "White"
        switch ($Level) {
            "ERROR" { $Color = "Red" }
            "WARN" { $Color = "Yellow" }
            "SUCCESS" { $Color = "Green" }
            "TIMEOUT" { $Color = "Magenta" }
            "SILENT" { $Color = "Cyan" }
            default { $Color = "White" }
        }
        Write-Host "[$Timestamp] $Message" -ForegroundColor $Color
    }
}

function Write-ProgressStatus {
    param(
        [string]$Activity,
        [string]$Status,
        [int]$PercentComplete = -1,
        [int]$CurrentOperation = 0,
        [int]$TotalOperations = 0
    )

    if ($PercentComplete -ge 0) {
        Write-Progress -Activity $Activity -Status $Status -PercentComplete $PercentComplete -ErrorAction SilentlyContinue
    } elseif ($TotalOperations -gt 0) {
        # Only use -TotalOperations if it's supported (PowerShell 7+)
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            Write-Progress -Activity $Activity -Status $Status -CurrentOperation $CurrentOperation -TotalOperations $TotalOperations -ErrorAction SilentlyContinue
        } else {
            # Fallback for PowerShell 5.1
            Write-Progress -Activity $Activity -Status "$Status ($CurrentOperation/$TotalOperations)" -PercentComplete ([math]::Round(($CurrentOperation / $TotalOperations) * 100)) -ErrorAction SilentlyContinue
        }
    } else {
        Write-Progress -Activity $Activity -Status $Status -ErrorAction SilentlyContinue
    }

    Write-DiagnosticLog "$Activity - $Status" -Level "INFO"
}
#endregion

#region Command Execution with Advanced Timeout and Monitoring
function Invoke-CommandWithAdvancedTimeout {
    param(
        [string]$Command,
        [string]$Description,
        [string]$LogFile = $MainLogFile,
        [int]$TimeoutSeconds = $CommandTimeout,
        [switch]$TestPowerShellPattern,
        [switch]$CaptureSilentOutput,
        [string]$ExecutionMethod = "Job"  # Job, Process, CmdWrapper
    )

    $script:TestCount++
    $TestStartTime = Get-Date
    $TestId = "TEST-$($script:TestCount.ToString('D4'))"

    Write-DiagnosticLog "$TestId - Starting: $Description" $LogFile
    Write-DiagnosticLog "$TestId - Command: $Command" $LogFile
    Write-DiagnosticLog "$TestId - Execution Method: $ExecutionMethod" $LogFile
    Write-DiagnosticLog "$TestId - Timeout: $TimeoutSeconds seconds" $LogFile

    Write-Host "`n[$TestId] Testing: $Description" -ForegroundColor Cyan
    Write-Host "  Command: $Command" -ForegroundColor Gray
    Write-Host "  Method: $ExecutionMethod | Timeout: ${TimeoutSeconds}s" -ForegroundColor Gray

    $Output = $null
    $ErrorOutput = $null
    $ExitCode = $null
    $Duration = $null
    $TimedOut = $false
    $SilentOutput = $false

    try {
        $Job = $null
        $Process = $null

        # Monitor for timeout
        $TimeoutJob = Start-Job -ScriptBlock {
            param($Timeout)
            Start-Sleep -Seconds $Timeout
            return "TIMEOUT"
        } -ArgumentList $TimeoutSeconds

        switch ($ExecutionMethod) {
            "Job" {
                # Method 1: PowerShell Job
                Write-Host "  [Job Method] Starting job..." -ForegroundColor Yellow
                $Job = Start-Job -ScriptBlock {
                    param($Cmd, $TestPattern)
                    if ($TestPattern) {
                        # Test PowerShell pattern: 2>&1 piped to filter
                        $result = & powershell -NoProfile -Command $Cmd 2>&1 | Where-Object { $_ -ne $null }
                        return @{
                            Output = $result
                            ExitCode = $LASTEXITCODE
                        }
                    } else {
                        $result = & powershell -NoProfile -Command $Cmd 2>&1
                        return @{
                            Output = $result
                            ExitCode = $LASTEXITCODE
                        }
                    }
                } -ArgumentList $Command, $TestPowerShellPattern

                # Wait for either job to complete or timeout
                $Completed = $false
                $Elapsed = 0
                $CheckInterval = 1

                while (-not $Completed -and $Elapsed -lt $TimeoutSeconds) {
                    if ($Job.State -eq "Completed" -or $Job.State -eq "Failed") {
                        $Completed = $true
                    } else {
                        Start-Sleep -Seconds $CheckInterval
                        $Elapsed += $CheckInterval

                        # Progress update every 10 seconds
                        if ($Elapsed % 10 -eq 0) {
                            Write-Host "  [Job Method] Still running... (${Elapsed}s elapsed)" -ForegroundColor Yellow
                            Write-DiagnosticLog "$TestId - Still running after $Elapsed seconds" $LogFile -Level "WARN"
                        }
                    }
                }

                if ($Job.State -eq "Running") {
                    $TimedOut = $true
                    Write-Host "  [Job Method] TIMEOUT after ${Elapsed}s - Stopping job..." -ForegroundColor Magenta
                    Write-DiagnosticLog "$TestId - TIMEOUT after $Elapsed seconds" $LogFile -Level "TIMEOUT"
                    Stop-Job -Job $Job -ErrorAction SilentlyContinue
                    Remove-Job -Job $Job -Force -ErrorAction SilentlyContinue
                    $script:TimeoutTests++
                } else {
                    $JobResult = Receive-Job -Job $Job
                    if ($JobResult -is [hashtable]) {
                        $Output = $JobResult.Output
                        $ExitCode = $JobResult.ExitCode
                    } else {
                        $Output = $JobResult
                    }
                    Remove-Job -Job $Job -ErrorAction SilentlyContinue
                }
            }

            "Process" {
                # Method 2: Direct Process execution
                Write-Host "  [Process Method] Starting process..." -ForegroundColor Yellow
                $ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
                $ProcessInfo.FileName = "powershell.exe"
                $ProcessInfo.Arguments = "-NoProfile -Command `"$Command`""
                $ProcessInfo.UseShellExecute = $false
                $ProcessInfo.RedirectStandardOutput = $true
                $ProcessInfo.RedirectStandardError = $true
                $ProcessInfo.CreateNoWindow = $true

                $Process = New-Object System.Diagnostics.Process
                $Process.StartInfo = $ProcessInfo

                $OutputBuilder = New-Object System.Text.StringBuilder
                $ErrorBuilder = New-Object System.Text.StringBuilder

                $OutputHandler = {
                    if (-not [string]::IsNullOrEmpty($EventArgs.Data)) {
                        [void]$OutputBuilder.AppendLine($EventArgs.Data)
                    }
                }
                $ErrorHandler = {
                    if (-not [string]::IsNullOrEmpty($EventArgs.Data)) {
                        [void]$ErrorBuilder.AppendLine($EventArgs.Data)
                    }
                }

                $Process.add_OutputDataReceived($OutputHandler)
                $Process.add_ErrorDataReceived($ErrorHandler)

                $Process.Start() | Out-Null
                $Process.BeginOutputReadLine()
                $Process.BeginErrorReadLine()

                $Completed = $Process.WaitForExit($TimeoutSeconds * 1000)

                if (-not $Completed) {
                    $TimedOut = $true
                    Write-Host "  [Process Method] TIMEOUT after ${TimeoutSeconds}s - Killing process..." -ForegroundColor Magenta
                    Write-DiagnosticLog "$TestId - TIMEOUT after $TimeoutSeconds seconds" $LogFile -Level "TIMEOUT"
                    $Process.Kill()
                    $script:TimeoutTests++
                } else {
                    $Output = $OutputBuilder.ToString()
                    $ErrorOutput = $ErrorBuilder.ToString()
                    $ExitCode = $Process.ExitCode
                }

                $Process.Dispose()
            }

            "CmdWrapper" {
                # Method 3: CMD.exe wrapper (workaround for PowerShell issues)
                # Use synchronous output reading to avoid runspace issues
                Write-Host "  [CMD Wrapper Method] Starting via cmd.exe..." -ForegroundColor Yellow

                try {
                    # Use Start-Process with synchronous output capture to avoid runspace issues
                    $ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
                    $ProcessInfo.FileName = "cmd.exe"
                    $ProcessInfo.Arguments = "/c `"$Command 2>&1`""
                    $ProcessInfo.UseShellExecute = $false
                    $ProcessInfo.RedirectStandardOutput = $true
                    $ProcessInfo.RedirectStandardError = $true
                    $ProcessInfo.CreateNoWindow = $true
                    $ProcessInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
                    $ProcessInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8

                    $Process = New-Object System.Diagnostics.Process
                    $Process.StartInfo = $ProcessInfo

                    # Start process and read output synchronously
                    $Process.Start() | Out-Null

                    # Read output synchronously (avoids runspace issues)
                    $Output = $Process.StandardOutput.ReadToEnd()
                    $ErrorOutput = $Process.StandardError.ReadToEnd()

                    # Wait for exit with timeout
                    $Completed = $Process.WaitForExit($TimeoutSeconds * 1000)

                    if (-not $Completed) {
                        $TimedOut = $true
                        Write-Host "  [CMD Wrapper Method] TIMEOUT after ${TimeoutSeconds}s - Killing process..." -ForegroundColor Magenta
                        Write-DiagnosticLog "$TestId - TIMEOUT after $TimeoutSeconds seconds" $LogFile -Level "TIMEOUT"
                        $Process.Kill()
                        $script:TimeoutTests++
                        $ExitCode = $null
                    } else {
                        $ExitCode = $Process.ExitCode
                    }

                    $Process.Dispose()
                } catch {
                    Write-Host "  [CMD Wrapper Method] ERROR: $($_.Exception.Message)" -ForegroundColor Red
                    Write-DiagnosticLog "$TestId - CMD Wrapper Exception: $($_.Exception.Message)" $LogFile -Level "ERROR"
                    $Output = "EXCEPTION: $($_.Exception.Message)"
                    $ErrorOutput = $_.Exception.StackTrace
                    $ExitCode = $null
                    if ($Process -and -not $Process.HasExited) {
                        $Process.Kill()
                        $Process.Dispose()
                    }
                }
            }
        }

        # Clean up timeout job
        if ($TimeoutJob) {
            Stop-Job -Job $TimeoutJob -ErrorAction SilentlyContinue
            Remove-Job -Job $TimeoutJob -Force -ErrorAction SilentlyContinue
        }

        $Duration = (Get-Date) - $TestStartTime

        # Check for silent output (no output but command completed)
        if (-not $TimedOut -and $ExitCode -ne $null) {
            $HasOutput = ($Output -and $Output.ToString().Trim() -ne "") -or ($ErrorOutput -and $ErrorOutput.ToString().Trim() -ne "")
            if (-not $HasOutput -and $CaptureSilentOutput) {
                $SilentOutput = $true
                Write-Host "  [WARNING] Silent output detected - command completed but produced no output!" -ForegroundColor Cyan
                Write-DiagnosticLog "$TestId - SILENT OUTPUT: Command completed (exit code: $ExitCode) but produced no visible output" $LogFile -Level "SILENT"
                $script:SilentOutputTests++
            }
        }

        # Log results
        Write-DiagnosticLog "$TestId - Duration: $($Duration.TotalSeconds.ToString('F2')) seconds" $LogFile
        Write-DiagnosticLog "$TestId - Exit Code: $ExitCode" $LogFile
        Write-DiagnosticLog "$TestId - Timed Out: $TimedOut" $LogFile
        Write-DiagnosticLog "$TestId - Silent Output: $SilentOutput" $LogFile

        if ($Output) {
            $OutputStr = if ($Output -is [array]) { $Output -join "`n" } else { $Output.ToString() }
            Write-DiagnosticLog "$TestId - Output Length: $($OutputStr.Length) characters" $LogFile
            if ($OutputStr.Length -gt 0 -and $OutputStr.Length -lt 5000) {
                Write-DiagnosticLog "$TestId - Output: $OutputStr" $LogFile
            } else {
                Write-DiagnosticLog "$TestId - Output: [Too long to display, saved to file]" $LogFile
            }
        }

        if ($ErrorOutput) {
            $ErrorStr = if ($ErrorOutput -is [array]) { $ErrorOutput -join "`n" } else { $ErrorOutput.ToString() }
            Write-DiagnosticLog "$TestId - Error Output: $ErrorStr" $LogFile -Level "ERROR"
        }

        # Determine test result
        if ($TimedOut) {
            Write-Host "  [RESULT] TIMEOUT (exceeded ${TimeoutSeconds}s)" -ForegroundColor Magenta
            return @{
                Success = $false
                Output = "TIMEOUT: Command exceeded $TimeoutSeconds seconds"
                ExitCode = $null
                Duration = $Duration
                TimedOut = $true
                SilentOutput = $false
            }
        } elseif ($SilentOutput) {
            Write-Host "  [RESULT] SILENT OUTPUT (no output received)" -ForegroundColor Cyan
            return @{
                Success = $false
                Output = $Output
                ExitCode = $ExitCode
                Duration = $Duration
                TimedOut = $false
                SilentOutput = $true
            }
        } elseif ($ExitCode -eq 0 -or $ExitCode -eq $null) {
            Write-Host "  [RESULT] SUCCESS" -ForegroundColor Green
            $script:PassedTests++
            return @{
                Success = $true
                Output = $Output
                ExitCode = $ExitCode
                Duration = $Duration
                TimedOut = $false
                SilentOutput = $false
            }
        } else {
            Write-Host "  [RESULT] FAILED (exit code: $ExitCode)" -ForegroundColor Red
            $script:FailedTests++
            return @{
                Success = $false
                Output = $Output
                ErrorOutput = $ErrorOutput
                ExitCode = $ExitCode
                Duration = $Duration
                TimedOut = $false
                SilentOutput = $false
            }
        }

    } catch {
        $Duration = (Get-Date) - $TestStartTime
        Write-Host "  [RESULT] EXCEPTION: $($_.Exception.Message)" -ForegroundColor Red
        Write-DiagnosticLog "$TestId - EXCEPTION: $($_.Exception.Message)" $LogFile -Level "ERROR"
        Write-DiagnosticLog "$TestId - Stack Trace: $($_.ScriptStackTrace)" $LogFile -Level "ERROR"
        $script:FailedTests++

        # Cleanup
        if ($Job) {
            Stop-Job -Job $Job -ErrorAction SilentlyContinue
            Remove-Job -Job $Job -Force -ErrorAction SilentlyContinue
        }
        if ($Process -and -not $Process.HasExited) {
            $Process.Kill()
            $Process.Dispose()
        }
        if ($TimeoutJob) {
            Stop-Job -Job $TimeoutJob -ErrorAction SilentlyContinue
            Remove-Job -Job $TimeoutJob -Force -ErrorAction SilentlyContinue
        }

        return @{
            Success = $false
            Output = "EXCEPTION: $($_.Exception.Message)"
            ExitCode = $null
            Duration = $Duration
            TimedOut = $false
            SilentOutput = $false
        }
    }
}
#endregion

#region File Location Validation
function Test-FileLocations {
    Write-ProgressStatus -Activity "File Location Validation" -Status "Starting..." -PercentComplete 0

    Write-DiagnosticLog "`n========================================" $FileLocationsLog
    Write-DiagnosticLog "FILE LOCATION VALIDATION" $FileLocationsLog
    Write-DiagnosticLog "========================================" $FileLocationsLog

    $FilesToCheck = @(
        "docker.exe",
        "docker-compose.exe",
        "docker-compose.yml",
        "docker-compose.yaml",
        "Dockerfile",
        "frontend\Dockerfile",
        "backend\Dockerfile"
    )

    $Locations = @{}

    foreach ($File in $FilesToCheck) {
        Write-ProgressStatus -Activity "File Location Validation" -Status "Checking: $File"

        # Check in PATH
        $PathResult = Get-Command $File -ErrorAction SilentlyContinue
        if ($PathResult) {
            $Locations[$File] = @{
                Found = $true
                Path = $PathResult.Source
                Type = "PATH"
            }
            Write-DiagnosticLog "$File - Found in PATH: $($PathResult.Source)" $FileLocationsLog
            Write-Host "  ✓ $File found at: $($PathResult.Source)" -ForegroundColor Green
        } else {
            # Check common installation locations
            # Access ProgramFiles(x86) safely
            $ProgramFilesX86 = if (Test-Path "Env:\ProgramFiles(x86)") {
                (Get-Item "Env:\ProgramFiles(x86)").Value
            } else {
                "C:\Program Files (x86)"
            }
            $CommonPaths = @(
                "C:\Program Files\Docker\Docker\resources\bin\$File",
                "$ProgramFilesX86\Docker\Docker\resources\bin\$File",
                "$env:ProgramFiles\Docker\Docker\resources\bin\$File",
                "$env:LOCALAPPDATA\Docker\bin\$File"
            )

            $Found = $false
            foreach ($CommonPath in $CommonPaths) {
                if (Test-Path $CommonPath) {
                    $Locations[$File] = @{
                        Found = $true
                        Path = $CommonPath
                        Type = "CommonPath"
                    }
                    Write-DiagnosticLog "$File - Found at common path: $CommonPath" $FileLocationsLog
                    Write-Host "  ✓ $File found at: $CommonPath" -ForegroundColor Green
                    $Found = $true
                    break
                }
            }

            if (-not $Found) {
                # Check relative to current directory
                if (Test-Path $File) {
                    $FullPath = Resolve-Path $File
                    $Locations[$File] = @{
                        Found = $true
                        Path = $FullPath
                        Type = "Relative"
                    }
                    Write-DiagnosticLog "$File - Found relative to current directory: $FullPath" $FileLocationsLog
                    Write-Host "  ✓ $File found at: $FullPath" -ForegroundColor Green
                } else {
                    $Locations[$File] = @{
                        Found = $false
                        Path = $null
                        Type = "NotFound"
                    }
                    Write-DiagnosticLog "$File - NOT FOUND" $FileLocationsLog -Level "WARN"
                    Write-Host "  ✗ $File NOT FOUND" -ForegroundColor Red
                }
            }
        }
    }

    # Check Docker Desktop installation
    Write-ProgressStatus -Activity "File Location Validation" -Status "Checking Docker Desktop installation..."
    $DockerDesktopPaths = @(
        "C:\Program Files\Docker\Docker\Docker Desktop.exe",
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Programs\Docker\Docker\Docker Desktop.exe"
    )

    foreach ($Path in $DockerDesktopPaths) {
        if (Test-Path $Path) {
            Write-DiagnosticLog "Docker Desktop found at: $Path" $FileLocationsLog
            Write-Host "  ✓ Docker Desktop found at: $Path" -ForegroundColor Green
            $Locations["Docker Desktop"] = @{
                Found = $true
                Path = $Path
                Type = "Installation"
            }
            break
        }
    }

    # Convert to JSON with error handling and reduced depth to avoid hanging
    try {
        $JsonOutput = $Locations | ConvertTo-Json -Depth 5 -Compress -ErrorAction Stop
        $JsonOutput | Out-File -FilePath (Join-Path $LogDir "file_locations.json") -Encoding UTF8 -ErrorAction Stop
        Write-DiagnosticLog "File locations JSON saved successfully" $FileLocationsLog
    } catch {
        Write-DiagnosticLog "WARNING: Could not save file locations as JSON: $($_.Exception.Message)" $FileLocationsLog -Level "WARN"
        # Save as simple text instead
        $Locations.GetEnumerator() | ForEach-Object {
            "$($_.Key): $($_.Value.Found) - $($_.Value.Path)" | Out-File -FilePath (Join-Path $LogDir "file_locations.txt") -Append -Encoding UTF8
        }
    }

    Write-ProgressStatus -Activity "File Location Validation" -Status "Complete" -PercentComplete 100
    return $Locations
}
#endregion

#region Tool Version Validation
function Test-ToolVersions {
    Write-ProgressStatus -Activity "Tool Version Validation" -Status "Starting..." -PercentComplete 0

    Write-DiagnosticLog "`n========================================" $ToolVersionsLog
    Write-DiagnosticLog "TOOL VERSION VALIDATION" $ToolVersionsLog
    Write-DiagnosticLog "========================================" $ToolVersionsLog

    $Versions = @{}

    # PowerShell Version
    Write-ProgressStatus -Activity "Tool Version Validation" -Status "Checking PowerShell version..."
    $PSVersion = $PSVersionTable.PSVersion
    $Versions["PowerShell"] = @{
        Version = $PSVersion.ToString()
        Major = $PSVersion.Major
        Minor = $PSVersion.Minor
        Build = $PSVersion.Build
        Revision = $PSVersion.Revision
        Edition = $PSVersionTable.PSEdition
        CLRVersion = $PSVersionTable.CLRVersion
    }
    Write-DiagnosticLog "PowerShell Version: $PSVersion ($($PSVersionTable.PSEdition))" $ToolVersionsLog
    Write-Host "  PowerShell: $PSVersion ($($PSVersionTable.PSEdition))" -ForegroundColor Cyan

    # Docker Version
    Write-ProgressStatus -Activity "Tool Version Validation" -Status "Checking Docker version..."
    $DockerVersionResult = Invoke-CommandWithAdvancedTimeout -Command "docker --version" -Description "Docker Version Check" -LogFile $ToolVersionsLog -TimeoutSeconds 10 -ExecutionMethod "Job"
    if ($DockerVersionResult.Success) {
        $Versions["Docker"] = @{
            VersionString = $DockerVersionResult.Output
            Parsed = $DockerVersionResult.Output
        }
        Write-Host "  Docker: $($DockerVersionResult.Output)" -ForegroundColor Cyan
    }

    # Docker Compose Version
    Write-ProgressStatus -Activity "Tool Version Validation" -Status "Checking Docker Compose version..."
    $DockerComposeVersionResult = Invoke-CommandWithAdvancedTimeout -Command "docker-compose --version" -Description "Docker Compose Version Check" -LogFile $ToolVersionsLog -TimeoutSeconds 10 -ExecutionMethod "Job"
    if ($DockerComposeVersionResult.Success) {
        $Versions["DockerCompose"] = @{
            VersionString = $DockerComposeVersionResult.Output
            Parsed = $DockerComposeVersionResult.Output
        }
        Write-Host "  Docker Compose: $($DockerComposeVersionResult.Output)" -ForegroundColor Cyan
    }

    # Docker Client/Server Version (detailed)
    Write-ProgressStatus -Activity "Tool Version Validation" -Status "Checking Docker detailed version..."
    $DockerDetailedResult = Invoke-CommandWithAdvancedTimeout -Command "docker version" -Description "Docker Detailed Version" -LogFile $ToolVersionsLog -TimeoutSeconds 10 -ExecutionMethod "Job"
    if ($DockerDetailedResult.Success) {
        $Versions["DockerDetailed"] = @{
            FullOutput = $DockerDetailedResult.Output
        }
    }

    # WSL Version
    Write-ProgressStatus -Activity "Tool Version Validation" -Status "Checking WSL version..."
    $WSLVersionResult = Invoke-CommandWithAdvancedTimeout -Command "wsl --version" -Description "WSL Version Check" -LogFile $ToolVersionsLog -TimeoutSeconds 10 -ExecutionMethod "Job"
    if ($WSLVersionResult.Success) {
        $Versions["WSL"] = @{
            VersionString = $WSLVersionResult.Output
        }
        Write-Host "  WSL: $($WSLVersionResult.Output)" -ForegroundColor Cyan
    }

    # Git Version
    Write-ProgressStatus -Activity "Tool Version Validation" -Status "Checking Git version..."
    $GitVersionResult = Invoke-CommandWithAdvancedTimeout -Command "git --version" -Description "Git Version Check" -LogFile $ToolVersionsLog -TimeoutSeconds 10 -ExecutionMethod "Job"
    if ($GitVersionResult.Success) {
        $Versions["Git"] = @{
            VersionString = $GitVersionResult.Output
        }
        Write-Host "  Git: $($GitVersionResult.Output)" -ForegroundColor Cyan
    }

    # Convert to JSON with error handling and timeout protection
    try {
        $JsonOutput = $Versions | ConvertTo-Json -Depth 5 -Compress -ErrorAction Stop
        $JsonOutput | Out-File -FilePath (Join-Path $LogDir "tool_versions.json") -Encoding UTF8 -ErrorAction Stop
    } catch {
        Write-DiagnosticLog "WARNING: Could not save tool versions as JSON: $($_.Exception.Message)" $ToolVersionsLog -Level "WARN"
    }

    Write-ProgressStatus -Activity "Tool Version Validation" -Status "Complete" -PercentComplete 100
    return $Versions
}
#endregion

#region Environment Statistics
function Test-EnvironmentStatistics {
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Collecting..." -PercentComplete 0

    Write-DiagnosticLog "`n========================================" $EnvironmentLog
    Write-DiagnosticLog "ENVIRONMENT STATISTICS" $EnvironmentLog
    Write-DiagnosticLog "========================================" $EnvironmentLog

    $Stats = @{}

    # System Information
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Collecting system information..."
    $OS = Get-CimInstance Win32_OperatingSystem
    $Stats["System"] = @{
        OSVersion = $OS.Version
        OSName = $OS.Caption
        OSArchitecture = $OS.OSArchitecture
        BuildNumber = $OS.BuildNumber
        TotalPhysicalMemory = [math]::Round($OS.TotalVisibleMemorySize / 1MB, 2)
        FreePhysicalMemory = [math]::Round($OS.FreePhysicalMemory / 1MB, 2)
        ComputerName = $env:COMPUTERNAME
        UserName = $env:USERNAME
        UserDomain = $env:USERDOMAIN
        ProcessorArchitecture = $env:PROCESSOR_ARCHITECTURE
        ProcessorCount = $env:NUMBER_OF_PROCESSORS
    }
    Write-DiagnosticLog "System: $($OS.Caption) $($OS.Version)" $EnvironmentLog

    # PowerShell Environment
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Collecting PowerShell environment..."
    $Stats["PowerShell"] = @{
        Version = $PSVersionTable.PSVersion.ToString()
        Edition = $PSVersionTable.PSEdition
        ExecutionPolicy = (Get-ExecutionPolicy)
        Host = $Host.Name
        HostVersion = $Host.Version.ToString()
        RunspaceId = $Host.Runspace.Id
        CurrentDirectory = (Get-Location).Path
        ScriptRoot = $PSScriptRoot
    }
    Write-DiagnosticLog "PowerShell: $($PSVersionTable.PSVersion) ($($PSVersionTable.PSEdition))" $EnvironmentLog

    # PATH Environment
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Analyzing PATH..."
    $PathEntries = $env:PATH -split ';' | Where-Object { $_ -ne '' }
    $Stats["PATH"] = @{
        TotalEntries = $PathEntries.Count
        Entries = $PathEntries
        TotalLength = $env:PATH.Length
    }
    Write-DiagnosticLog "PATH: $($PathEntries.Count) entries" $EnvironmentLog

    # Docker Environment Variables
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Collecting Docker environment variables..."
    $DockerEnvVars = Get-ChildItem Env: | Where-Object { $_.Name -like "*DOCKER*" -or $_.Name -like "*COMPOSE*" }
    $Stats["DockerEnvironment"] = @{}
    foreach ($Var in $DockerEnvVars) {
        $Stats["DockerEnvironment"][$Var.Name] = $Var.Value
    }
    Write-DiagnosticLog "Docker Environment Variables: $($DockerEnvVars.Count) found" $EnvironmentLog

    # Disk Space
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Checking disk space..."
    $Drives = Get-PSDrive -PSProvider FileSystem
    $Stats["DiskSpace"] = @()
    foreach ($Drive in $Drives) {
        $Stats["DiskSpace"] += @{
            Drive = $Drive.Name
            UsedGB = [math]::Round($Drive.Used / 1GB, 2)
            FreeGB = [math]::Round($Drive.Free / 1GB, 2)
            TotalGB = [math]::Round(($Drive.Used + $Drive.Free) / 1GB, 2)
            PercentFree = [math]::Round(($Drive.Free / ($Drive.Used + $Drive.Free)) * 100, 2)
        }
    }
    Write-DiagnosticLog "Disk Space: $($Drives.Count) drives analyzed" $EnvironmentLog

    # Network Adapters
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Checking network adapters..."
    $Adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    $AdapterData = $Adapters | Select-Object Name, InterfaceDescription, LinkSpeed, Status
    $Stats["Network"] = @{
        ActiveAdapters = $Adapters.Count
        Adapters = $AdapterData  # Will be converted to JSON later if needed
    }
    Write-DiagnosticLog "Network: $($Adapters.Count) active adapters" $EnvironmentLog

    # Docker Processes
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Checking Docker processes..."
    $DockerProcesses = Get-Process | Where-Object { $_.ProcessName -like "*docker*" }
    $ProcessData = $DockerProcesses | Select-Object ProcessName, Id, CPU, WorkingSet, StartTime
    $Stats["DockerProcesses"] = @{
        Count = $DockerProcesses.Count
        Processes = $ProcessData  # Will be converted to JSON later if needed
    }
    Write-DiagnosticLog "Docker Processes: $($DockerProcesses.Count) found" $EnvironmentLog

    # Permissions
    Write-ProgressStatus -Activity "Environment Statistics" -Status "Checking permissions..."
    $CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
    $Principal = New-Object System.Security.Principal.WindowsPrincipal($CurrentUser)
    $IsAdmin = $Principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
    $Stats["Permissions"] = @{
        IsAdministrator = $IsAdmin
        UserName = $CurrentUser.Name
        AuthenticationType = $CurrentUser.AuthenticationType
    }
    Write-DiagnosticLog "Permissions: Administrator = $IsAdmin" $EnvironmentLog

    # Convert to JSON with error handling - simplify complex objects first
    try {
        # Simplify network adapters and processes before JSON conversion
        if ($Stats["Network"] -and $Stats["Network"].Adapters) {
            $Stats["Network"].Adapters = $Stats["Network"].Adapters | ConvertTo-Json -Depth 2 -Compress
        }
        if ($Stats["DockerProcesses"] -and $Stats["DockerProcesses"].Processes) {
            $Stats["DockerProcesses"].Processes = $Stats["DockerProcesses"].Processes | ConvertTo-Json -Depth 2 -Compress
        }
        $JsonOutput = $Stats | ConvertTo-Json -Depth 5 -Compress -ErrorAction Stop
        $JsonOutput | Out-File -FilePath (Join-Path $LogDir "environment_stats.json") -Encoding UTF8 -ErrorAction Stop
    } catch {
        Write-DiagnosticLog "WARNING: Could not save environment stats as JSON: $($_.Exception.Message)" $EnvironmentLog -Level "WARN"
    }

    Write-ProgressStatus -Activity "Environment Statistics" -Status "Complete" -PercentComplete 100
    return $Stats
}
#endregion

#region PowerShell Pattern Testing
function Test-PowerShellPatterns {
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Starting..." -PercentComplete 0

    Write-DiagnosticLog "`n========================================" $PowerShellPatternsLog
    Write-DiagnosticLog "POWERSHELL PATTERN TESTING" $PowerShellPatternsLog
    Write-DiagnosticLog "========================================" $PowerShellPatternsLog

    $PatternResults = @{}

    # Test 1: Basic 2>&1 redirection
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 1: Basic 2>&1 redirection" -PercentComplete 10
    Write-Host "`n[PATTERN TEST 1] Testing: Basic 2>&1 redirection" -ForegroundColor Yellow
    $Test1 = Invoke-CommandWithAdvancedTimeout -Command "docker --version 2>&1" -Description "Pattern Test: docker --version 2>&1" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -TestPowerShellPattern -ExecutionMethod "Job"
    $PatternResults["Basic2>&1"] = $Test1

    # Test 2: 2>&1 piped to Where-Object filter
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 2: 2>&1 with Where-Object filter" -PercentComplete 20
    Write-Host "`n[PATTERN TEST 2] Testing: 2>&1 | Where-Object filter" -ForegroundColor Yellow
    $Test2Cmd = 'docker --version 2>&1 | Where-Object { $_ -ne $null -and $_ -ne "" }'
    $Test2 = Invoke-CommandWithAdvancedTimeout -Command $Test2Cmd -Description "Pattern Test: 2>&1 | Where-Object filter" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -TestPowerShellPattern -ExecutionMethod "Job"
    $PatternResults["2>&1WithFilter"] = $Test2

    # Test 3: 2>&1 piped to Select-String
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 3: 2>&1 with Select-String" -PercentComplete 30
    Write-Host "`n[PATTERN TEST 3] Testing: 2>&1 | Select-String" -ForegroundColor Yellow
    $Test3Cmd = 'docker --version 2>&1 | Select-String "Docker"'
    $Test3 = Invoke-CommandWithAdvancedTimeout -Command $Test3Cmd -Description "Pattern Test: 2>&1 | Select-String" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -TestPowerShellPattern -ExecutionMethod "Job"
    $PatternResults["2>&1WithSelectString"] = $Test3

    # Test 4: ErrorActionPreference and 2>&1
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 4: ErrorActionPreference with 2>&1" -PercentComplete 40
    Write-Host "`n[PATTERN TEST 4] Testing: ErrorActionPreference with 2>&1" -ForegroundColor Yellow
    $Test4Cmd = '$ErrorActionPreference="Continue"; docker --version 2>&1'
    $Test4 = Invoke-CommandWithAdvancedTimeout -Command $Test4Cmd -Description "Pattern Test: ErrorActionPreference with 2>&1" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -TestPowerShellPattern -ExecutionMethod "Job"
    $PatternResults["ErrorActionWith2>&1"] = $Test4

    # Test 5: Out-String with 2>&1
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 5: Out-String with 2>&1" -PercentComplete 50
    Write-Host "`n[PATTERN TEST 5] Testing: Out-String with 2>&1" -ForegroundColor Yellow
    $Test5Cmd = 'docker --version 2>&1 | Out-String -Width 4096'
    $Test5 = Invoke-CommandWithAdvancedTimeout -Command $Test5Cmd -Description "Pattern Test: Out-String with 2>&1" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -TestPowerShellPattern -ExecutionMethod "Job"
    $PatternResults["OutStringWith2>&1"] = $Test5

    # Test 6: Tee-Object with 2>&1
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 6: Tee-Object with 2>&1" -PercentComplete 60
    Write-Host "`n[PATTERN TEST 6] Testing: Tee-Object with 2>&1" -ForegroundColor Yellow
    $Test6File = Join-Path $LogDir "tee_test_output.txt"
    $Test6Cmd = "docker --version 2>&1 | Tee-Object -FilePath '$Test6File'"
    $Test6 = Invoke-CommandWithAdvancedTimeout -Command $Test6Cmd -Description "Pattern Test: Tee-Object with 2>&1" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -TestPowerShellPattern -ExecutionMethod "Job"
    $PatternResults["TeeObjectWith2>&1"] = $Test6

    # Test 7: CMD wrapper with 2>&1
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 7: CMD wrapper with 2>&1" -PercentComplete 70
    Write-Host "`n[PATTERN TEST 7] Testing: CMD wrapper with 2>&1" -ForegroundColor Yellow
    $Test7 = Invoke-CommandWithAdvancedTimeout -Command "docker --version" -Description "Pattern Test: CMD wrapper method" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -ExecutionMethod "CmdWrapper"
    $PatternResults["CmdWrapper"] = $Test7

    # Test 8: Process method (direct)
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 8: Direct Process method" -PercentComplete 80
    Write-Host "`n[PATTERN TEST 8] Testing: Direct Process method" -ForegroundColor Yellow
    $Test8 = Invoke-CommandWithAdvancedTimeout -Command "docker --version" -Description "Pattern Test: Direct Process method" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -ExecutionMethod "Process"
    $PatternResults["DirectProcess"] = $Test8

    # Test 9: Job method (default)
    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Test 9: Job method (default)" -PercentComplete 90
    Write-Host "`n[PATTERN TEST 9] Testing: Job method (default)" -ForegroundColor Yellow
    $Test9 = Invoke-CommandWithAdvancedTimeout -Command "docker --version" -Description "Pattern Test: Job method" -LogFile $PowerShellPatternsLog -TimeoutSeconds 10 -ExecutionMethod "Job"
    $PatternResults["JobMethod"] = $Test9

    # Convert to JSON with error handling - simplify result objects
    try {
        $JsonOutput = $PatternResults | ConvertTo-Json -Depth 5 -Compress -ErrorAction Stop
        $JsonOutput | Out-File -FilePath (Join-Path $LogDir "powershell_patterns_results.json") -Encoding UTF8 -ErrorAction Stop
    } catch {
        Write-DiagnosticLog "WARNING: Could not save pattern results as JSON: $($_.Exception.Message)" $PowerShellPatternsLog -Level "WARN"
    }

    Write-ProgressStatus -Activity "PowerShell Pattern Testing" -Status "Complete" -PercentComplete 100
    return $PatternResults
}
#endregion

#region Edge Case Testing
function Test-EdgeCases {
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Starting..." -PercentComplete 0

    Write-DiagnosticLog "`n========================================" $EdgeCasesLog
    Write-DiagnosticLog "EDGE CASE TESTING" $EdgeCasesLog
    Write-DiagnosticLog "========================================" $EdgeCasesLog

    $EdgeCaseResults = @{}

    # Edge Case 1: docker ps (known problematic command)
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 1: docker ps" -PercentComplete 10
    Write-Host "`n[EDGE CASE 1] Testing: docker ps" -ForegroundColor Yellow
    $Edge1 = Invoke-CommandWithAdvancedTimeout -Command "docker ps" -Description "Edge Case: docker ps" -LogFile $EdgeCasesLog -TimeoutSeconds 10 -CaptureSilentOutput -ExecutionMethod "Job"
    $EdgeCaseResults["docker_ps"] = $Edge1

    # Edge Case 2: docker ps with CMD wrapper
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 2: docker ps (CMD wrapper)" -PercentComplete 20
    Write-Host "`n[EDGE CASE 2] Testing: docker ps (CMD wrapper)" -ForegroundColor Yellow
    $Edge2 = Invoke-CommandWithAdvancedTimeout -Command "docker ps" -Description "Edge Case: docker ps (CMD wrapper)" -LogFile $EdgeCasesLog -TimeoutSeconds 10 -CaptureSilentOutput -ExecutionMethod "CmdWrapper"
    $EdgeCaseResults["docker_ps_cmd"] = $Edge2

    # Edge Case 3: docker info (daemon connection)
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 3: docker info" -PercentComplete 30
    Write-Host "`n[EDGE CASE 3] Testing: docker info" -ForegroundColor Yellow
    $Edge3 = Invoke-CommandWithAdvancedTimeout -Command "docker info" -Description "Edge Case: docker info" -LogFile $EdgeCasesLog -TimeoutSeconds 15 -CaptureSilentOutput -ExecutionMethod "Job"
    $EdgeCaseResults["docker_info"] = $Edge3

    # Edge Case 4: docker context ls
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 4: docker context ls" -PercentComplete 40
    Write-Host "`n[EDGE CASE 4] Testing: docker context ls" -ForegroundColor Yellow
    $Edge4 = Invoke-CommandWithAdvancedTimeout -Command "docker context ls" -Description "Edge Case: docker context ls" -LogFile $EdgeCasesLog -TimeoutSeconds 10 -CaptureSilentOutput -ExecutionMethod "Job"
    $EdgeCaseResults["docker_context_ls"] = $Edge4

    # Edge Case 5: docker ps -a (all containers)
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 5: docker ps -a" -PercentComplete 50
    Write-Host "`n[EDGE CASE 5] Testing: docker ps -a" -ForegroundColor Yellow
    $Edge5 = Invoke-CommandWithAdvancedTimeout -Command "docker ps -a" -Description "Edge Case: docker ps -a" -LogFile $EdgeCasesLog -TimeoutSeconds 10 -CaptureSilentOutput -ExecutionMethod "Job"
    $EdgeCaseResults["docker_ps_a"] = $Edge5

    # Edge Case 6: docker images
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 6: docker images" -PercentComplete 60
    Write-Host "`n[EDGE CASE 6] Testing: docker images" -ForegroundColor Yellow
    $Edge6 = Invoke-CommandWithAdvancedTimeout -Command "docker images" -Description "Edge Case: docker images" -LogFile $EdgeCasesLog -TimeoutSeconds 10 -CaptureSilentOutput -ExecutionMethod "Job"
    $EdgeCaseResults["docker_images"] = $Edge6

    # Edge Case 7: docker network ls
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 7: docker network ls" -PercentComplete 70
    Write-Host "`n[EDGE CASE 7] Testing: docker network ls" -ForegroundColor Yellow
    $Edge7 = Invoke-CommandWithAdvancedTimeout -Command "docker network ls" -Description "Edge Case: docker network ls" -LogFile $EdgeCasesLog -TimeoutSeconds 10 -CaptureSilentOutput -ExecutionMethod "Job"
    $EdgeCaseResults["docker_network_ls"] = $Edge7

    # Edge Case 8: docker volume ls
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 8: docker volume ls" -PercentComplete 80
    Write-Host "`n[EDGE CASE 8] Testing: docker volume ls" -ForegroundColor Yellow
    $Edge8 = Invoke-CommandWithAdvancedTimeout -Command "docker volume ls" -Description "Edge Case: docker volume ls" -LogFile $EdgeCasesLog -TimeoutSeconds 10 -CaptureSilentOutput -ExecutionMethod "Job"
    $EdgeCaseResults["docker_volume_ls"] = $Edge8

    # Edge Case 9: Invalid command (should produce error)
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 9: Invalid docker command" -PercentComplete 90
    Write-Host "`n[EDGE CASE 9] Testing: Invalid docker command" -ForegroundColor Yellow
    $Edge9 = Invoke-CommandWithAdvancedTimeout -Command "docker invalid-command-that-does-not-exist" -Description "Edge Case: Invalid command" -LogFile $EdgeCasesLog -TimeoutSeconds 10 -CaptureSilentOutput -ExecutionMethod "Job"
    $EdgeCaseResults["docker_invalid"] = $Edge9

    # Edge Case 10: Long-running command (should timeout)
    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Test 10: Long-running command (timeout test)" -PercentComplete 95
    Write-Host "`n[EDGE CASE 10] Testing: Long-running command (should timeout)" -ForegroundColor Yellow
    $Edge10 = Invoke-CommandWithAdvancedTimeout -Command "timeout /t 120 /nobreak" -Description "Edge Case: Long-running command" -LogFile $EdgeCasesLog -TimeoutSeconds 5 -ExecutionMethod "Job"
    $EdgeCaseResults["long_running_timeout"] = $Edge10

    # Convert to JSON with error handling - simplify result objects
    try {
        $JsonOutput = $EdgeCaseResults | ConvertTo-Json -Depth 5 -Compress -ErrorAction Stop
        $JsonOutput | Out-File -FilePath (Join-Path $LogDir "edge_cases_results.json") -Encoding UTF8 -ErrorAction Stop
    } catch {
        Write-DiagnosticLog "WARNING: Could not save edge case results as JSON: $($_.Exception.Message)" $EdgeCasesLog -Level "WARN"
    }

    Write-ProgressStatus -Activity "Edge Case Testing" -Status "Complete" -PercentComplete 100
    return $EdgeCaseResults
}
#endregion

#region Main Execution
# Detect PowerShell version and warn if using 5.1
$PSVersion = $PSVersionTable.PSVersion
$PSEditionValue = $PSVersionTable.PSEdition
$IsPowerShell7 = ($PSVersion.Major -ge 7) -or ($PSEditionValue -eq "Core")

# Force output buffering off for immediate display
try {
    $OutputEncoding = [System.Text.Encoding]::UTF8
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
    # Ignore encoding errors, continue anyway
}

if (-not $IsPowerShell7) {
    Write-Host "`n⚠️  WARNING: Running on PowerShell $($PSVersion.Major).$($PSVersion.Minor) (Desktop Edition)" -ForegroundColor Yellow
    Write-Host "   This script is optimized for PowerShell 7. Some features may not work correctly." -ForegroundColor Yellow
    Write-Host "   To use PowerShell 7, run: pwsh scripts\docker_comprehensive_diagnostics.ps1" -ForegroundColor Yellow
    Write-Host "   Or configure Cursor to use PowerShell 7 as default terminal." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host @"

╔══════════════════════════════════════════════════════════════════════════════╗
║         COMPREHENSIVE DOCKER DIAGNOSTICS FOR POWERSHELL 7                    ║
║                    Cursor IDE Environment                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-DiagnosticLog "========================================" $MainLogFile
Write-DiagnosticLog "COMPREHENSIVE DOCKER DIAGNOSTICS STARTED" $MainLogFile
Write-DiagnosticLog "Timestamp: $Timestamp" $MainLogFile
Write-DiagnosticLog "Output Directory: $LogDir" $MainLogFile
Write-DiagnosticLog "Command Timeout: $CommandTimeout seconds" $MainLogFile
Write-DiagnosticLog "PowerShell Version: $PSVersion" $MainLogFile
Write-DiagnosticLog "PowerShell Edition: $PSEditionValue" $MainLogFile
Write-DiagnosticLog "Is PowerShell 7+: $IsPowerShell7" $MainLogFile
Write-DiagnosticLog "PowerShell Executable: $($PSHOME)" $MainLogFile
Write-DiagnosticLog "========================================" $MainLogFile

Write-Host "`nStarting comprehensive diagnostics..." -ForegroundColor Green
Write-Host "Log directory: $LogDir" -ForegroundColor Gray
Write-Host "Timeout per command: $CommandTimeout seconds" -ForegroundColor Gray
Write-Host ""

# Step 1: File Location Validation
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 1: FILE LOCATION VALIDATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
$FileLocations = Test-FileLocations

# Step 2: Tool Version Validation
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 2: TOOL VERSION VALIDATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
$ToolVersions = Test-ToolVersions

# Step 3: Environment Statistics
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 3: ENVIRONMENT STATISTICS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
$EnvironmentStats = Test-EnvironmentStatistics

# Step 4: PowerShell Pattern Testing
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 4: POWERSHELL PATTERN TESTING" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
$PatternResults = Test-PowerShellPatterns

# Step 5: Edge Case Testing
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 5: EDGE CASE TESTING" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
$EdgeCaseResults = Test-EdgeCases

# Calculate total duration
$TotalDuration = (Get-Date) - $script:StartTime

# Generate Summary Report
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "DIAGNOSTICS SUMMARY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green

$Summary = @{
    Timestamp = $Timestamp
    TotalDuration = "$($TotalDuration.TotalSeconds.ToString('F2')) seconds"
    LogDirectory = $LogDir
    TestStatistics = @{
        TotalTests = $script:TestCount
        PassedTests = $script:PassedTests
        FailedTests = $script:FailedTests
        TimeoutTests = $script:TimeoutTests
        SilentOutputTests = $script:SilentOutputTests
        SuccessRate = if ($script:TestCount -gt 0) { [math]::Round(($script:PassedTests / $script:TestCount) * 100, 2) } else { 0 }
    }
    FileLocations = $FileLocations
    ToolVersions = $ToolVersions
    EnvironmentStats = $EnvironmentStats
    PatternTestResults = $PatternResults
    EdgeCaseResults = $EdgeCaseResults
}

# Convert summary to JSON with error handling and timeout protection
try {
    # Simplify complex nested objects before JSON conversion
    $SummaryCopy = $Summary.PSObject.Copy()
    if ($SummaryCopy.FileLocations) {
        # Already simplified in Test-FileLocations
    }
    if ($SummaryCopy.EnvironmentStats -and $SummaryCopy.EnvironmentStats.Network) {
        if ($SummaryCopy.EnvironmentStats.Network.Adapters) {
            $SummaryCopy.EnvironmentStats.Network.Adapters = $SummaryCopy.EnvironmentStats.Network.Adapters | ConvertTo-Json -Depth 2 -Compress
        }
    }

    $JsonOutput = $SummaryCopy | ConvertTo-Json -Depth 5 -Compress -ErrorAction Stop
    $JsonOutput | Out-File -FilePath (Join-Path $LogDir "comprehensive_summary.json") -Encoding UTF8 -ErrorAction Stop
    Write-DiagnosticLog "Summary JSON saved successfully" $MainLogFile
} catch {
    Write-DiagnosticLog "WARNING: Could not save summary as JSON: $($_.Exception.Message)" $MainLogFile -Level "WARN"
    # Save simplified text version
    "Timestamp: $($Summary.Timestamp)`nDuration: $($Summary.TotalDuration)`nTests: $($Summary.TestStatistics.TotalTests) (Passed: $($Summary.TestStatistics.PassedTests), Failed: $($Summary.TestStatistics.FailedTests))" | Out-File -FilePath (Join-Path $LogDir "summary.txt") -Encoding UTF8
}

Write-Host "`nTest Statistics:" -ForegroundColor Yellow
Write-Host "  Total Tests: $($script:TestCount)" -ForegroundColor White
Write-Host "  Passed: $($script:PassedTests)" -ForegroundColor Green
Write-Host "  Failed: $($script:FailedTests)" -ForegroundColor Red
Write-Host "  Timeouts: $($script:TimeoutTests)" -ForegroundColor Magenta
Write-Host "  Silent Output: $($script:SilentOutputTests)" -ForegroundColor Cyan
Write-Host "  Success Rate: $($Summary.TestStatistics.SuccessRate)%" -ForegroundColor $(if ($Summary.TestStatistics.SuccessRate -ge 80) { "Green" } else { "Yellow" })
Write-Host "`nTotal Duration: $($TotalDuration.TotalSeconds.ToString('F2')) seconds" -ForegroundColor Cyan
Write-Host "`nAll diagnostics saved to: $LogDir" -ForegroundColor Green

Write-DiagnosticLog "========================================" $MainLogFile
Write-DiagnosticLog "COMPREHENSIVE DOCKER DIAGNOSTICS COMPLETE" $MainLogFile
Write-DiagnosticLog "Total Duration: $($TotalDuration.TotalSeconds.ToString('F2')) seconds" $MainLogFile
Write-DiagnosticLog "Total Tests: $($script:TestCount)" $MainLogFile
Write-DiagnosticLog "Passed: $($script:PassedTests)" $MainLogFile
Write-DiagnosticLog "Failed: $($script:FailedTests)" $MainLogFile
Write-DiagnosticLog "Timeouts: $($script:TimeoutTests)" $MainLogFile
Write-DiagnosticLog "Silent Output: $($script:SilentOutputTests)" $MainLogFile
Write-DiagnosticLog "========================================" $MainLogFile

Write-Progress -Activity "Comprehensive Diagnostics" -Completed

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "Diagnostics complete! Check the log directory for detailed results." -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
#endregion

