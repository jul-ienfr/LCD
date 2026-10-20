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
    [string]$Batterie,
    #  Etat verifie versionne : le rapport est ECRIT par la passe elle-meme, donc
    #  il ne peut pas mentir (il n'est jamais edite a la main). -Rapport "" le
    #  desactive.
    [string]$Rapport = "docs/74-etat-verifie.md",
    #  Front « lab sans IdP » (meme image, conteneur dedie) servant test-front
    #  et test-super : leur identite est un cookie lcd_qui, que la pile
    #  nominale (LCD_IDP=1, Remote-User seul) ignore. Parametrable pour la
    #  batterie G-rapport, qui a besoin d'un rouge REEL et deterministe.
    [string]$FrontLab = "http://127.0.0.1:3101"
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
    [ordered]@{ nom = "test-acces"; lent = $false }
    [ordered]@{ nom = "test-versions"; lent = $false }
    [ordered]@{ nom = "test-export"; lent = $true }
    [ordered]@{ nom = "test-donnees"; lent = $false }
    [ordered]@{ nom = "test-rapport"; lent = $false }
    [ordered]@{ nom = "test-journaux"; lent = $false }
    [ordered]@{ nom = "test-taches"; lent = $true }
    [ordered]@{ nom = "test-pwa"; lent = $false }
    [ordered]@{ nom = "test-super"; lent = $false }
    [ordered]@{ nom = "test-lan"; lent = $true }
    [ordered]@{ nom = "test-lan-acces"; lent = $false }
    [ordered]@{ nom = "test-tls"; lent = $false }
    [ordered]@{ nom = "test-veille"; lent = $false }
    [ordered]@{ nom = "test-durcissement"; lent = $true }
    [ordered]@{ nom = "test-depot"; lent = $false }
    [ordered]@{ nom = "test-entretien"; lent = $false }
    [ordered]@{ nom = "test-docs"; lent = $false }
    [ordered]@{ nom = "test-sante"; lent = $true }
    [ordered]@{ nom = "test-backup"; lent = $true }
    [ordered]@{ nom = "reprise"; lent = $true }
    [ordered]@{ nom = "test-demarrage"; lent = $true }
)

$liste = if ($Batterie) { @($toutes | Where-Object { $_.nom -eq $Batterie }) } else { $toutes }
#  @() garantit un TABLEAU : un [ordered] seul a un .Count egal au nombre de ses
#  cles (2), ce qui faisait afficher « 2 batteries » pour une seule executee.
$liste = @($liste)
if ($Rapide) { $liste = @($liste | Where-Object { -not $_.lent }) }
if ($liste.Count -eq 0) { Write-Error "batterie inconnue : $Batterie" }

$debut = Get-Date
$resultats = @()
$totalKO = 0
$lignes = New-Object System.Collections.Generic.List[string]
$lignes.Add("=== " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + " passe de verification" + $(if ($Rapide) { " (rapide)" } else { "" }))

function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}

#  Etat de regulation IdP remis a zero AVANT chaque batterie : les batteries de
#  recette echouent volontairement (mauvais mot de passe, TOTP faux) et la
#  regulation du plan IdP (3 echecs / 2 min) les compte ; sans cette remise a
#  zero, la batterie suivante mesure le ban laisse par la precedente (mesure du
#  2026-10-19 : test-idp 7 KO en suite, vert isole). Le ban lui-meme reste
#  prouve par test-durcissement, qui le provoque ET le leve.
function EtatPropre {
    $outil = Join-Path $ici "outils/lever-ban-idp.py"
    if (-not (Test-Path $outil)) { return }
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & docker run --rm -v "lcd-deploy_authelia-data:/data" -v "${outil}:/outil.py:ro" `
            python:3.12-slim python /outil.py tous 2>&1 | Out-Null
    } finally { $ErrorActionPreference = $prev }
}

$frontAvant = $env:FRONT
foreach ($b in $liste) {
    EtatPropre
    #  test-front et test-super exigent une identite COOKIE (lcd_qui). La pile
    #  nominale tourne en mode IdP (LCD_IDP=1) : identite.ts ne lit alors QUE
    #  Remote-User, donc les ecritures et les pages /secrets /support sont
    #  refusees (mesure du 2026-10-20 : 7 KO + 3 KO a chaque passe, un rouge
    #  permanent qui masque les vrais). On les sert depuis :3101 en mode lab
    #  sans IdP — MEME image que la production, conteneur dedie — comme
    #  test-pwa ; le mode IdP reste couvert par test-idp.ps1.
    $estFrontLab = $b.nom -in @("test-front", "test-super")
    if ($b.nom -eq "test-pwa" -or $estFrontLab) {
        $prep = (Natif { powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $ici "serveur-pwa.ps1") 2>&1 } | Out-String)
        if ($LASTEXITCODE -ne 0) { Write-Output "[--] $($b.nom) : prerequisite :3101 non fourni"; Write-Output ($prep.Trim()) }
        if ($estFrontLab) { $env:FRONT = $FrontLab }
    }
    $f = Join-Path $ici "$($b.nom).ps1"
    if (-not (Test-Path $f)) {
        Write-Output ("[--] {0} : script absent" -f $b.nom)
        $resultats += [ordered]@{ nom = $b.nom; ko = -1; resultat = "script absent"; duree = 0 }
        #  Ne pas laisser le serveur lab ni FRONT derriere un script absent.
        if ($b.nom -eq "test-pwa" -or $estFrontLab) {
            if ($estFrontLab) {
                if ($null -eq $frontAvant) { Remove-Item Env:FRONT -ErrorAction SilentlyContinue }
                else { $env:FRONT = $frontAvant }
            }
            $null = (Natif { powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $ici "serveur-pwa.ps1") -Arreter 2>&1 } | Out-String)
        }
        continue
    }
    $t0 = Get-Date
    #  EAP Continue le temps de l'appel : un enfant qui ecrit sur stderr
    #  (ex. node qui affiche une trace) produit un ErrorRecord et, avec EAP
    #  Stop, tuait la passe ENTIERE au milieu (mesure du 2026-10-19 : la suite
    #  s'arretait apres test-journaux, code de sortie 0 trompeur).
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { $sortie = & powershell -NoProfile -ExecutionPolicy Bypass -File $f 2>&1 | Out-String }
    finally {
        $ErrorActionPreference = $prev
        if ($estFrontLab) {
            #  Restaure l'environnement de l'appelant et rend la pile a sa
            #  forme nominale : le conteneur :3101 n'existe que le temps de la
            #  batterie (sinon la veille voit un conteneur de plus).
            if ($null -eq $frontAvant) { Remove-Item Env:FRONT -ErrorAction SilentlyContinue }
            else { $env:FRONT = $frontAvant }
        }
    }
    $code = $LASTEXITCODE
    $sortie = $sortie -split "\r?\n"
    #  Le serveur :3101 n'existe que pour les batteries front/PWA : on le retire
    #  apres pour que la pile garde sa forme nominale (sinon la veille voit un
    #  conteneur de plus et la comparaison de parc devient ambiguë).
    if ($b.nom -eq "test-pwa" -or $estFrontLab) {
        $null = (Natif { powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $ici "serveur-pwa.ps1") -Arreter 2>&1 } | Out-String)
    }
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


# --- Etat verifie versionne --------------------------------------------------
if ($Rapport) {
    $cheminRapport = if ([IO.Path]::IsPathRooted($Rapport)) { $Rapport } else { Join-Path (Split-Path -Parent $ici) $Rapport }
    $commit = (Natif { git -C (Split-Path -Parent $ici) rev-parse --short HEAD 2>$null } | Out-String).Trim()
    $branche = (Natif { git -C (Split-Path -Parent $ici) rev-parse --abbrev-ref HEAD 2>$null } | Out-String).Trim()
    $sales = @(Natif { git -C (Split-Path -Parent $ici) status --porcelain 2>$null }).Count
    $volumes = @(Natif { docker volume ls --filter "name=lcd-" --format "{{.Name}}" 2>$null }).Count

    $md = New-Object System.Collections.Generic.List[string]
    $md.Add("# 74 - Etat verifie du SAS (genere)")
    $md.Add("")
    $md.Add("**Genere le** : " + (Get-Date -Format "yyyy-MM-dd HH:mm") + " par ``deploy/tout-verifier.ps1``.")
    $md.Add("**Ne pas editer a la main** : relancer la passe pour actualiser (c'est le seul mode d'ecriture).")
    $md.Add("")
    $md.Add("## Environnement mesure")
    $md.Add("")
    $md.Add("| Fait | Valeur |")
    $md.Add("|---|---|")
    $md.Add("| Commit | ``$commit`` sur ``$branche`` |")
    $md.Add("| Fichiers non commites | $sales |")
    $md.Add("| Volumes ``lcd-*`` | $volumes |")
    foreach ($svc in @("lcd-deploy-web-1", "lcd-deploy-authelia-1", "lcd-deploy-caddy-1")) {
        $id = (Natif { docker inspect --format "{{.Image}}" $svc 2>$null } | Out-String).Trim()
        $cree = (Natif { docker inspect --format "{{.Created}}" $svc 2>$null } | Out-String).Trim()
        if ($id) {
            $court = $id.Replace("sha256:", "").Substring(0, 12)
            $quand = if ($cree.Length -ge 16) { $cree.Substring(0, 16) } else { $cree }
            $md.Add("| Image $svc | ``$court`` (creee $quand) |")
        }
    }
    $md.Add("")
    $md.Add("## Resultat de la passe")
    $md.Add("")
    $md.Add("| Batterie | Duree | KO | Ligne RESULTAT |")
    $md.Add("|---|---:|---:|---|")
    foreach ($r in $resultats) {
        $md.Add(("| {0} | {1} s | {2} | {3} |" -f $r.nom, $r.duree, $r.ko, ($r.resultat -replace '\|', '\|')))
    }
    $md.Add("")
    $md.Add(("**Total : {0} KO sur {1} batteries, {2} s.**" -f $totalKO, $liste.Count, [int]($total - $debut).TotalSeconds))
    $md.Add("")
    $md.Add("_La ligne ``test-rapport`` refere l'etat du rapport **precedent** : la batterie verifie un document ecrit, donc elle ne peut pas valider sa propre ecriture dans la meme passe. Ce n'est plus une source de rouge permanent depuis que le controle du nombre de volumes accepte les deux lectures (avant et apres la sous-passe) : des volumes apparaissent et disparaissent pendant une mesure._")
    $md.Add("")
    $rouges = @($resultats | Where-Object { $_.ko -ne 0 })
    $md.Add("## Ce qui est rouge, et ou c'est suivi")
    $md.Add("")
    if ($rouges.Count -eq 0) {
        $md.Add("_Aucun echec : toutes les batteries mesurees sont vertes._")
    } else {
        $md.Add("| Batterie | KO | A suivre |")
        $md.Add("|---|---:|---|")
        foreach ($r in $rouges) {
            $md.Add(("| {0} | {1} | voir la ligne RESULTAT et le journal ``deploy/veille/batteries.log`` |" -f $r.nom, $r.ko))
        }
        $md.Add("")
        $md.Add("Un rouge n'est jamais masque : il est compte dans le code de sortie de la passe.")
    }
    $md.Add("")
    [IO.File]::WriteAllText($cheminRapport, (($md -join "`n") + "`n"), [Text.UTF8Encoding]::new($false))
    Write-Output ("etat verifie ecrit : {0}" -f $cheminRapport)
}

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
