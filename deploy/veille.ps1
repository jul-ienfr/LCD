# veille.ps1 — VEILLE et ALERTES de la pile locale (doctrine docs/71, V6).
#
#   powershell -ExecutionPolicy Bypass -File ./veille.ps1
#   powershell -ExecutionPolicy Bypass -File ./veille.ps1 -Echouer     # code de sortie = nb d'alertes
#   powershell -ExecutionPolicy Bypass -File ./veille.ps1 -Boucle 60   # surveillance continue
#
# Ce qui est surveille (mesures REELLES, aucun feu vert suppose) :
#   1. passerelle : /health et /ready (ok + erreurs vides),
#   2. front : http://127.0.0.1:3100/,
#   3. entree TLS : https://$HOTE:4001/api/health (Caddy -> passerelle),
#   4. portail IdP : https://auth.$HOTE/api/health,
#   5. conteneurs : etat (running/restarting/unhealthy), redemarrages repetes,
#   6. parc : chaque box doit avoir ete vue il y a moins de -SeuilSite s
#      (site muet = alerte), logements en alerte remontes,
#   7. disque : espace libre < -SeuilDisque %,
#   8. certificat : expiration < -SeuilCertJours jours (lu sur la vraie
#      connexion TLS, pas dans un fichier de config),
#   9. sauvegarde : dernier snapshot restic plus vieux que -SeuilSauvegardeHeures
#      (une sauvegarde qui ne tourne plus est une panne silencieuse).
#
# Sortie : tableau lisible + un enregistrement JSON par alerte ajoute a
# deploy/veille/alertes.jsonl (gitignore) + deploy/veille/etat.json (dernier
# etat complet, pour un tableau de bord). Rien n'est "vert" par defaut : une
# sonde injoignable est une alerte, pas une absence d'information.

param(
    [int]$SeuilSite = 300,
    [int]$SeuilDisque = 10,
    [int]$SeuilCertJours = 14,
    [int]$SeuilSauvegardeHeures = 26,
    [string]$Hote = "lcd.test",
    [string]$Gw = "http://127.0.0.1:8443",
    [string]$Front = "http://127.0.0.1:3100",
    [switch]$Echouer,
    [int]$Boucle = 0
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$dossier = Join-Path $ici "veille"
New-Item -ItemType Directory -Force -Path $dossier | Out-Null
$journal = Join-Path $dossier "alertes.jsonl"
$etatFichier = Join-Path $dossier "etat.json"

function Alerte($id, $gravite, $message, $mesure) {
    # Une alerte est toujours DATE de et MESURE : jamais une impression.
    return [ordered]@{
        ts       = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        id       = $id
        gravite  = $gravite          # critique | attention
        message  = $message
        mesure   = $mesure
    }
}

function Sonder($id, $url, $argsCurl) {
    $code = & curl.exe @argsCurl -s -o NUL -w "%{http_code}" -m 8 $url 2>$null
    if ($code -ne "200") {
        return Alerte $id "critique" "injoignable ou en erreur" "HTTP $code sur $url"
    }
    return $null
}

function PasserUneFois {
    $alertes = @()
    $controles = [ordered]@{}

    # 1-2. Passerelle
    $r = Sonder "http-gw-health" "$Gw/health" @()
    $controles["gw_health"] = if ($r) { "KO" } else { "OK" }
    if ($r) { $alertes += $r }

    $readyTxt = & curl.exe -s -m 8 "$Gw/ready" 2>$null
    $readyOk = $false
    $boxs = @()
    try {
        $ready = ($readyTxt -join "`n") | ConvertFrom-Json
        $readyOk = [bool]$ready.ok -and (@($ready.erreurs).Count -eq 0)
        $boxs = @($ready.boxes)
    } catch { }
    $controles["gw_ready"] = if ($readyOk) { "OK" } else { "KO" }
    if (-not $readyOk) {
        $alertes += Alerte "gw-ready" "critique" "passerelle non prete" ("ok=$($ready.ok) erreurs=" + (@($ready.erreurs) -join ","))
    }

    # 3-4. Entree TLS + portail IdP (le nom d'entree est parametrable, donc on
    #     resout le nom vers la boucle locale : aucune dependance au DNS local).
    $r = Sonder "http-entree" "https://${Hote}:4001/api/health" @("--resolve", "${Hote}:4001:127.0.0.1", "-k")
    $controles["entree_tls"] = if ($r) { "KO" } else { "OK" }
    if ($r) { $alertes += $r }
    $r = Sonder "http-portail" "https://auth.${Hote}/api/health" @("--resolve", "auth.${Hote}:443:127.0.0.1", "-k")
    $controles["portail"] = if ($r) { "KO" } else { "OK" }
    if ($r) { $alertes += $r }

    # 5. Front
    $r = Sonder "http-front" "$Front/" @()
    $controles["front"] = if ($r) { "KO" } else { "OK" }
    if ($r) { $alertes += $r }

    # 6. Conteneurs (etat reel docker, pas une intention).
    #    Un one-shot sorti avec le code 0 (bootstrap, migration) n'est PAS une
    #    panne : on l'ignore explicitement (faux positifs du 2026-10-19 : 3
    #    bootstraps "Exited (0)" signales critiques).
    $ps = @(& docker ps -a --filter "name=lcd-" --format "{{.Names}}|{{.State}}|{{.Status}}" 2>$null)
    $controles["conteneurs"] = "$($ps.Count) inspectes"
    $ignores = 0
    foreach ($l in $ps) {
        $p = $l -split "\|"
        if ($p.Count -lt 3) { continue }
        $nom = $p[0]; $etat = $p[1]; $statut = $p[2]
        if ($etat -eq "exited" -and $statut -match 'Exited \(0\)') { $ignores++; continue }
        if ($etat -ne "running") {
            $alertes += Alerte "conteneur-$nom" "critique" "conteneur arrete" "$etat ($statut)"
        } elseif ($statut -match "(unhealthy|Restarting)") {
            $alertes += Alerte "conteneur-$nom" "critique" "conteneur degrade" $statut
        } else {
            $rc = & docker inspect --format "{{.RestartCount}}" $nom 2>$null
            if ("$rc" -match '^\d+$' -and [int]$rc -ge 3) {
                $alertes += Alerte "conteneur-$nom" "attention" "redemarrages repetes" "RestartCount=$rc"
            }
        }
    }
    if ($ignores -gt 0) { $controles["conteneurs"] = "$($ps.Count) inspectes ($ignores one-shot sortis proprement)" }

    # 7. Parc : une box muette est une alerte, pas un silence.
    $etat = & curl.exe -s -m 10 "$Gw/etat-parc" 2>$null
    $maintenant = (Get-Date).ToUniversalTime()
    $boxes = @()
    try {
        $parc = ($etat -join "`n") | ConvertFrom-Json
        $boxes = @($parc.boxes)
        foreach ($b in $boxes) {
            $vu = [datetime]::Parse($b.last_seen).ToUniversalTime()
            $age = [int]($maintenant - $vu).TotalSeconds
            if ($age -gt $SeuilSite) {
                $alertes += Alerte "site-muet-$($b.box_id)" "critique" "box muette" "vue il y a ${age}s (seuil ${SeuilSite}s, site $($b.site))"
            }
        }
        if ([int]$parc.nb_logements_alertes -gt 0) {
            $alertes += Alerte "parc-alertes" "attention" "logements en alerte" "$($parc.nb_logements_alertes) : " + (@($parc.alertes) -join "; ")
        }
    } catch {
        $alertes += Alerte "parc-illisible" "critique" "etat du parc illisible" "reponse non JSON"
    }
    $controles["sites"] = "$($boxes.Count) box(s)"

    # 8. Disque (la ou vivent les volumes docker)
    try {
        $d = Get-PSDrive -Name ((Get-Location).Path.Substring(0, 1)) -ErrorAction Stop
        $libre = [math]::Round(100 * $d.Free / ($d.Free + $d.Used), 1)
        $controles["disque_libre_pct"] = $libre
        if ($libre -lt $SeuilDisque) {
            $alertes += Alerte "disque" "critique" "espace disque faible" "$libre% libre (seuil ${SeuilDisque}%)"
        }
    } catch { $controles["disque_libre_pct"] = "?" }

    # 9. Certificat : lu sur la VRAIE connexion TLS. Deux regimes, sinon la
    #    regle crie en permanence : la CA INTERNE de Caddy emet des feuilles
    #    courtes (12 h, renouvelees automatiquement) -> on verifie qu'il est
    #    VALIDE et qu'il a bien ete renouvele recemment ; un certificat PUBLIC
    #    (V5, Let's Encrypt) doit avoir plus de -SeuilCertJours devant lui.
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 4001)
        $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, { param($s, $c, $ch, $e) $true })
        $ssl.AuthenticateAsClient($Hote)
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
        $jours = [int]($cert.NotAfter - (Get-Date)).TotalDays
        $heures = [int]($cert.NotAfter - (Get-Date)).TotalHours
        $interne = "$($cert.Issuer)" -match 'Caddy|Local|localhost|LCD'
        $controles["certificat"] = "$($cert.Issuer.Split(',')[0]) (expire dans ${heures}h)"
        if ($cert.NotAfter -lt (Get-Date)) {
            $alertes += Alerte "certificat" "critique" "certificat EXPIRE" "expire depuis $([int]((Get-Date) - $cert.NotAfter).TotalHours)h"
        } elseif ($interne) {
            # Renouvellement attendu : une feuille interne de plus de 3 jours
            # signifie que le renouvellement automatique ne tourne plus.
            if (($cert.NotAfter - $cert.NotBefore).TotalDays -gt 3) {
                $alertes += Alerte "certificat" "attention" "certificat interne non renouvele" "validite de $([int](($cert.NotAfter - $cert.NotBefore).TotalDays)) j (attendu <= 3 j)"
            }
        } elseif ($jours -lt $SeuilCertJours) {
            $alertes += Alerte "certificat" "critique" "certificat public proche de l'expiration" "expire dans $jours j (seuil ${SeuilCertJours} j)"
        }
        $ssl.Dispose(); $tcp.Dispose()
    } catch {
        $controles["certificat"] = "?"
        $alertes += Alerte "certificat" "attention" "certificat illisible" $_.Exception.Message
    }

    # 10. Sauvegarde : une sauvegarde qui ne tourne plus est une panne muette.
    $repo = Join-Path $ici "backups/restic"
    if (Test-Path (Join-Path $repo "config")) {
        $passFile = Join-Path $ici "backups/.restic-pass"
        $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
        $json = (& docker run --rm -e RESTIC_PASSWORD_FILE=/pw -e RESTIC_REPOSITORY=/repo `
                -v "${repo}:/repo" -v "${passFile}:/pw:ro" restic/restic:0.17.3 snapshots --json 2>$null) -join "`n"
        $ErrorActionPreference = $prev
        try {
            $i = $json.IndexOf("[")
            $snaps = ($json.Substring($i) | ConvertFrom-Json)
            $dernier = ($snaps | Sort-Object time | Select-Object -Last 1).time
            $heures = [int](((Get-Date).ToUniversalTime() - [datetime]::Parse($dernier).ToUniversalTime()).TotalHours)
            $controles["sauvegarde_heures"] = $heures
            if ($heures -gt $SeuilSauvegardeHeures) {
                $alertes += Alerte "sauvegarde" "critique" "sauvegarde trop ancienne" "dernier snapshot il y a ${heures} h (seuil ${SeuilSauvegardeHeures} h)"
            }
        } catch {
            $alertes += Alerte "sauvegarde" "attention" "depot de sauvegarde illisible" "restic snapshots --json"
        }
    } else {
        $controles["sauvegarde_heures"] = "aucun depot"
    }

    return @{ alertes = $alertes; controles = $controles }
}

function Rapport($res) {
    $alertes = @($res.alertes)
    $critiques = @($alertes | Where-Object { $_.gravite -eq "critique" }).Count
    Write-Host ("veille " + (Get-Date -Format "HH:mm:ss") + " : " + $alertes.Count + " alerte(s), " + $critiques + " critique(s)")
    foreach ($a in $alertes) {
        Write-Host ("  [" + $a.gravite.ToUpper() + "] " + $a.id + " - " + $a.message + " : " + $a.mesure)
    }
    $c = $res.controles
    Write-Host ("  controles : " + (($c.Keys | ForEach-Object { "$_=$($c[$_])" }) -join " | "))

    if ($alertes.Count -gt 0) {
        $lignes = $alertes | ForEach-Object { ($_ | ConvertTo-Json -Compress) }
        [System.IO.File]::AppendAllText($journal, (($lignes -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))
    }
    $synth = [ordered]@{
        ts       = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        alertes  = $alertes
        controles = $res.controles
    }
    [System.IO.File]::WriteAllText($etatFichier, ($synth | ConvertTo-Json -Depth 6), (New-Object System.Text.UTF8Encoding($false)))
    return $critiques
}

$critiques = 0
if ($Boucle -gt 0) {
    Write-Output "veille continue toutes les ${Boucle}s (Ctrl+C pour arreter)"
    while ($true) {
        $critiques = Rapport (PasserUneFois)
        Start-Sleep -Seconds $Boucle
    }
} else {
    $critiques = Rapport (PasserUneFois)
}

if ($Echouer) { exit $critiques }
exit 0
