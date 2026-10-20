# durcir-secrets.ps1 — permissions des secrets LOCAUX (doctrine docs/71, §8 duodecies).
#
#   powershell -ExecutionPolicy Bypass -File ./durcir-secrets.ps1 -Verifier   # dit, ne change rien (code 1 si defaut)
#   powershell -ExecutionPolicy Bypass -File ./durcir-secrets.ps1             # applique
#   powershell -ExecutionPolicy Bypass -File ./durcir-secrets.ps1 -WhatIf
#
# POURQUOI : les fichiers de secrets du depot local (mot de passe restic, .env,
# secret TOTP) doivent etre lisibles par le compte qui exploite le SAS, par
# SYSTEM et par les administrateurs — et par PERSONNE d'autre. Mesure du
# 2026-10-19 sur cet hote : `deploy/backups/.restic-pass` portait une entree
# pour un SID NON RESOLU (S-1-5-21-3098198916-...-770848283) avec Write et Read,
# et les trois fichiers heritaient d'entrees sans rapport avec l'exploitation.
# Un SID orphelin qui garde la lecture d'une phrase de passe est exactement le
# genre de trou qu'on ne voit jamais a l'oeil.
#
# Ce script ne touche QUE ces fichiers : aucune autre ACL du disque.

param(
    [switch]$Verifier,
    [switch]$WhatIf,
    [string[]]$Fichiers
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
if (-not $Fichiers -or $Fichiers.Count -eq 0) {
    $Fichiers = @(
        (Join-Path $ici ".env"),
        (Join-Path $ici "backups/.restic-pass"),
        (Join-Path $ici "authelia/totp-secrets.json")
    )
}

function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}

#  Identites autorisees : le compte courant (par SID, insensible au nom), SYSTEM
#  et le groupe des administrateurs. Tout le reste est un defaut.
$moi = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$sidMoi = $moi.User.Value
$autorises = @($sidMoi, "S-1-5-18", "S-1-5-32-544")

function Analyse($chemin) {
    $acl = Get-Acl $chemin
    $defauts = New-Object System.Collections.Generic.List[string]
    foreach ($ace in $acl.Access) {
        $sid = ""
        try { $sid = $ace.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value } catch { $sid = "" }
        if ($sid -and ($autorises -contains $sid)) { continue }
        #  Identite non traduisible ou hors liste : on la signale avec son nom
        #  affiche et son SID, parce que c'est justement le SID qui compte.
        $nom = "$($ace.IdentityReference)"
        $droits = "$($ace.FileSystemRights)"
        $defauts.Add(("{0} [{1}] : {2}" -f $nom, $(if ($sid) { $sid } else { "SID illisible" }), $droits))
    }
    return [ordered]@{ path = $chemin; defauts = $defauts; herite = $acl.AreAccessRulesProtected }
}

#  Sauvegarde des ACL AVANT toute modification : sans filet, un durcissement
#  qui casse un acces legitime est une panne qu'on ne sait plus defaire.
#  Restauration : icacls <dossier parent> /restore <fichier de sauvegarde>
function SauverAcl($chemin, $dossierSauve) {
    New-Item -ItemType Directory -Force -Path $dossierSauve | Out-Null
    $nom = (Split-Path -Leaf $chemin) + "." + (Get-Date -Format "yyyyMMdd-HHmmss") + ".acl"
    $null = Natif { & icacls $chemin /save (Join-Path $dossierSauve $nom) /t 2>&1 }
    return (Join-Path $dossierSauve $nom)
}

function Appliquer($chemin, $defauts = @()) {
    #  /inheritance:r  : coupe l'heritage (les droits du dossier parent cessent)
    #  puis on redonne exactement trois principes. Ordre volontaire.
    $moi2 = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $cmds = @(
        @("icacls", $chemin, "/inheritance:r"),
        @("icacls", $chemin, "/grant:r", "${moi2}:(F)"),
        #  SID et non noms : « Administrators » n'existe pas sur un Windows
        #  francais (mesure : « 0 fichiers correctement traites, echec de 1 »),
        #  alors que *S-1-5-32-544 est vrai partout.
        @("icacls", $chemin, "/grant", "*S-1-5-18:(F)"),
        @("icacls", $chemin, "/grant", "*S-1-5-32-544:(F)")
    )
    foreach ($c in $cmds) {
        $out = (Natif { & $c[0] $c[1] $c[2] $c[3] $c[4] 2>&1 } | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -and $out) { Write-Output ("  ! " + $out) }
    }
    #  Couper l'heritage ne suffit pas pour une entree EXPLICITE : mesure du
    #  2026-10-19, le SID orphelin de .restic-pass a survecu a /inheritance:r.
    #  On le retire nommement, par son SID.
    foreach ($d in $defauts) {
        if ("$d" -match "\[(S-1-[0-9-]+)\]") {
            $sid = $Matches[1]
            $null = Natif { & icacls $chemin /remove:g "*$sid" 2>&1 }
            $null = Natif { & icacls $chemin /remove:d "*$sid" 2>&1 }
        }
    }
}

$totalDefauts = 0
foreach ($f in $Fichiers) {
    if (-not (Test-Path $f)) { Write-Output ("[--] absent : " + $f); continue }
    $a = Analyse $f
    $nomCourt = $f.Replace($ici + "\", "")
    if ($a.defauts.Count -eq 0 -and $a.herite) {
        Write-Output ("[OK] " + $nomCourt + " : heritage coupe, seuls le compte d'exploitation, SYSTEM et les administrateurs ont acces")
        continue
    }
    $totalDefauts += $a.defauts.Count
    Write-Output ("[KO] " + $nomCourt + " : " + $a.defauts.Count + " entree(s) hors liste" + $(if (-not $a.herite) { ", heritage actif" } else { "" }))
    foreach ($d in $a.defauts) { Write-Output ("       " + $d) }

    if ($Verifier) { continue }
    if ($WhatIf) { Write-Output "       [whatif] heritage serait coupe et seuls 3 principes garderaient l'acces"; continue }

    $sauve = SauverAcl $f (Join-Path $ici "veille/acl-avant")
    if ($sauve) { Write-Output ("       ACL sauvegardees : " + (Split-Path -Leaf $sauve)) }
    Appliquer $f $a.defauts
    $apres = Analyse $f
    if ($apres.defauts.Count -eq 0 -and $apres.herite) {
        Write-Output ("       -> durci : " + ($Fichiers.Count) + " fichier(s) traite(s)")
        $totalDefauts -= $a.defauts.Count
    } else {
        Write-Output ("       -> ECHEC du durcissement : " + $apres.defauts.Count + " entree(s) restante(s)")
    }
}

Write-Output ""
if ($Verifier) {
    if ($totalDefauts -eq 0) { Write-Output "RESULTAT : permissions des secrets conformes"; exit 0 }
    Write-Output ("RESULTAT : " + $totalDefauts + " entree(s) d'ACL a corriger (relancer sans -Verifier)")
    exit 1
}
if ($totalDefauts -eq 0) { Write-Output "RESULTAT : permissions des secrets conformes"; exit 0 }
Write-Output ("RESULTAT : " + $totalDefauts + " entree(s) encore hors liste")
exit 1
