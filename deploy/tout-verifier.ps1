# tout-verifier.ps1 — LA commande unique de verification du SAS local
# (doctrine docs/71, §7) : execute toutes les batteries, imprime un tableau
# consolide et sort en code = nombre total d'echecs.
#
#   powershell -ExecutionPolicy Bypass -File ./tout-verifier.ps1
#   powershell -ExecutionPolicy Bypass -File ./tout-verifier.ps1 -Rapide   # saute les plus longues
#   powershell -ExecutionPolicy Bypass -File ./tout-verifier.ps1 -SansVeille
#
# Chaque batterie garde ses propres preuves (elle mesure, elle ne suppose pas) :
# ce script ne fait que les enchainer, compter et journaliser. Son interet est
# de rendre impossible un « c'est vert » partiel : le code de sortie est le
# total des KO, et le journal (deploy/veille/batteries.log, gitignore) garde la
# trace datee de chaque passe.

param(
    [switch]$Rapide,
    [string]$Batterie
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$journal = Join-Path $ici "veille/batteries.log"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $journal) | Out-Null

#  ordre voulu : socle -> donnees -> exploitation -> entree
$toutes = @(
    [ordered]@{ nom = "test-deploy"; lent = $false }
    [ordered]@{ nom = "test-front"; lent = $false }
    [ordered]@{ nom = "test-idp"; lent = $false }
    [ordered]@{ nom = "test-sites"; lent = $false }
    [ordered]@{ nom = "test-secrets"; lent = $false }
    [ordered]@{ nom = "test-donnees"; lent = $false }
    [ordered]@{ nom = "test-pwa"; lent = $false }
    [ordered]@{ nom = "test-super"; lent = $false }
    [ordered]@{ nom = "test-lan"; lent = $true }
    [ordered]@{ nom = "test-veille"; lent = $false }
    [ordered]@{ nom = "test-durcissement"; lent = $true }
    [ordered]@{ nom = "test-backup"; lent = $true }
    [ordered]@{ nom = "test-demarrage"; lent = $true }
)

$liste = if ($Batterie) { @($toutes | Where-Object { $_.nom -eq $Batterie }) } else { $toutes }
if ($Rapide) { $liste = @($liste | Where-Object { -not $_.lent }) }
if ($liste.Count -eq 0) { Write-Error "batterie inconnue : $Batterie" }

$debut = Get-Date
$resultats = @()
$totalKO = 0
$lignes = New-Object System.Collections.Generic.List[string]
$lignes.Add("=== " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + " passe de verification" + $(if ($Rapide) { " (rapide)" } else { "" }))

foreach ($b in $liste) {
    $f = Join-Path $ici "$($b.nom).ps1"
    if (-not (Test-Path $f)) {
        Write-Output ("[--] {0} : script absent" -f $b.nom)
        $resultats += [ordered]@{ nom = $b.nom; ko = -1; resultat = "script absent"; duree = 0 }
        continue
    }
    $t0 = Get-Date
    $sortie = & powershell -NoProfile -ExecutionPolicy Bypass -File $f 2>&1
    $code = $LASTEXITCODE
    $duree = [int]((Get-Date) - $t0).TotalSeconds
    $ko = @($sortie | Select-String -SimpleMatch "[KO]").Count
    $ko = [Math]::Max($ko, [Math]::Max($code, 0))
    $resume = (@($sortie | Select-String -SimpleMatch "RESULTAT").Line | Select-Object -Last 1)
    if (-not $resume) { $resume = "pas de ligne RESULTAT" }
    $totalKO += $ko
    $resultats += [ordered]@{ nom = $b.nom; ko = $ko; resultat = $resume.Trim(); duree = $duree }
    Write-Output ("[{0}] {1} ({2}s) - {3}" -f $(if ($ko -eq 0) { "OK" } else { "KO" }), $b.nom, $duree, $resume.Trim())
    $lignes.Add(("[{0}] {1} ({2}s) - {3}" -f $(if ($ko -eq 0) { "OK" } else { "KO" }), $b.nom, $duree, $resume.Trim()))
}

$total = Get-Date
$lignes.Add("total : $totalKO KO sur $($liste.Count) batteries en $([int]($total - $debut).TotalSeconds)s")
$lignes.Add("")
[IO.File]::AppendAllText($journal, ($lignes -join "`r`n"), [Text.UTF8Encoding]::new($false))

Write-Output ""
Write-Output ("{0}  {1} batterie(s)  {2} KO  {3}s" -f (Get-Date -Format "HH:mm:ss"), $liste.Count, $totalKO, [int]($total - $debut).TotalSeconds)
foreach ($r in $resultats) {
    if ($r.ko -ne 0) { Write-Output ("  a corriger : {0} ({1} KO)" -f $r.nom, $r.ko) }
}
if ($totalKO -eq 0) {
    Write-Output "RESULTAT : TOUT VERT - $($liste.Count) batteries, 0 echec"
} else {
    Write-Output "RESULTAT : $totalKO echec(s) au total"
}
exit $totalKO
