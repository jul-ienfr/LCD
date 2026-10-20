# installer-taches.ps1 — EXPLOITATION AUTOMATIQUE du SAS local (doctrine
# docs/71, V6) : sauvegarde quotidienne, veille reguliere et batteries
# hebdomadaires, planifiees par le Planificateur de taches Windows.
#
#   powershell -ExecutionPolicy Bypass -File ./installer-taches.ps1            # etat
#   powershell -ExecutionPolicy Bypass -File ./installer-taches.ps1 -Installer
#   powershell -ExecutionPolicy Bypass -File ./installer-taches.ps1 -ExecuterMaintenant
#   powershell -ExecutionPolicy Bypass -File ./installer-taches.ps1 -Desinstaller
#
# Pourquoi c'est necessaire : une sauvegarde qui depend d'un geste humain n'est
# pas une sauvegarde (la veille signale deja un snapshot trop ancien). Et une
# tache planifiee qui « a l'air posee » ne suffit pas : -ExecuterMaintenant la
# declenche et VERIFIE son effet (le nombre de snapshots doit augmenter, le
# journal de veille doit etre reecrit), au lieu de croire le planificateur.
#
# Mesure du 2026-10-19 : `schtasks /create ... /tr "\"chemin avec espaces\""`
# cree une tache qui ne demarre JAMAIS (LastTaskResult 267011, aucun journal
# ecrit). On passe donc par l'API Windows (New-ScheduledTaskAction / Register-
# ScheduledTask), qui traite correctement les chemins contenant des espaces.
# Aucune elevation necessaire (taches de l'utilisateur courant).

param(
    [switch]$Installer,
    [switch]$Desinstaller,
    [switch]$ExecuterMaintenant,
    [string]$HeureSauvegarde = "03:00",
    [int]$MinutesVeille = 5,
    [string]$JourBatteries = "Sunday",
    [string]$HeureBatteries = "04:00"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$veilleDir = Join-Path $ici "veille"
New-Item -ItemType Directory -Force -Path $veilleDir | Out-Null

$Taches = @(
    [ordered]@{ nom = "LCD sauvegarde quotidienne"; script = "sauvegarde.ps1"; log = "sauvegarde.log" }
    [ordered]@{ nom = "LCD veille"; script = "veille.ps1"; log = "veille.log" }
    [ordered]@{ nom = "LCD batteries hebdo"; script = "tout-verifier.ps1"; log = "batteries.log" }
)

function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}

function ActionTache($t) {
    $ps = Join-Path $ici $t.script
    $log = Join-Path $veilleDir $t.log
    if (-not (Test-Path $ps)) { Write-Error "script cible absent : $($t.script)" }
    #  Le script tourne par -Command pour pouvoir rediriger TOUTE sa sortie
    #  (y compris les erreurs natives) vers un journal date, sans .cmd
    #  intermediaire.
    $argument = '-NoProfile -ExecutionPolicy Bypass -Command "& ''{0}'' *>> ''{1}''"' -f $ps, $log
    return New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argument -WorkingDirectory $ici
}

function CompteurSnapshots {
    $repo = Join-Path $ici "backups/restic"
    $pass = Join-Path $ici "backups/.restic-pass"
    if (-not (Test-Path (Join-Path $repo "config"))) { return -1 }
    $json = (Natif {
            docker run --rm -e RESTIC_PASSWORD_FILE=/pw -e RESTIC_REPOSITORY=/repo `
                -v "${repo}:/repo" -v "${pass}:/pw:ro" restic/restic:0.17.3 snapshots --json 2>$null
        } | Out-String)
    $i = $json.IndexOf("[")
    if ($i -lt 0) { return -1 }
    return @(($json.Substring($i) | ConvertFrom-Json)).Count
}

if ($Desinstaller) {
    foreach ($t in $Taches) {
        try { Unregister-ScheduledTask -TaskName $t.nom -Confirm:$false -ErrorAction Stop; Write-Output ("  {0} : retiree" -f $t.nom) }
        catch { Write-Output ("  {0} : absente" -f $t.nom) }
    }
    Write-Output "RESULTAT : taches LCD retirees"
    exit 0
}

if ($Installer) {
    Write-Output "== installation des taches LCD"
    foreach ($t in $Taches) {
        $action = ActionTache $t
        $trigger = switch ($t.nom) {
            "LCD sauvegarde quotidienne" { New-ScheduledTaskTrigger -Daily -At $HeureSauvegarde }
            "LCD veille" {
                $debut = (Get-Date).AddMinutes(1)
                New-ScheduledTaskTrigger -Once -At $debut `
                    -RepetitionInterval (New-TimeSpan -Minutes $MinutesVeille) `
                    -RepetitionDuration (New-TimeSpan -Days 3650)
            }
            default { New-ScheduledTaskTrigger -Weekly -DaysOfWeek $JourBatteries -At $HeureBatteries }
        }
        $reglages = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
            -ExecutionTimeLimit (New-TimeSpan -Hours 2)
        Register-ScheduledTask -TaskName $t.nom -Action $action -Trigger $trigger -Settings $reglages `
            -Description "SAS LCD - $($t.script) (genere par deploy/installer-taches.ps1)" -Force | Out-Null
        Write-Output ("  [OK] {0} -> {1}" -f $t.nom, $t.script)
    }
    Write-Output "  -StartWhenAvailable : un poste eteint rattrape la sauvegarde au rallumage"
}

if ($ExecuterMaintenant) {
    Write-Output "== execution immediate et VERIFICATION de l'effet"
    $avant = CompteurSnapshots
    Start-ScheduledTask -TaskName "LCD sauvegarde quotidienne"
    $ok = $false
    $apres = $avant
    for ($i = 0; $i -lt 90; $i++) {
        Start-Sleep -Seconds 5
        $apres = CompteurSnapshots
        if ($apres -gt $avant -and $apres -gt 0) { $ok = $true; break }
    }
    Write-Output ("  sauvegarde : snapshots {0} -> {1}" -f $avant, $apres)
    if (-not $ok) {
        Write-Output "  [KO] la tache de sauvegarde n'a rien ecrit (voir deploy/veille/sauvegarde.log)"
        if (Test-Path (Join-Path $veilleDir "sauvegarde.log")) {
            Write-Output ((Get-Content (Join-Path $veilleDir "sauvegarde.log") -Tail 5) -join "`n")
        }
    }

    $etat = Join-Path $veilleDir "etat.json"
    $avantT = if (Test-Path $etat) { (Get-Item $etat).LastWriteTime } else { [datetime]::MinValue }
    Start-ScheduledTask -TaskName "LCD veille"
    $veilleOk = $false
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Seconds 3
        if ((Test-Path $etat) -and (Get-Item $etat).LastWriteTime -gt $avantT) { $veilleOk = $true; break }
    }
    Write-Output ("  veille : journal reecrit = {0}" -f $veilleOk)
    if ($ok -and $veilleOk) {
        Write-Output "RESULTAT : taches operationnelles (effet mesure, pas declare)"
        exit 0
    }
    Write-Output "RESULTAT : taches posees mais effet NON prouve"
    exit 1
}

# --- Etat par defaut --------------------------------------------------------
#  Lecture par l'API Windows : la sortie texte de schtasks arrive dans la page
#  de codes de la console et rend les libelles accentues illisibles.
Write-Output "== taches LCD"
$trouvees = 0
foreach ($t in $Taches) {
    $tache = $null
    try { $tache = Get-ScheduledTask -TaskName $t.nom -ErrorAction Stop } catch { }
    if ($tache) {
        $trouvees++
        $info = Get-ScheduledTaskInfo -TaskName $t.nom
        $prochaine = if ($info.NextRunTime) { ([datetime]$info.NextRunTime).ToString("yyyy-MM-dd HH:mm") } else { "aucune" }
        $derniere = if ($info.LastRunTime -and ([datetime]$info.LastRunTime).Year -gt 1999) { ([datetime]$info.LastRunTime).ToString("yyyy-MM-dd HH:mm") } else { "jamais" }
        Write-Output ("  [OK] {0} | etat={1} | prochaine={2} | derniere={3} | code={4}" -f `
                $t.nom, $tache.State, $prochaine, $derniere, $info.LastTaskResult)
    } else {
        Write-Output ("  [--] {0} : non planifiee" -f $t.nom)
    }
}
Write-Output ("RESULTAT : {0}/{1} taches planifiees" -f $trouvees, $Taches.Count)
if ($trouvees -lt $Taches.Count) { Write-Output "  installer : -Installer (puis -ExecuterMaintenant pour prouver l'effet)" }
exit 0
