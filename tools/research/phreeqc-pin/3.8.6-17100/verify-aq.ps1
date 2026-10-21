Set-Location -LiteralPath (Join-Path $PSScriptRoot 'database')

function Show-Lines($file, $pattern, $label, $max) {
  Write-Host ""
  Write-Host "=== $file : $label (max $max lines) ==="
  $lines = Get-Content $file
  $found = $lines | Select-String -Pattern $pattern
  if ($found) {
    $found | Select-Object -First $max | ForEach-Object {
      $lineNo = (Select-String -Path $file -Pattern ([regex]::Escape($_.Line)) -SimpleMatch | Select-Object -First 1).LineNumber
      Write-Host ("{0,5}: {1}" -f $lineNo, $_.Line)
    }
  } else {
    Write-Host "  (no match)"
  }
}

# Find ALL Zn-related lines in phreeqc.dat
Write-Host ""
Write-Host "=== phreeqc.dat : ALL Zn lines (first 30) ==="
Get-Content phreeqc.dat | Select-String -Pattern 'Zn' | Select-Object -First 30 | ForEach-Object {
  $line = $_
  Write-Host $line.Line
}

Write-Host ""
Write-Host "=== phreeqc.dat : ALL Pb lines (first 30) ==="
Get-Content phreeqc.dat | Select-String -Pattern 'Pb' | Select-Object -First 30 | ForEach-Object {
  Write-Host $_.Line
}

Write-Host ""
Write-Host "=== minteq.v4.dat : ALL Zn lines (first 25) ==="
Get-Content minteq.v4.dat | Select-String -Pattern 'Zn' | Select-Object -First 25 | ForEach-Object {
  Write-Host $_.Line
}

Write-Host ""
Write-Host "=== minteq.v4.dat : ALL Pb lines (first 25) ==="
Get-Content minteq.v4.dat | Select-String -Pattern 'Pb' | Select-Object -First 25 | ForEach-Object {
  Write-Host $_.Line
}

Write-Host ""
Write-Host "=== phreeqc.dat : search for -16.9 or -17.12 ==="
Get-Content phreeqc.dat | Select-String -Pattern '\-16\.9|\-17\.12|\-17\.1\b' | ForEach-Object { Write-Host $_.Line }

Write-Host ""
Write-Host "=== minteq.v4.dat : search for -17.794 or -17.094 ==="
Get-Content minteq.v4.dat | Select-String -Pattern '\-17\.794|\-17\.094|\-16\.9' | ForEach-Object { Write-Host $_.Line }
