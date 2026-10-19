# Pin PHREEQC release and compute SHA-256 hashes.
# Reference: https://water.usgs.gov/water-resources/software/PHREEQC/
#
# Output: tools/research/phreeqc-pin/<release>/{phreeqc-<release>.zip, extracted/, PIN.json, pin.log}

$ErrorActionPreference = "Stop"
$release = "3.8.6-17100"
$url = "https://water.usgs.gov/water-resources/software/PHREEQC/phreeqc-$release.zip"
$repoRoot = "D:\VECLab"
$baseDir = Join-Path $repoRoot "tools\research\phreeqc-pin\$release"
$zipFile = Join-Path $baseDir "phreeqc-$release.zip"
$extractDir = Join-Path $baseDir "extracted"
$pinJson = Join-Path $baseDir "PIN.json"
$logFile = Join-Path $baseDir "pin.log"

# Redirect all output to log too
Start-Transcript -Path $logFile -Force | Out-Null

try {
  Write-Host "=== PHREEQC pin script ==="
  Write-Host "Release: $release"
  Write-Host "URL:     $url"
  Write-Host "Target:  $baseDir"
  Write-Host "Time:    $(Get-Date -Format 'o')"
  Write-Host ""

  # 1. Create directory
  Write-Host "[1/5] Creating directory..."
  New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
  Write-Host "  OK: $baseDir"
  Write-Host ""

  # 2. Download zip
  Write-Host "[2/5] Downloading $url ..."
  Write-Host "      (may take 1-3 minutes depending on connection)"
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    Invoke-WebRequest -Uri $url -OutFile $zipFile -UseBasicParsing -TimeoutSec 300
    $sw.Stop()
    $zipSize = (Get-Item $zipFile).Length
    Write-Host "  OK: downloaded $zipSize bytes in $([math]::Round($sw.Elapsed.TotalSeconds, 1))s"
  } catch {
    $sw.Stop()
    Write-Host "  FAILED after $([math]::Round($sw.Elapsed.TotalSeconds, 1))s"
    Write-Host "  Error: $($_.Exception.Message)"
    throw
  }
  Write-Host ""

  # 3. Hash zip
  Write-Host "[3/5] SHA-256 of zip..."
  $zipHash = (Get-FileHash $zipFile -Algorithm SHA256).Hash
  Write-Host "  $zipHash"
  Write-Host ""

  # 4. Extract
  Write-Host "[4/5] Extracting to $extractDir ..."
  if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
  Expand-Archive $zipFile -DestinationPath $extractDir -Force
  Write-Host "  OK"
  Write-Host "  Top-level entries:"
  Get-ChildItem $extractDir | ForEach-Object { Write-Host "    - $($_.Name)" }
  Write-Host ""

  # 5. Find and hash .dat files
  Write-Host "[5/5] Searching for phreeqc.dat and minteq.v4.dat ..."
  $datFiles = Get-ChildItem $extractDir -Recurse -Include phreeqc.dat, minteq.v4.dat, "*.dat" -ErrorAction SilentlyContinue
  if (-not $datFiles) {
    Write-Host "  No .dat files found. Full tree:"
    Get-ChildItem $extractDir -Recurse | Select-Object FullName | Format-List | Out-String | Write-Host
    throw "No database files found in extracted archive"
  }
  $datHashes = @()
  foreach ($f in $datFiles) {
    $h = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
    $rel = $f.FullName.Substring($extractDir.Length + 1)
    Write-Host "  $rel"
    Write-Host "    size: $($f.Length) bytes"
    Write-Host "    sha256: $h"
    $datHashes += @{
      name = $f.Name
      relativePath = $rel
      absolutePath = $f.FullName
      sha256 = $h
      sizeBytes = $f.Length
    }
  }
  Write-Host ""

  # 6. Generate PIN.json
  Write-Host "=== Generating PIN.json ==="
  $pin = [ordered]@{
    schemaVersion = "1.0.0"
    release = $release
    sourceUrl = $url
    zipFileName = "phreeqc-$release.zip"
    zipSha256 = $zipHash
    zipSizeBytes = (Get-Item $zipFile).Length
    pinnedAt = (Get-Date -Format "o")
    pinnedBy = "agent (Cursor Assistant) at chemistry owner request, 2026-10-16"
    extractedDir = $extractDir
    databaseFiles = $datHashes
    status = "PINNED-EXTRACTED — verification pending; log: $logFile"
    notes = @(
      "Downloaded and hashed on first attempt. Hashes are real, not assumed.",
      "Database version pinned but NO claim has been promoted to source-checked or cross-checked.",
      "Next step: chemistry owner to run the 7 specialized cross-check cases (see registry §5.1.3) on this pinned release and update verificationStatus only after PHREEQC output matches expected within tolerance."
    )
  }
  $pin | ConvertTo-Json -Depth 6 | Set-Content $pinJson -Encoding UTF8
  Write-Host "  Wrote: $pinJson"
  Write-Host ""

  Write-Host "=== SUMMARY ==="
  Write-Host "Release:      $release"
  Write-Host "Zip SHA-256:  $zipHash"
  Write-Host "Zip size:     $((Get-Item $zipFile).Length) bytes"
  Write-Host "Database files found: $($datHashes.Count)"
  foreach ($d in $datHashes) {
    Write-Host "  - $($d.name) ($($d.sizeBytes) bytes) sha256=$($d.sha256)"
  }
  Write-Host ""
  Write-Host "PIN.json: $pinJson"
  Write-Host "Log:      $logFile"

} catch {
  Write-Host ""
  Write-Host "=== FAILED ==="
  Write-Host $_
  exit 1
} finally {
  Stop-Transcript | Out-Null
}
