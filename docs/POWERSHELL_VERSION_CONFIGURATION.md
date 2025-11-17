# PowerShell Version Configuration for Cursor IDE

## Issue
Cursor IDE may be using PowerShell 5.1 (Windows built-in) instead of PowerShell 7, even when PowerShell 7 is installed.

## Understanding the Difference

### PowerShell 5.1 (Windows PowerShell)
- **Executable**: `powershell.exe` (located in `C:\Windows\System32\WindowsPowerShell\v1.0\`)
- **Edition**: Desktop
- **Status**: Built into Windows, cannot be uninstalled
- **Use Case**: Legacy Windows PowerShell, still widely used

### PowerShell 7 (PowerShell Core)
- **Executable**: `pwsh.exe` (typically in `C:\Program Files\PowerShell\7\`)
- **Edition**: Core
- **Status**: Separate installation, actively developed
- **Use Case**: Modern PowerShell with cross-platform support, recommended for new scripts

## Why This Matters

When you run:
```powershell
powershell -File script.ps1
```
It uses PowerShell 5.1.

When you run:
```powershell
pwsh -File script.ps1
```
It uses PowerShell 7.

## Solution: Configure Cursor to Use PowerShell 7

### Option 1: Use Cursor Settings (Recommended)

I've created `.vscode/settings.json` that configures Cursor to use PowerShell 7 by default. This file includes:

1. **PowerShell Extension Settings**: Forces the PowerShell extension to use PowerShell 7
2. **Terminal Profile Settings**: Sets PowerShell 7 as the default terminal
3. **Explicit Path Configuration**: Points to your PowerShell 7 installation

**To apply these settings:**
1. Restart Cursor IDE
2. Open a new terminal (Ctrl+`)
3. Verify with: `$PSVersionTable`

### Option 2: Manual Configuration

If the settings file doesn't work, manually configure:

1. **Open Cursor Settings** (Ctrl+,)
2. **Search for**: `powershell.powerShellDefaultVersion`
3. **Set to**: `PowerShell 7`
4. **Search for**: `terminal.integrated.defaultProfile.windows`
5. **Set to**: `PowerShell`
6. **Add terminal profile**:
   ```json
   "terminal.integrated.profiles.windows": {
     "PowerShell": {
       "source": "PowerShell",
       "path": "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
     }
   }
   ```

### Option 3: Run Scripts Explicitly with PowerShell 7

Instead of:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\docker_comprehensive_diagnostics.ps1
```

Use:
```powershell
pwsh -ExecutionPolicy Bypass -File scripts\docker_comprehensive_diagnostics.ps1
```

Or simply (if in PowerShell 7 terminal):
```powershell
.\scripts\docker_comprehensive_diagnostics.ps1
```

## Verification

### Check Current PowerShell Version
```powershell
$PSVersionTable
```

**PowerShell 7 output:**
```
PSVersion: 7.x.x
PSEdition: Core
```

**PowerShell 5.1 output:**
```
PSVersion: 5.1.xxxxx.xxxxx
PSEdition: Desktop
```

### Check Which Executable is Running
```powershell
$PSHOME
```

**PowerShell 7**: `C:\Program Files\PowerShell\7`
**PowerShell 5.1**: `C:\Windows\System32\WindowsPowerShell\v1.0`

### Check Available PowerShell Versions
```powershell
Get-Command powershell | Select-Object Source
Get-Command pwsh -ErrorAction SilentlyContinue | Select-Object Source
```

## Should You Uninstall PowerShell 5.1?

**NO - Do NOT uninstall PowerShell 5.1!**

Reasons:
1. **System Component**: PowerShell 5.1 is a core Windows component
2. **System Dependencies**: Many Windows system scripts and tools depend on it
3. **Breaking Changes**: Removing it could break system functionality
4. **Not Necessary**: Both versions can coexist peacefully

## Troubleshooting

### Issue: Settings file not taking effect
- **Solution**: Restart Cursor IDE completely
- **Alternative**: Check if settings are in workspace vs user settings

### Issue: PowerShell 7 not found
- **Check**: `Get-Command pwsh` - should show path to pwsh.exe
- **If missing**: Install PowerShell 7 from [Microsoft Store](https://aka.ms/powershell) or [GitHub releases](https://github.com/PowerShell/PowerShell/releases)

### Issue: Terminal still shows PowerShell 5.1
- **Check**: Terminal dropdown (next to + button) - select "PowerShell" profile
- **Verify**: Settings file path is correct for your PowerShell 7 installation
- **Manual**: Open terminal settings and select PowerShell 7 profile

## Script Compatibility

The `docker_comprehensive_diagnostics.ps1` script now:
- ✅ Detects PowerShell version automatically
- ✅ Warns if running on PowerShell 5.1
- ✅ Works on both PowerShell 5.1 and 7 (with some feature limitations on 5.1)
- ✅ Uses compatible syntax for both versions

## Best Practices

1. **Use PowerShell 7 for new scripts**: Better features, cross-platform support
2. **Keep PowerShell 5.1**: Don't remove it, system needs it
3. **Configure IDE**: Set Cursor to use PowerShell 7 by default
4. **Explicit execution**: Use `pwsh` when you need PowerShell 7 specifically
5. **Version detection**: Scripts should check `$PSVersionTable` and adapt

## Additional Resources

- [PowerShell 7 Installation Guide](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows)
- [PowerShell Extension for VS Code/Cursor](https://marketplace.visualstudio.com/items?itemName=ms-vscode.PowerShell)
- [PowerShell 7 vs Windows PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/whats-new/differences-from-windows-powershell)

