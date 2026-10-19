Set-Location 'D:\VECLab\tools\research\phreeqc-pin\3.8.6-17100\extracted\phreeqc-3.8.6-17100\database'

function Show-Block($file, $headerPattern, $lines) {
  Write-Host ""
  Write-Host "=== $file : $headerPattern ==="
  $content = Get-Content $file
  for ($i = 0; $i -lt $content.Count; $i++) {
    if ($content[$i] -match $headerPattern) {
      $end = [Math]::Min($i + $lines, $content.Count)
      for ($j = $i; $j -lt $end; $j++) {
        Write-Host ("{0,4}: {1}" -f ($j+1), $content[$j])
      }
      Write-Host "---"
    }
  }
}

# Fe hydrolysis in phreeqc.dat
Show-Block phreeqc.dat 'Fe\+3 \+ H2O = FeOH\+2 \+ H\+' 3

# Zn(OH)2 phases in phreeqc.dat
Show-Block phreeqc.dat 'Zn\(OH\)2\(e\)' 4
Show-Block phreeqc.dat 'Zn\(OH\)2$' 4

# Pb(OH)2 in phreeqc.dat
Show-Block phreeqc.dat 'Pb\(OH\)2  389' 4
Show-Block phreeqc.dat 'Pb\(OH\)2$' 4

# HSO4- in phreeqc.dat
Show-Block phreeqc.dat 'H\+ \+ SO4\-2 = HSO4\-' 3

# Zn(OH)2 in minteq.v4.dat
Show-Block minteq.v4.dat 'Zn\(OH\)2\(am\)' 4
Show-Block minteq.v4.dat 'Zn\(OH\)2\(beta\)' 4
Show-Block minteq.v4.dat 'Zn\(OH\)2\(gamma\)' 4
Show-Block minteq.v4.dat '^Zn\(OH\)2$' 4

# Pb(OH)2 in minteq.v4.dat
Show-Block minteq.v4.dat '^Pb\(OH\)2$' 4
Show-Block minteq.v4.dat 'Pb\+2 \+ 2H2O = Pb\(OH\)2 \+ 2 H\+' 3

# Fe solid phases in minteq.v4.dat
Show-Block minteq.v4.dat '^Ferrihydrite' 4
Show-Block minteq.v4.dat '^Goethite' 4

# HSO4- in minteq.v4.dat
Show-Block minteq.v4.dat 'H\+ \+ SO4\-2 = HSO4\-' 3
