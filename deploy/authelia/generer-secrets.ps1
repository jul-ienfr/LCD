# deploy/authelia/generer-secrets.ps1 - F3 : genere les secrets et comptes
# REELS d'Authelia (jamais versionnes, P1-9). 100% ASCII (lecon cp1252) :
# ce script tourne sous powershell 5.1 (batte repo) ET pwsh 7.
#
# Sortie (toutes gitignorees) :
#   deploy/.env               - secrets de service + mots de passe en clair
#   deploy/authelia/users.yml - comptes reels, hashes bcrypt VRAIS
#
# Usage : powershell -NoProfile -ExecutionPolicy Bypass -File generer-secrets.ps1 [-Force]
#   -Force regenere (REVOQUE les sessions et comptes existants).
#
# Les hashes sont produits par le VRAI binaire authelia:4.39.28
# (`crypto hash generate bcrypt` - l'ancienne commande `hash-password` n'existe
# plus en 4.39, valide sur le binaire). Chaque mot de passe est aleatoire et
# unique, ecrit une seule fois dans deploy/.env (gitignore) : la recette le
# relit de la - aucun mot de passe ne transite par un fichier versionne.
param([switch]$Force)

$ErrorActionPreference = "Stop"
$dirAuth = Split-Path -Parent $MyInvocation.MyCommand.Path
$racine = Split-Path -Parent (Split-Path -Parent $dirAuth)   # deploy/authelia -> depot
$image = "authelia/authelia:4.39.28"
$fenv = Join-Path $racine "deploy/.env"
$fusers = Join-Path $dirAuth "users.yml"

foreach ($f in @($fenv, $fusers)) {
  if ((Test-Path $f) -and -not $Force) {
    Write-Host "DEJA PRESENT (intact, rien n'est ecrase) : $f"
    Write-Host "Regenerer = REVOQUER toutes les sessions : -Force"
    exit 0
  }
}

function Nouveau-Secret([int]$octets) {
  $b = New-Object byte[] $octets
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  [Convert]::ToBase64String($b).Replace("+", "-").Replace("/", "_").TrimEnd("=")
}

function Ecrire-Utf8([string]$chemin, [string]$texte) {
  # UTF-8 sans BOM (docker compose + Authelia : ni BOM ni ANSI).
  [System.IO.File]::WriteAllText($chemin, $texte, [System.Text.UTF8Encoding]::new($false))
}

# 1 compte humain par personne d'acces.yaml accedant a l'origine staff.
# SUJET = id `qui` LCD (zero table de traduction) ; displayname = nom humain
# (portail). Prestataires/voyageurs = PAS de compte IdP (lien magique/PWA).
# Comptes machine (dashboard_hote, passerelle_parc) = jamais d'IdP (LAN seul).
$comptes = @(
  @{ id = "personne_01"; nom = "Claire (super admin)"; email = "claire@lcd.local"; groupes = @("parc_admin") }
  @{ id = "personne_02"; nom = "Alex (admin)";          email = "alex@lcd.local";   groupes = @("parc_admin") }
  @{ id = "personne_03"; nom = "Sam (operateur)";       email = "sam@lcd.local";    groupes = @("parc_operateur") }
  @{ id = "personne_04"; nom = "Ruth (comptable)";      email = "ruth@lcd.local";   groupes = @("parc_operateur") }
  @{ id = "personne_05"; nom = "Marc (proprietaire)";   email = "marc@lcd.local";   groupes = @("parc_tiers") }
  @{ id = "commercial_01"; nom = "Ines (commercial)";   email = "ines@lcd.local";   groupes = @("parc_operateur") }
)

# Secrets de service : 64 octets aleatoires (>= 64 exiges en docs ; le
# comportement runtime face a un secret absent/court est teste par la recette).
$session = Nouveau-Secret 64
$storage = Nouveau-Secret 64

Write-Host "Generation des hashes bcrypt par le vrai binaire $image ..."
$lignes = @(
  "# deploy/authelia/users.yml - comptes IdP REELS (F3). GENERE, gitignore.",
  "# Ne pas editer a la main : powershell generer-secrets.ps1 -Force (revoque tout).",
  "# SUJET = id qui d'custom/acces.yaml ; mots de passe = deploy/.env (gitignore).",
  "",
  "users:"
)
$motsDePasse = @()
foreach ($c in $comptes) {
  $mdp = "LCD-" + (Nouveau-Secret 18)
  $sortie = (docker run --rm $image authelia crypto hash generate bcrypt `
      --password $mdp --no-confirm 2>&1 | Out-String).Trim()
  if ($sortie -notmatch 'Digest:\s+(\$2[aby]\$\d+\$.+)') {
    Write-Host "ECHEC hash pour $($c.id) : $sortie"; exit 1
  }
  $digest = $Matches[1]
  $gr = ($c.groupes | ForEach-Object { "      - $_" }) -join "`n"
  $lignes += @(
    "  $($c.id):",
    "    disabled: false",
    "    displayname: `"$($c.nom)`"",
    "    password: `"$digest`"",
    "    email: `"$($c.email)`"",
    "    groups:",
    $gr
  )
  $motsDePasse += "$($c.id)=$mdp"
  Write-Host "  ok $($c.id) ($($c.nom)) - $($digest.Substring(0, [Math]::Min(12, $digest.Length)))..."
}

Ecrire-Utf8 $fusers (($lignes -join "`n") + "`n")

# deploy/.env : secrets de service (docker compose les interpole via ${...})
# + mots de passe lisibles par la recette et pour la connexion manuelle.
$envLignes = @(
  "# deploy/.env - SECRETS LOCAUX (gitignore, P1-9). Regenerer :",
  "#   powershell deploy/authelia/generer-secrets.ps1 -Force",
  "LCD_AUTHELIA_SESSION_SECRET=$session",
  "LCD_AUTHELIA_STORAGE_KEY=$storage",
  ""
) + $motsDePasse
Ecrire-Utf8 $fenv (($envLignes -join "`n") + "`n")

Write-Host ""
Write-Host "OK : $fusers ($($comptes.Count) comptes, bcrypt reel)"
Write-Host "OK : $fenv (2 secrets de service + $($comptes.Count) mots de passe)"
Write-Host "Rappel : ces fichiers sont GITIGNORES - ne jamais les commiter."