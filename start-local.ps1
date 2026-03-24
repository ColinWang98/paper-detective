param(
  [switch] $DryRun
)

$ErrorActionPreference = 'Stop'

function Get-ListeningProcessIds {
  param(
    [int[]] $Ports
  )

  $portPattern = ($Ports | ForEach-Object { [string] $_ }) -join '|'
  $lines = netstat -ano -p tcp | Select-String -Pattern "127\.0\.0\.1:($portPattern)\s+.*LISTENING\s+(\d+)$"
  $ids = @()

  foreach ($line in $lines) {
    $match = [regex]::Match($line.Line, 'LISTENING\s+(\d+)$')
    if ($match.Success) {
      $ids += [int] $match.Groups[1].Value
    }
  }

  return $ids | Sort-Object -Unique
}

function Get-ProcessCommandLine {
  param(
    [int] $ProcessId
  )

  try {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId"
    return $processInfo.CommandLine
  } catch {
    return $null
  }
}

function Stop-StaleProjectServers {
  param(
    [string] $ProjectRoot,
    [int[]] $Ports,
    [switch] $DryRun
  )

  $candidatePids = Get-ListeningProcessIds -Ports $Ports

  foreach ($pid in $candidatePids) {
    if ($pid -eq $PID) {
      continue
    }

    $commandLine = Get-ProcessCommandLine -ProcessId $pid
    if (-not $commandLine) {
      continue
    }

    $normalized = $commandLine.ToLowerInvariant()
    $projectToken = $ProjectRoot.ToLowerInvariant()
    $looksLikeProjectServer =
      $normalized.Contains($projectToken) -or
      $normalized.Contains('paper-detective') -or
      $normalized.Contains('next dev') -or
      $normalized.Contains('npm.cmd run dev')

    if (-not $looksLikeProjectServer) {
      continue
    }

    if ($DryRun) {
      Write-Host "Would stop stale Paper Detective process: PID=$pid"
      Write-Host "CommandLine: $commandLine"
      continue
    }

    try {
      Stop-Process -Id $pid -Force
      Write-Host "Stopped stale Paper Detective process: PID=$pid"
    } catch {
      Write-Warning "Failed to stop stale process PID=$pid"
    }
  }
}

function Get-FreePort {
  param(
    [int[]] $Candidates = @(3000, 3001, 3002, 3003, 3004, 3005)
  )

  foreach ($port in $Candidates) {
    $listener = $null
    try {
      $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
      $listener.Start()
      $listener.Stop()
      return $port
    } catch {
      if ($listener) {
        try { $listener.Stop() } catch {}
      }
    }
  }

  throw 'No free local port was found between 3000 and 3005.'
}

function Wait-ForServer {
  param(
    [string] $Url,
    [int] $TimeoutSeconds = 45
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 750
    }
  }

  return $false
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

if (-not (Test-Path (Join-Path $projectRoot 'package.json'))) {
  throw "package.json was not found in $projectRoot"
}

if (-not (Test-Path (Join-Path $projectRoot 'node_modules'))) {
  throw "node_modules was not found. Run 'npm install' in $projectRoot first."
}

$candidatePorts = @(3000, 3001, 3002, 3003, 3004, 3005)
Stop-StaleProjectServers -ProjectRoot $projectRoot -Ports $candidatePorts -DryRun:$DryRun

$npmCommand = Get-Command npm.cmd -ErrorAction Stop
$selectedPort = Get-FreePort -Candidates $candidatePorts
$startUrl = "http://127.0.0.1:$selectedPort"
$devCommand = "Set-Location '$projectRoot'; `$env:PORT='$selectedPort'; `$env:HOSTNAME='127.0.0.1'; & '$($npmCommand.Source)' run dev"

if ($DryRun) {
  Write-Host "Project root: $projectRoot"
  Write-Host "Selected port: $selectedPort"
  Write-Host "Startup URL: $startUrl"
  Write-Host "Command: $devCommand"
  exit 0
}

Start-Process powershell.exe `
  -WorkingDirectory $projectRoot `
  -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-Command', $devCommand
  )

if (Wait-ForServer -Url $startUrl) {
  Start-Process $startUrl
  Write-Host "Paper Detective is running at $startUrl"
} else {
  Write-Warning "The dev server did not respond within the timeout window. Check the PowerShell window that was opened for startup logs."
}
