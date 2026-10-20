# inventaire-donnees.ps1 — INVENTAIRE HONNETE des donnees du SAS (doctrine
# docs/71, V2 : « aucune valeur plausible a la place d'une donnee reelle »).
#
#   powershell -ExecutionPolicy Bypass -File ./inventaire-donnees.ps1
#   powershell -ExecutionPolicy Bypass -File ./inventaire-donnees.ps1 -Verifier
#
# Ce que fait le script : il lit TOUTES les fixtures de la pile box
# (lab/**/*.yaml, hors vps-sim) et classe chaque valeur en quatre verdicts
# mesurables, sans jamais juger a la place de l'hote :
#
#   vide        -> "", "?", "note", "-" : CONFORME (R4 : mieux vaut un trou
#                  avoue qu'une valeur inventee) ;
#   placeholder -> la valeur se denonce elle-meme (lab, exemple, demo, test,
#                  todo, a completer, xxx) : A REMPLACER ;
#   source      -> la valeur se retrouve TELLE QUELLE dans docs/ (releve
#                  terrain, procedure, contrat) : justifiee par une piece ;
#   a documenter-> ni vide, ni placeholder, ni retrouvee dans docs/ : la
#                  valeur n'a pas de piece justificative CONNUE. Ce n'est pas
#                  une accusation : c'est la liste de ce qu'il faut rapprocher
#                  d'un releve.
#
# Sortie : docs/73-inventaire-donnees.md (regenerable, versionne) + resume
# console. -Verifier : regenere en memoire et compare au fichier versionne
# (code 1 si l'inventaire a derive, comme rendre-config.ps1 -Verifier).
#
# Aucune ecriture ailleurs ; le script ne modifie JAMAIS une fixture.

param(
    [switch]$Verifier,
    [string[]]$Fichiers = @(),
    [string]$Sortie
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$racine = Split-Path -Parent $ici
if (-not $Sortie) { $Sortie = Join-Path $racine "docs/73-inventaire-donnees.md" }

# --- Corpus documentaire (la piece justificative, chargee une seule fois) ----
$corpus = ""
$docs = Get-ChildItem (Join-Path $racine "docs") -Recurse -Filter *.md -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "73-inventaire-donnees.md" }
foreach ($d in $docs) { $corpus += (Get-Content -Raw $d.FullName) + "`n" }
$corpusMin = $corpus.ToLowerInvariant()

# --- Fixtures a examiner -----------------------------------------------------
if ($Fichiers.Count -eq 0) {
    $Fichiers = @(Get-ChildItem (Join-Path $racine "lab") -Recurse -Include *.yaml, *.yml -File |
            Where-Object { $_.FullName -notmatch "vps-sim|__pycache__" -and $_.Name -notmatch "^docker-compose" } |
            ForEach-Object { $_.FullName })
}

$vide = @("", "?", "note", "-", "~", "null")
$motifPlaceholder = "(?i)\b(lab|exemple|example|demo|test|placeholder|todo|a completer|à compléter|xxx|lorem|fournisseur lab)\b"
$motifTechnique = "^(log\d|box-[\w-]+|[\d\.,]+|[0-9]{4}-[0-9]{2}-[0-9]{2}|true|false|oui|non|https?://\S+|[a-z0-9][a-z0-9\.-]*\.[a-z]{2,10}(/\S*)?)$"
#  Identifiants (QR, codes) : test SENSIBLE A LA CASSE, sinon un simple mot
#  capitalise ("Authelia") serait pris pour un identifiant et jamais evalue.
$motifIdentifiant = "^[A-Z][A-Z0-9_]*(-[A-Z0-9]+)*$"

$lignes = New-Object System.Collections.Generic.List[object]
$techniques = 0
foreach ($f in $Fichiers) {
    $rel = $f.Replace("$racine\", "").Replace("\", "/")
    $clefCourante = ""
    foreach ($l in [IO.File]::ReadAllLines($f, [Text.Encoding]::UTF8)) {
        if ($l -match '^\s*(?:-\s*)?([A-Za-z_][\w\-]*):\s*(.*)$') {
            $clef = $Matches[1]
            $val = $Matches[2].Trim()
            if ($val -eq "" -or $val -eq "|" -or $val -eq ">") { $clefCourante = $clef; continue }
            $val = ($val -replace '\s+#.*$', '').Trim()
            if ($val.StartsWith('"') -and $val.EndsWith('"') -and $val.Length -ge 2) { $val = $val.Substring(1, $val.Length - 2) }
            if ($val.StartsWith("'") -and $val.EndsWith("'") -and $val.Length -ge 2) { $val = $val.Substring(1, $val.Length - 2) }
            $verdict = ""
            if ($vide -contains $val.ToLowerInvariant()) {
                $verdict = "vide"
            } elseif ($val -match $motifPlaceholder) {
                $verdict = "placeholder"
            } elseif (($val -match $motifTechnique) -or ($val -cmatch $motifIdentifiant)) {
                $verdict = "technique"
                $techniques++
            } elseif ($val.Length -ge 4 -and $corpusMin.Contains($val.ToLowerInvariant())) {
                $verdict = "source"
            } else {
                $verdict = "a documenter"
            }
            $lignes.Add([pscustomobject]@{ fichier = $rel; clef = $clef; valeur = $val; verdict = $verdict })
        }
    }
}

$parVerdict = $lignes | Group-Object verdict | Sort-Object Name
$total = $lignes.Count
$compte = @{}
foreach ($g in $parVerdict) { $compte[$g.Name] = $g.Count }
function Nb($k) { if ($compte.ContainsKey($k)) { return [int]$compte[$k] } else { return 0 } }

$sb = New-Object System.Text.StringBuilder
$null = $sb.AppendLine("# 73 - Inventaire des donnees (regenerable)")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("**Genere le** : " + (Get-Date -Format "yyyy-MM-dd HH:mm") + " par ``deploy/inventaire-donnees.ps1`` (doctrine 71, V2).")
$null = $sb.AppendLine("**Ne pas editer a la main** : relancer le script apres tout changement de fixture.")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("## Methode")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("Chaque valeur des fixtures box (``lab/**/*.yaml``, hors ``vps-sim``) est classee en quatre verdicts :")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("| Verdict | Sens |")
$null = $sb.AppendLine("|---|---|")
$null = $sb.AppendLine("| **vide** | chaine vide, ``?``, ``note``, ``-`` : conforme (R4 - un trou avoue vaut mieux qu'une valeur inventee) |")
$null = $sb.AppendLine("| **placeholder** | la valeur se denonce elle-meme (lab, exemple, demo, test, todo, a completer, xxx) : **a remplacer** |")
$null = $sb.AppendLine("| **source** | la valeur se retrouve telle quelle dans ``docs/`` : elle a une piece justificative |")
$null = $sb.AppendLine("| **a documenter** | ni vide, ni placeholder, ni retrouvee dans ``docs/`` : a rapprocher d'un releve terrain |")
$null = $sb.AppendLine("| **technique** | identifiants, dates, nombres, booleens : hors jugement |")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("## Resume")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("| Verdict | Valeurs |")
$null = $sb.AppendLine("|---|---:|")
$null = $sb.AppendLine("| **placeholder** (a remplacer) | " + (Nb "placeholder") + " |")
$null = $sb.AppendLine("| **a documenter** (a rapprocher d'un releve) | " + (Nb "a documenter") + " |")
$null = $sb.AppendLine("| source (justifiee par une piece) | " + (Nb "source") + " |")
$null = $sb.AppendLine("| vide (conforme) | " + (Nb "vide") + " |")
$null = $sb.AppendLine("| technique (hors jugement) | " + (Nb "technique") + " |")
$null = $sb.AppendLine("| **total examine** | **$total** |")
$null = $sb.AppendLine("")

foreach ($v in @("placeholder", "a documenter")) {
    $sel = @($lignes | Where-Object { $_.verdict -eq $v })
    $null = $sb.AppendLine("## " + $(if ($v -eq "placeholder") { "Placeholders a remplacer" } else { "Valeurs a documenter" }) + " ($($sel.Count))")
    $null = $sb.AppendLine("")
    if ($sel.Count -eq 0) {
        $null = $sb.AppendLine("_Aucune._")
        $null = $sb.AppendLine("")
        continue
    }
    $null = $sb.AppendLine("| Fichier | Clef | Valeur |")
    $null = $sb.AppendLine("|---|---|---|")
    foreach ($r in ($sel | Sort-Object fichier, clef)) {
        $val = $r.valeur.Replace("|", "\|")
        $null = $sb.AppendLine("| ``$($r.fichier)`` | ``$($r.clef)`` | $val |")
    }
    $null = $sb.AppendLine("")
}

$null = $sb.AppendLine("## Comment fermer cet inventaire")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("1. chaque **placeholder** est remplace par la donnee reelle du logement (ou par ``?`` si elle n'existe pas) ;")
$null = $sb.AppendLine("2. chaque valeur **a documenter** est rapprochee d'un releve (``docs/log1/``, ``docs/parc/``, contrat) : soit la piece existe et la valeur devient *source*, soit elle est corrigee ;")
$null = $sb.AppendLine("3. relancer ``deploy/inventaire-donnees.ps1`` puis vérifier ``deploy/test-donnees.ps1`` : l'inventaire doit se reduire, jamais grossir.")
$contenu = $sb.ToString()

if ($Verifier) {
    if (-not (Test-Path $Sortie)) {
        Write-Output "[KO] inventaire absent : $Sortie (lancer sans -Verifier)"
        exit 1
    }
    $actuel = Get-Content -Raw $Sortie
    $gauche = ((($actuel -split "\r?\n") | Where-Object { $_ -notmatch '^\*\*Genere le' }) -join "`n").Trim()
    $droite = ((($contenu -split "\r?\n") | Where-Object { $_ -notmatch '^\*\*Genere le' }) -join "`n").Trim()
    if ($gauche -eq $droite) {
        Write-Output "inventaire conforme aux fixtures ($total valeurs examinees)"
        Write-Output "  placeholder=" + (Nb "placeholder") + " a_documenter=" + (Nb "a documenter") + " source=" + (Nb "source") + " vide=" + (Nb "vide") + " technique=" + (Nb "technique")
        exit 0
    }
    Write-Output "[KO] l'inventaire a DERIVE des fixtures : relancer deploy/inventaire-donnees.ps1"
    Write-Output ("  {0} valeurs examinees : placeholder={1} a_documenter={2} source={3} vide={4} technique={5}" -f $total, (Nb "placeholder"), (Nb "a documenter"), (Nb "source"), (Nb "vide"), (Nb "technique"))
    exit 1
}

[IO.File]::WriteAllText($Sortie, $contenu, [Text.UTF8Encoding]::new($false))
Write-Output "inventaire ecrit : $Sortie"
Write-Output ("  {0} valeurs examinees : placeholder={1} a_documenter={2} source={3} vide={4} technique={5}" -f `
        $total, (Nb "placeholder"), (Nb "a documenter"), (Nb "source"), (Nb "vide"), (Nb "technique"))
exit 0
