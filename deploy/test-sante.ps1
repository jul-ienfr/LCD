# Batterie G-sante (doctrine docs/71, §8 undecies) : L'EXPLOITATION TOURNE-T-ELLE
# VRAIMENT ? Une automatisation morte ne se plaint pas : elle ne fait simplement
# plus rien, et les preuves qu'elle produisait restent en place, périmées mais
# crédibles. Cette batterie mesure la FRAICHEUR de chaque preuve automatique et
# va jusqu'à déclencher la tâche de reprise pour prouver qu'elle s'exécute.
#
#   powershell -ExecutionPolicy Bypass -File ./test-sante.ps1
#
# Checks :
#   1. les 5 tâches planifiées existent et aucune n'est désactivée ;
#   2. aucune tâche en échec répété (code 0 ou « jamais exécutée ») ;
#   3. le dernier snapshot de sauvegarde a moins de 36 h ;
#   4. la dernière passe de batteries a moins de 8 jours ;
#   5. le dernier contrôle d'intégrité du dépôt a moins de 8 jours ;
#   6. le dernier entretien a moins de 8 jours ;
#   7. la tâche de reprise DÉCLENCHÉE écrit son journal (preuve d'exécution) ;
#   8. la veille a produit son état il y a moins de 15 minutes ;
#   9. l'état vérifié versionné a moins de 8 jours (le discours suit la mesure).

param(
    [int]$HeuresSauvegarde = 36,
    [int]$JoursBatteries = 8,
    [int]$JoursDepot = 8,
    [int]$JoursEntretien = 8,
    [int]$MinutesVeille = 15,
    [int]$JoursRapport = 8
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
$veille = Join-Path $ici "veille"

function Verif([string]$label, [bool]$ok) {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label"; $script:KO = $script:KO + 1 }
}
function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function AgeHeures($chemin) {
    if (-not (Test-Path $chemin)) { return -1 }
    return [Math]::Round(((Get-Date) - (Get-Item $chemin).LastWriteTime).TotalHours, 1)
}
function AgeJours($chemin) {
    $h = AgeHeures $chemin
    if ($h -lt 0) { return -1 }
    return [Math]::Round($h / 24, 1)
}

# --- 1-2. Taches planifiees ---------------------------------------------------
$taches = @(Get-ScheduledTask -TaskName "LCD *" -ErrorAction SilentlyContinue)
Verif ("les 5 taches planifiees existent (" + $taches.Count + "/5)") ([bool]($taches.Count -eq 5))
$desactivees = @($taches | Where-Object { $_.State -eq "Disabled" })
Verif ("aucune tache desactivee (" + $desactivees.Count + ")") ([bool]($desactivees.Count -eq 0))
$enEchec = @()
foreach ($t in $taches) {
    $info = Get-ScheduledTaskInfo -TaskName $t.TaskName -ErrorAction SilentlyContinue
    if ($info) {
        #  267011 = jamais executee (planifiee, en attente) : ce n'est pas un echec.
        if ($info.LastTaskResult -ne 0 -and $info.LastTaskResult -ne 267011) { $enEchec += ($t.TaskName + "=" + $info.LastTaskResult) }
    }
}
Verif ("aucune tache en echec (" + (($enEchec -join ", ")) + ")") ([bool]($enEchec.Count -eq 0))

# --- 3. Fraicheur de la sauvegarde -------------------------------------------
$repo = Join-Path $ici "backups/restic"
$pw = Join-Path $ici "backups/.restic-pass"
$snap = (Natif { & docker run --rm -e RESTIC_PASSWORD_FILE=/pw -e RESTIC_REPOSITORY=/repo `
            -v "${repo}:/repo" -v "${pw}:/pw:ro" restic/restic:0.17.3 snapshots --json 2>$null } | Out-String)
$dernier = ""
$max = [datetime]::MinValue
foreach ($m in [regex]::Matches($snap, '"time":"([^"]+)"')) {
    try {
        $d = [datetime]::Parse($m.Groups[1].Value, $null, [System.Globalization.DateTimeStyles]::RoundtripKind)
        if ($d -gt $max) { $max = $d }
    } catch { }
}
if ($max -gt [datetime]::MinValue) { $dernier = $max }
$ageSnap = if ($dernier) { [Math]::Round(((Get-Date).ToUniversalTime() - $dernier.ToUniversalTime()).TotalHours, 1) } else { -1 }
Verif ("dernier snapshot il y a " + $ageSnap + " h (seuil " + $HeuresSauvegarde + " h)") (
    [bool]($ageSnap -ge 0 -and $ageSnap -le $HeuresSauvegarde))

# --- 4-6. Fraicheur des passes -----------------------------------------------
$ageBat = AgeJours (Join-Path $veille "batteries.log")
Verif ("derniere passe de batteries il y a " + $ageBat + " j (seuil " + $JoursBatteries + " j)") (
    [bool]($ageBat -ge 0 -and $ageBat -le $JoursBatteries))
$ageDepot = AgeJours (Join-Path $ici "backups/.derniere-verification")
Verif ("dernier controle d'integrite du depot il y a " + $ageDepot + " j (seuil " + $JoursDepot + " j)") (
    [bool]($ageDepot -ge 0 -and $ageDepot -le $JoursDepot))
$ageEnt = AgeJours (Join-Path $veille "entretien.log")
Verif ("dernier entretien il y a " + $ageEnt + " j (seuil " + $JoursEntretien + " j)") (
    [bool]($ageEnt -ge 0 -and $ageEnt -le $JoursEntretien))

# --- 7. La tache de reprise s'execute VRAIMENT -------------------------------
#  On ne se contente pas de lire un fichier : on declenche la tache planifiee
#  et on attend son journal. C'est la seule facon de prouver que le
#  planificateur sait lancer ce script (leçon des taches creees par schtasks
#  qui ne demarraient jamais, code 267011 en boucle).
$journalReprise = Join-Path $veille "reprise.log"
$avant = if (Test-Path $journalReprise) { (Get-Item $journalReprise).LastWriteTime } else { [datetime]::MinValue }
$lance = $false
try { Start-ScheduledTask -TaskName "LCD reprise hebdo" -ErrorAction Stop; $lance = $true } catch { }
#  On attend la LIGNE DE CONCLUSION, pas la date du fichier : mesure du
#  2026-10-19, le fichier etait ecrit (premiere ligne) quand la lecture a eu
#  lieu, et le check lisait un journal encore en cours d'ecriture.
$contenu = ""
$ecrit = $false
if ($lance) {
    for ($i = 0; $i -lt 48; $i++) {
        Start-Sleep -Seconds 5
        if (Test-Path $journalReprise) {
            #  Le journal est OUVERT par la tache qui l'ecrit (redirection >) :
            #  ReadAllText echoue alors avec « en cours d'utilisation » (mesure).
            #  Lecture partagee obligatoire.
            try {
                $fs = [IO.File]::Open($journalReprise, "Open", "Read", "ReadWrite")
                $sr = New-Object IO.StreamReader($fs, [Text.Encoding]::UTF8)
                $contenu = $sr.ReadToEnd()
                $sr.Dispose(); $fs.Dispose()
            } catch { $contenu = "" }
            if ($contenu -match "RESULTAT :") { $ecrit = $true; break }
        }
    }
}
Verif "la tache de reprise s'execute et va jusqu'a son resultat" ([bool]$ecrit)
if ($ecrit) {
    Verif "son journal dit que la reprise est prouvee" ([bool]($contenu -match "reprise complete prouvee"))
}

# --- 8. La veille respire -----------------------------------------------------
$ageVeille = [Math]::Round((AgeHeures (Join-Path $veille "etat.json")) * 60, 0)
Verif ("la veille a produit son etat il y a " + $ageVeille + " min (seuil " + $MinutesVeille + " min)") (
    [bool]($ageVeille -ge 0 -and $ageVeille -le $MinutesVeille))

# --- 9. Le discours suit la mesure -------------------------------------------
$ageRapport = AgeJours (Join-Path $racine "docs/74-etat-verifie.md")
Verif ("l'etat verifie versionne a " + $ageRapport + " j (seuil " + $JoursRapport + " j)") (
    [bool]($ageRapport -ge 0 -and $ageRapport -le $JoursRapport))

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output ("RESULTAT : l'exploitation tourne vraiment, preuves fraiches (" + $script:N + "/" + $script:N + " OK)")
    exit 0
}
Write-Output ("RESULTAT : " + $script:KO + " ECHEC(S) sur " + $script:N + " - une automatisation est morte ou en retard")
exit $script:KO
