$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskProfilePath = Join-Path $taskRoot '.local/mysql-preview.json'
if (-not (Test-Path -LiteralPath $taskProfilePath)) {
    throw 'No local preview profile. Set up MySQL and api/.env using README.md, then run npm start from api.'
}
$taskProfile = Get-Content -LiteralPath $taskProfilePath -Raw | ConvertFrom-Json
$taskMysqlExe = (Get-Item -LiteralPath $taskProfile.mysqlExe).FullName
$taskData = (Resolve-Path -LiteralPath $taskProfile.dataDirectory).Path
if ((Get-Item -LiteralPath $taskData).Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
    throw 'The preview database directory must not be a link.'
}
$taskDbPort = [int]$taskProfile.databasePort
if ($taskDbPort -lt 1024 -or $taskDbPort -gt 65535) { throw 'Invalid preview port.' }
$taskStartedMysql = $false
$taskMysqlProcess = $null
try {
    $taskListener = Get-NetTCPConnection -LocalPort $taskDbPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($taskListener) {
        $taskExisting = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $taskListener.OwningProcess)
        if (-not $taskExisting.CommandLine -or $taskExisting.CommandLine.IndexOf($taskData, [StringComparison]::OrdinalIgnoreCase) -lt 0) {
            throw 'The preview port belongs to another process. No service was changed.'
        }
    } else {
        $taskBase = Split-Path -Parent (Split-Path -Parent $taskMysqlExe)
        $taskArguments = @('--no-defaults', ('--basedir="' + $taskBase + '"'), ('--datadir="' + $taskData + '"'),
            '--bind-address=127.0.0.1', ('--port=' + $taskDbPort), '--mysqlx=0', '--console')
        $taskMysqlProcess = Start-Process -FilePath $taskMysqlExe -ArgumentList $taskArguments -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $taskRoot '.local/mysql-preview.log') `
            -RedirectStandardError (Join-Path $taskRoot '.local/mysql-preview.err.log')
        $taskStartedMysql = $true
        $taskReady = $false
        for ($taskAttempt = 0; $taskAttempt -lt 50; $taskAttempt++) {
            $taskSocket = [System.Net.Sockets.TcpClient]::new()
            try { $taskSocket.Connect('127.0.0.1', $taskDbPort); $taskReady = $true; break }
            catch { Start-Sleep -Milliseconds 200 }
            finally { $taskSocket.Dispose() }
        }
        if (-not $taskReady) { throw 'The local test database did not start. Check .local/mysql-preview.err.log.' }
    }
    Write-Output ('Preview: http://localhost:' + $taskProfile.websitePort + ' - press Ctrl+C to stop.')
    Push-Location (Join-Path $taskRoot 'api')
    try { & node server.js }
    finally { Pop-Location }
} finally {
    # Stop only the dedicated database process launched by this invocation.
    if ($taskStartedMysql -and $taskMysqlProcess) {
        $taskOwned = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $taskMysqlProcess.Id) -ErrorAction SilentlyContinue
        if ($taskOwned -and $taskOwned.CommandLine -and $taskOwned.CommandLine.IndexOf($taskData, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            $taskAdmin = Join-Path (Split-Path -Parent $taskMysqlExe) 'mysqladmin.exe'
            & $taskAdmin --no-defaults -h 127.0.0.1 -P $taskDbPort -u root shutdown 2>$null
            if ($LASTEXITCODE -ne 0) { Stop-Process -Id $taskMysqlProcess.Id }
        }
    }
}
