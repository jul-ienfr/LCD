# serveur-pwa.ps1 — sert le front sur :3101 en mode « lab sans IdP » : c'est le
# prerequis de deploy/test-pwa.ps1 (recette PWA : SW, offline reel, outbox,
# purge).
#
#   powershell -ExecutionPolicy Bypass -File ./serveur-pwa.ps1            # demarre (+ attend /sw.js 200)
#   powershell -ExecutionPolicy Bypass -File ./serveur-pwa.ps1 -Arreter
#   powershell -ExecutionPolicy Bypass -File ./serveur-pwa.ps1 -Etat
#
# POURQUOI CE SCRIPT EXISTE (deux pieges mesures le 2026-10-19) :
#  1. le prerequis note dans test-pwa.ps1 (« npx next start -p 3101 ») est
#     IMPOSSIBLE ici : le front est construit en `output: standalone` et Next 16
#     le dit — le serveur annonce « Ready » puis s'arrete, la batterie mesure
#     une connexion refusee et declare 6 KO sans rapport avec le service worker ;
#  2. lancer `node .next/standalone/server.js` sur l'hote marche mais le
#     processus ne survit pas a la fin de la session de commande (mesure : pid
#     present puis « absent » a l'appel suivant), ce qui rend la recette
#     dependante d'un terminal ouvert.
#
# La solution retenue sert LA MEME IMAGE que la production (lcd-deploy-web),
# dans un conteneur dedie, sans IdP, sur le reseau lab : le build teste est
# donc exactement celui qui tourne (pas un build hote divergent), et le
# conteneur survit a la session.

param(
    [switch]$Arreter,
    [switch]$Etat,
    [int]$Port = 3101,
    [int]$PortInterne = 3100,
    [string]$Image = "lcd-deploy-web",
    [string]$Nom = "lcd-pwa-3101",
    [int]$DelaiSecondes = 45
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)

function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function EnLigne {
    $r = (Natif { & curl.exe -s -o NUL -w "%{http_code}" -m 5 "http://127.0.0.1:$Port/sw.js" 2>$null } | Out-String).Trim()
    return $r -eq "200"
}
function ConteneurExiste {
    #  Le filtre `name=^/nom$` de docker ne rend rien (mesure) : on liste puis on
    #  compare exactement en PowerShell.
    $noms = @(Natif { & docker ps -a --filter "name=$Nom" --format "{{.Names}}" 2>$null })
    return @($noms | Where-Object { "$_".Trim() -eq $Nom }).Count -gt 0
}

if ($Arreter) {
    if (ConteneurExiste) {
        $null = Natif { & docker rm -f $Nom 2>&1 }
        Write-Output "conteneur $Nom retire (port $Port libre)"
    } else {
        Write-Output "aucun conteneur $Nom"
    }
    exit 0
}

if ($Etat) {
    $present = ConteneurExiste
    $serveur = EnLigne
    Write-Output ("conteneur {0} : {1} | http://127.0.0.1:{2}/sw.js -> {3}" -f `
            $Nom, $(if ($present) { "present" } else { "absent" }), $Port, $(if ($serveur) { "200" } else { "non" }))
    exit 0
}

# --- Demarrage ---------------------------------------------------------------
$imgOk = (Natif { & docker image inspect $Image --format "{{.Id}}" 2>$null } | Out-String).Trim()
if (-not $imgOk) { Write-Output "[KO] image absente : $Image (docker compose build web)"; exit 1 }

if (ConteneurExiste) {
    $null = Natif { & docker rm -f $Nom 2>&1 }
    #  Le port met quelques secondes a se liberer apres la suppression : sans
    #  cette attente, le nouveau conteneur ne peut pas se lier et sort aussitot
    #  (mesure : « conteneur demarre mais /sw.js jamais 200 », puis le conteneur
    #  a disparu). On attend un port REELLEMENT libre, pas un delai arbitraire.
    for ($k = 0; $k -lt 15; $k++) {
        $libre = -not (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
        if ($libre) { break }
        Start-Sleep -Seconds 1
    }
}

#  LCD_IDP vide = mode lab (identite par cookie), exactement ce que la recette
#  PWA attend ; la gateway vient du reseau lab partage, comme en production.
#  Pas de --rm : un conteneur sorti disparait et rend le diagnostic impossible
#  (mesure : « No such container » au moment de lire les journaux).
#  NE JAMAIS nommer cette variable $args : c'est une variable AUTOMATIQUE de
#  PowerShell, et le splat @args envoie alors autre chose que ce qu'on croit
#  (3e occurrence du meme piege dans ce depot, apres sauvegarde.ps1 et
#  test-backup.ps1 : ici le conteneur sortait aussitot et /sw.js ne repondait
#  jamais, ce qui ressemblait a un probleme de port).
#  Design du site : même fichier runtime que la stack (super_admin, /systeme).
#  On le monte pour que les batteries puissent PROUVER le basculement depuis
#  l'hôte ; s'il manque, on part de l'example — sinon Docker créerait un
#  DOSSIER à sa place et l'écriture échouerait (piège mesuré sur les mounts).
$fichierDesign = Join-Path (Split-Path $ici -Parent) "custom\design.yaml"
if (-not (Test-Path -LiteralPath $fichierDesign)) {
    Copy-Item -LiteralPath (Join-Path (Split-Path $ici -Parent) "custom\design.yaml.example") -Destination $fichierDesign -Force
}

$cmdDocker = @("run", "-d", "--name", $Nom, "-p", "${Port}:${PortInterne}",
    "--network", "lcd-lab_default", "-e", "LCD_GATEWAY_URL=http://gateway-parc:8443", "-e", "LCD_IDP=",
    "-v", "${fichierDesign}:/app/custom/design.yaml", $Image)
$sortie = (Natif { & docker @cmdDocker 2>&1 } | Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
    #  Le port peut etre encore tenu par le conteneur precedent qui s'arrete :
    #  une seule reprise suffit, on ne masque pas un echec reel.
    Start-Sleep -Seconds 4
    $null = Natif { & docker rm -f $Nom 2>&1 }
    $sortie = (Natif { & docker @cmdDocker 2>&1 } | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        Write-Output "[KO] demarrage impossible : $sortie"
        exit 1
    }
}

$ok = $false
for ($i = 0; $i -lt $DelaiSecondes; $i++) {
    Start-Sleep -Seconds 1
    if (EnLigne) { $ok = $true; break }
}
if ($ok) {
    Write-Output ("serveur pret sur http://127.0.0.1:{0} (conteneur {1}), /sw.js 200" -f $Port, $Nom)
    exit 0
}
Write-Output ("[KO] conteneur demarre mais /sw.js jamais 200")
Write-Output ((Natif { & docker logs --tail 8 $Nom 2>&1 } | Out-String).Trim())
exit 1
