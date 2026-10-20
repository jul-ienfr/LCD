# entretien.ps1 — ENTRETIEN PERIODIQUE du SAS local (doctrine docs/71, V6) :
# rotation des journaux d'exploitation, purge des alertes anciennes, etat de
# l'espace disque. Complement du plafond docker (deploy/docker-compose.yml :
# json-file 10 Mo x 3 par conteneur, pose par le demon) : ici ce sont les
# journaux ECRITS PAR NOS SCRIPTS (deploy/veille/*.log, alertes.jsonl), qui
# n'ont aucun plafond naturel et grossiraient indefiniment.
#
#   powershell -ExecutionPolicy Bypass -File ./entretien.ps1
#   powershell -ExecutionPolicy Bypass -File ./entretien.ps1 -DossierLog <dir> -DossierAlertes <dir>
#   powershell -ExecutionPolicy Bypass -File ./entretien.ps1 -JoursAlerte 30 -TailleMoLog 5
#
# Regles appliquees (toutes mesurables) :
#   - un .log > TailleMoLog est renomme en .1 (puis .1 -> .2 -> .3, .3 jete) :
#     on garde toujours le journal courant vide et 3 archives ;
#   - alertes.jsonl : les evenements de plus de JoursAlerte jours sont retires
#     (champ ts, format ISO 8601 UTC) ; le reste est reecrit a l'identique ;
#   - un rapport d'espace disque est imprime (hote + volumes docker), parce que
#     c'est la ressource qui a deja mordu sur cet hote (R-05).
#
# Aucune suppression hors de deploy/veille/ ; -WhatIf montre sans agir.

param(
    [string]$DossierLog,
    [string]$DossierAlertes,
    [int]$TailleMoLog = 5,
    [int]$JoursAlerte = 30,
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
if (-not $DossierLog) { $DossierLog = Join-Path $ici "veille" }
if (-not $DossierAlertes) { $DossierAlertes = $DossierLog }
New-Item -ItemType Directory -Force -Path $DossierLog | Out-Null

$plafond = $TailleMoLog * 1MB
$rapport = New-Object System.Collections.Generic.List[string]

# --- 1. Rotation des journaux ------------------------------------------------
$journaux = @(Get-ChildItem $DossierLog -Filter "*.log" -File -ErrorAction SilentlyContinue)
foreach ($j in $journaux) {
    if ($j.Length -le $plafond) {
        $rapport.Add(("  {0} : {1:N1} Mo (sous le plafond de {2} Mo)" -f $j.Name, ($j.Length / 1MB), $TailleMoLog))
        continue
    }
    if ($WhatIf) {
        $rapport.Add(("  [whatif] {0} : {1:N1} Mo -> rotation" -f $j.Name, ($j.Length / 1MB)))
        continue
    }
    #  Archives : .3 jete, .2 -> .3, .1 -> .2, courant -> .1
    for ($n = 3; $n -ge 1; $n--) {
        $src = "$($j.FullName).$n"
        $dst = "$($j.FullName).$($n + 1)"
        if (Test-Path $src) {
            if ($n -eq 3) { Remove-Item $src -Force }
            else { Move-Item $src $dst -Force }
        }
    }
    Move-Item $j.FullName "$($j.FullName).1" -Force
    New-Item -ItemType File -Path $j.FullName | Out-Null
    $rapport.Add(("  {0} : {1:N1} Mo -> archive .1, journal courant vide" -f $j.Name, ($j.Length / 1MB)))
}

# --- 2. Purge des alertes anciennes -----------------------------------------
$alertes = Join-Path $DossierAlertes "alertes.jsonl"
if (Test-Path $alertes) {
    $lignes = @(Get-Content $alertes | Where-Object { $_.Trim() -ne "" })
    $limite = (Get-Date).ToUniversalTime().AddDays(-$JoursAlerte)
    $gardees = New-Object System.Collections.Generic.List[string]
    $retirees = 0
    $illisibles = 0
    foreach ($l in $lignes) {
        try { $o = $l | ConvertFrom-Json } catch { $illisibles++; continue }
        $ts = [datetime]::MinValue
        if ($o.PSObject.Properties.Name -contains "ts") {
            $null = [datetime]::TryParse($o.ts, [Globalization.CultureInfo]::InvariantCulture,
                [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal, [ref]$ts)
        }
        if ($ts -ne [datetime]::MinValue -and $ts -lt $limite) { $retirees++ } else { $gardees.Add($l) }
    }
    if ($retirees -gt 0 -and -not $WhatIf) {
        $copie = "$alertes.bak"
        Copy-Item $alertes $copie -Force
        [IO.File]::WriteAllText($alertes, (($gardees -join "`n") + $(if ($gardees.Count -gt 0) { "`n" } else { "" })),
            [Text.UTF8Encoding]::new($false))
    }
    $rapport.Add(("  alertes.jsonl : {0} lignes, {1} purgee(s) (> {2} j), {3} gardee(s), {4} illisible(s){5}" -f `
                $lignes.Count, $retirees, $JoursAlerte, $gardees.Count, $illisibles,
                $(if ($WhatIf) { " [whatif]" } else { "" })))
    $archives = @(Get-ChildItem $DossierAlertes -Filter "*.log.*" -File -ErrorAction SilentlyContinue)
    $rapport.Add(("  archives de journaux : {0} fichier(s), {1:N1} Mo" -f $archives.Count,
            (($archives | Measure-Object Length -Sum).Sum / 1MB)))
} else {
    $rapport.Add("  alertes.jsonl : absent (aucune alerte enregistree)")
}

# --- 3. Espace disque -------------------------------------------------------
$disque = Get-PSDrive C -ErrorAction SilentlyContinue
if ($disque) {
    $libre = [double]$disque.Free / 1GB
    $total = ($disque.Used + $disque.Free) / 1GB
    $rapport.Add(("  disque C: {0:N1} Go libres sur {1:N1} Go ({2:N1} %){3}" -f `
                $libre, $total, (100 * $libre / $total),
                $(if ($libre -lt 10) { "  << SOUS LE SEUIL R-05 : compacter le VHDX (admin)" } else { "" })))
}
$df = (& docker system df --format "{{.Type}}={{.Size}}" 2>$null | Out-String).Trim()
if ($df) { $rapport.Add(("  docker : {0}" -f ($df -replace "`r?`n", " | "))) }

Write-Output "== entretien du $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
$rapport | ForEach-Object { Write-Output $_ }
if ($WhatIf) { Write-Output "RESULTAT : simulation (aucune ecriture)" } else { Write-Output "RESULTAT : entretien applique" }
exit 0
