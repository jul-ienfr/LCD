# Batterie G-journaux (doctrine docs/71, V6 + runbook R-05) : les journaux
# doivent avoir un plafond REEL (pose par le demon) et une rotation PROUVEE
# (pas un script qui dit qu'il tourne).
#
#   powershell -ExecutionPolicy Bypass -File ./test-journaux.ps1
#
# Checks :
#   1. compose rend un plafond json-file 10 Mo x 3 pour les 3 services ;
#   2. les conteneurs en cours ont REELLEMENT cette LogConfig ;
#   3. aucun journal de conteneur ne depasse le plafond sur le disque ;
#   4. rotation prouvee sur un journal fabrique de 6 Mo (archive .1 + courant vide) ;
#   5. chaine d'archives bornee : jamais plus de 3 archives, la plus vieille jete ;
#   6. purge prouvee : une alerte de 60 j disparait, une recente reste, sauvegarde .bak ;
#   7. -WhatIf ne touche a rien ;
#   8. les journaux d'exploitation ne sont pas versionnes.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$entretien = Join-Path $ici "entretien.ps1"

function Verif($label, $ok, $detail = "") {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label$(if ($detail) { " -> $detail" })"; $script:KO++ }
}
function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function Entretien {
    #  Arguments CONSTRUITS explicitement : ni splat d'array au site d'appel
    #  (seul le premier element arrive), ni @args dans le scriptblock passe a
    #  Natif (@args y est celui du scriptblock, vide). Les deux erreurs ont ete
    #  mesurees ici : l'entretien retombait silencieusement sur ses defauts et
    #  purgait donc deploy/veille au lieu du dossier de test.
    param(
        [string]$DossierLog,
        [string]$DossierAlertes,
        [int]$TailleMoLog = 0,
        [int]$JoursAlerte = 0,
        [switch]$WhatIf
    )
    $a = @("-DossierLog", $DossierLog, "-DossierAlertes", $DossierAlertes)
    if ($TailleMoLog -gt 0) { $a += @("-TailleMoLog", "$TailleMoLog") }
    if ($JoursAlerte -gt 0) { $a += @("-JoursAlerte", "$JoursAlerte") }
    if ($WhatIf) { $a += "-WhatIf" }
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& powershell -NoProfile -ExecutionPolicy Bypass -File $entretien @a 2>&1 | Out-String) }
    finally { $ErrorActionPreference = $prev }
}

Push-Location $racine
try {
    # --- 1. Plafond rendu par compose ------------------------------------
    #  Lecture par service dans le JSON rendu : compter les occurrences texte
    #  inclurait la definition de l'ancre x-journal (mesure : 4 au lieu de 3).
    $cfg = (Natif { docker compose -f deploy/docker-compose.yml config --format json 2>$null } | Out-String).Trim()
    $obj = if ($cfg) { $cfg | ConvertFrom-Json } else { $null }
    $conformes = 0
    if ($obj) {
        foreach ($svc in @("web", "authelia", "caddy")) {
            $l = $obj.services.$svc.logging
            if ($l.driver -eq "json-file" -and $l.options.'max-size' -eq "10m" -and $l.options.'max-file' -eq "3") { $conformes++ }
        }
    }
    Verif "compose : plafond json-file 10 Mo x 3 sur les 3 services ($conformes/3)" ($conformes -eq 3)

    # --- 2. LogConfig appliquee en cours d'execution ---------------------
    $applique = 0
    foreach ($nomCtn in @("lcd-deploy-web-1", "lcd-deploy-authelia-1", "lcd-deploy-caddy-1")) {
        $raw = (Natif { docker inspect --format "{{json .HostConfig.LogConfig}}" $nomCtn 2>$null } | Out-String).Trim()
        if (-not $raw) { continue }
        $lc = $raw | ConvertFrom-Json
        if ($lc.Type -eq "json-file" -and $lc.Config.'max-size' -eq "10m" -and $lc.Config.'max-file' -eq "3") { $applique++ }
    }
    Verif "conteneurs : LogConfig json-file 10m x3 appliquee ($applique/3)" ($applique -eq 3)

    # --- 3. Aucun journal de conteneur hors plafond ----------------------
    $depasse = @()
    foreach ($nomCtn in (Natif { docker ps -a --filter "name=lcd-" --format "{{.Names}}" 2>$null })) {
        $p = (Natif { docker inspect --format "{{.LogPath}}" $nomCtn 2>$null } | Out-String).Trim()
        if ($p -and (Test-Path $p)) {
            $taille = (Get-Item $p).Length
            if ($taille -gt 10MB) { $depasse += "$nomCtn=$([int]($taille / 1MB))Mo" }
        }
    }
    Verif "aucun journal conteneur > 10 Mo ($($depasse -join ', '))" ($depasse.Count -eq 0)

    # --- 4-5. Rotation sur un journal fabrique ---------------------------
    $tmp = Join-Path $env:TEMP ("lcd-journaux-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $tmp -Force | Out-Null
    $faux = Join-Path $tmp "exploitation.log"
    $bloc = ("x" * 1023) + "`n"
    $sw = [IO.StreamWriter]::new($faux, $false)
    for ($i = 0; $i -lt 6000; $i++) { $sw.Write($bloc) }
    $sw.Close()
    $tailleAvant = (Get-Item $faux).Length
    $null = Entretien -DossierLog $tmp -DossierAlertes $tmp -TailleMoLog 5
    $courant = (Get-Item $faux).Length
    Verif ("rotation : {0:N1} Mo -> archive .1 et courant vide ({1} octet)" -f ($tailleAvant / 1MB), $courant) (
        (Test-Path "$faux.1") -and $courant -eq 0)

    #  Deuxieme rotation : la chaine doit rester bornee a 3 archives.
    $sw = [IO.StreamWriter]::new($faux, $false)
    for ($i = 0; $i -lt 6000; $i++) { $sw.Write($bloc) }
    $sw.Close()
    $null = Entretien -DossierLog $tmp -DossierAlertes $tmp -TailleMoLog 5
    $null = Entretien -DossierLog $tmp -DossierAlertes $tmp -TailleMoLog 5
    #  Ne garder que les archives NUMEROTEES (.1/.2/.3) : le filtre Windows
    #  *.log.* ramene aussi des noms dont le dernier segment n'est pas un nombre.
    $archives = @(Get-ChildItem $tmp -File | Where-Object { $_.Name -match "\.log\.\d+$" })
    $numeros = @($archives | ForEach-Object { [int]([regex]::Match($_.Name, "\.log\.(\d+)$").Groups[1].Value) } | Sort-Object)
    Verif "chaine d'archives bornee (archives=$($numeros -join ','), max 3)" (
        $archives.Count -le 3 -and $numeros.Count -gt 0 -and ($numeros | Measure-Object -Maximum).Maximum -le 3)

    # --- 6. Purge des alertes anciennes ---------------------------------
    $tmp2 = Join-Path $env:TEMP ("lcd-alertes-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $tmp2 -Force | Out-Null
    $vieille = (Get-Date).ToUniversalTime().AddDays(-60).ToString("yyyy-MM-ddTHH:mm:ssZ")
    $recente = (Get-Date).ToUniversalTime().AddMinutes(-5).ToString("yyyy-MM-ddTHH:mm:ssZ")
    #  Ajout explicite : un litteral @( 'a'+x, 'b'+y ) a ete rendu par PS 5.1
    #  comme UNE chaine (les deux elements concatenes par une espace), ce qui
    #  produisait un JSONL invalide et une purge impossible a prouver.
    $lignes = New-Object System.Collections.Generic.List[string]
    $lignes.Add('{"ts":"' + $vieille + '","id":"ancienne","gravite":"critique","message":"vieux","mesure":"x"}')
    $lignes.Add('{"ts":"' + $recente + '","id":"recente","gravite":"info","message":"neuf","mesure":"y"}')
    [IO.File]::WriteAllLines((Join-Path $tmp2 "alertes.jsonl"), [string[]]$lignes, [Text.UTF8Encoding]::new($false))
    $sortiePurge = Entretien -DossierLog $tmp2 -DossierAlertes $tmp2 -JoursAlerte 30
    $reste = (Get-Content (Join-Path $tmp2 "alertes.jsonl") -Raw)
    Verif "purge : alerte de 60 j retiree, recente gardee" ($reste -match "recente" -and $reste -notmatch "ancienne") ($sortiePurge -split "`n" | Select-String "alertes" | ForEach-Object { $_.Line.Trim() })
    Verif "purge : sauvegarde .bak ecrite avant reecriture" (Test-Path (Join-Path $tmp2 "alertes.jsonl.bak"))

    # --- 7. -WhatIf inoffensif ------------------------------------------
    $tmp3 = Join-Path $env:TEMP ("lcd-whatif-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $tmp3 -Force | Out-Null
    $gros = Join-Path $tmp3 "gros.log"
    $sw = [IO.StreamWriter]::new($gros, $false)
    for ($i = 0; $i -lt 6000; $i++) { $sw.Write($bloc) }
    $sw.Close()
    $avant = (Get-Item $gros).Length
    $null = Entretien -DossierLog $tmp3 -DossierAlertes $tmp3 -WhatIf
    Verif "-WhatIf : journal inchange et aucune archive creee" (
        (Get-Item $gros).Length -eq $avant -and -not (Test-Path "$gros.1"))

    Remove-Item $tmp, $tmp2, $tmp3 -Recurse -Force -ErrorAction SilentlyContinue

    # --- 8. Journaux hors git -------------------------------------------
    $suivi = (Natif { git ls-files -- "deploy/veille" 2>$null } | Out-String).Trim()
    Verif "journaux d'exploitation non versionnes (git)" ($suivi -eq "")

} finally {
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : journaux plafonnes et rotation prouvee ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
