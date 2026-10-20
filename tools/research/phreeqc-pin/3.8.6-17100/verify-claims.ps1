Set-Location -LiteralPath (Join-Path $PSScriptRoot 'database')

function Search-File($file, $pattern, $label, $max) {
  Write-Host ""
  Write-Host "=== $file : $label ==="
  $lines = Get-Content $file
  $found = $lines | Select-String -Pattern $pattern
  if ($found) {
    $found | Select-Object -First $max | ForEach-Object { Write-Host $_.Line }
  } else {
    Write-Host "  (no match)"
  }
}

Search-File phreeqc.dat 'Fe\+3 \+ H2O = FeOH\+2'  'Fe+3 first hydrolysis' 3
Search-File phreeqc.dat 'Zn\+2 \+ 2H2O = Zn\(OH\)2' 'Zn(OH)2(aq) dissolved' 3
Search-File phreeqc.dat 'Pb\+2 \+ 2H2O = Pb\(OH\)2' 'Pb(OH)2(aq) dissolved' 3
Search-File phreeqc.dat 'H2SO4|HSO4\- =' 'H2SO4 second dissociation' 3
Search-File phreeqc.dat 'Ferrihydrite|Goethite' 'Fe solid phases' 3
Search-File phreeqc.dat 'Zn\(OH\)2' 'Zn solid phase entries' 5
Search-File phreeqc.dat 'Pb\(OH\)2|PbO\b' 'Pb solid phase entries' 5

Search-File minteq.v4.dat 'Zn\(OH\)2' 'minteq.v4: Zn(OH)2 entries' 8
Search-File minteq.v4.dat 'Pb\(OH\)2|PbO' 'minteq.v4: Pb(OH)2/PbO entries' 8
Search-File minteq.v4.dat 'Ferrihydrite|Goethite' 'minteq.v4: Fe solid phases' 5
Search-File minteq.v4.dat 'H2SO4|HSO4' 'minteq.v4: H2SO4' 5
