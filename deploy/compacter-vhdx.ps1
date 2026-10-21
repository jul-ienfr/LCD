# compacter-vhdx.ps1 - RECUPERER L'ESPACE PRISONNIER DU DISQUE DOCKER
#
# Probleme mesure (2026-10-21) : docker_data.vhdx fait 49,95 Go alors que les
# donnees reelles pesent ~9 Go. Les images supprimees ne rendent rien a Windows :
# un VHDX ne retrecit jamais tout seul. 40 Go sont donc bloques, et le disque C:
# est a 3,7 % libre.
#
# Ce script fait la seule operation qui rend l'espace : arreter Docker et WSL,
# puis compacter le disque virtuel. Il exige les droits ADMINISTRATEUR (Hyper-V
# et diskpart refusent sans elevation) : c'est pour cela qu'il est lance par
# compacter-vhdx.cmd, qui demande l'elevation.
#
# GARDE-FOUS : refuse de compacter si le disque est encore ouvert par un
# processus (sinon la compaction echoue ou corrompt), verifie que les donnees
# sont revenues apres redemarrage, et journalise tout dans compaction.log.
#
# Utilisation :
#   -Simuler   : n'arrete rien, affiche seulement l'etat et le plan (sans admin)
#   (sans argument, en administrateur) : execute la compaction
param([switch]$Simuler)

$ErrorActionPreference = "Stop"
$vhdx = Join-Path $env:LOCALAPPDATA "Docker\wsl\disk\docker_data.vhdx"
$log = Join-Path $PSScriptRoot "compaction.log"
$dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"

function Journal([string]$ligne) {
    $h = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $ligne
    Write-Host $h
    Add-Content -Path $log -Value $h -Encoding UTF8
}

function TailleGo([string]$chemin) {
    if (-not (Test-Path $chemin)) { return $null }
    return [Math]::Round((Get-Item $chemin).Length / 1GB, 2)
}

Journal "=== compaction du disque Docker ==="
$estAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
Journal "administrateur : $estAdmin"

if (-not (Test-Path $vhdx)) {
    Journal "ECHEC : disque introuvable ($vhdx). Rien n'a ete modifie."
    exit 2
}

$avant = TailleGo $vhdx
$libreAvant = [Math]::Round((Get-PSDrive C).Free / 1GB, 1)
Journal "disque virtuel : $avant Go"
Journal "libre sur C: : $libreAvant Go"

if ($avant -lt 5) {
    Journal "rien a faire : le disque fait moins de 5 Go."
    exit 0
}

if ($Simuler) {
    Journal "SIMULATION : etapes prevues ->"
    Journal "  1. arreter les piles Docker (aucune perte : volumes conserves)"
    Journal "  2. arreter Docker Desktop puis WSL (wsl --shutdown)"
    Journal "  3. attendre que le fichier soit libere (60 s max)"
    Journal "  4. Optimize-VHD -Mode Full (repli : diskpart compact vdisk)"
    Journal "  5. relancer Docker Desktop et verifier les donnees"
    Journal "SIMULATION terminee : RIEN n'a ete arrete ni modifie."
    exit 0
}

if (-not $estAdmin) {
    Journal "ECHEC : droits administrateur requis. Lancez compacter-vhdx.cmd."
    exit 3
}

# --- 1. arreter proprement les piles (les volumes survivent) ----------------
try {
    Journal "arret des piles docker compose..."
    & docker compose -p lcd-deploy stop 2>&1 | Out-Null
    & docker compose -f "$PSScriptRoot\..\lab\docker-compose.yml" stop 2>&1 | Out-Null
} catch { Journal "avertissement : arret des piles : $($_.Exception.Message)" }

# --- 2. arreter Docker Desktop puis WSL ------------------------------------
Journal "arret de Docker Desktop et de WSL..."
Get-Process "Docker Desktop", "com.docker.backend", "com.docker.build" -ErrorAction SilentlyContinue |
    ForEach-Object { try { $_.CloseMainWindow() | Out-Null } catch { } }
Start-Sleep -Seconds 8
& wsl.exe --shutdown 2>&1 | Out-Null
Start-Sleep -Seconds 8

# --- 3. attendre la liberation du fichier (sinon la compaction echoue) ------
$libre = $false
for ($i = 0; $i -lt 20; $i++) {
    try {
        $f = [IO.File]::Open($vhdx, "Open", "ReadWrite", "None")
        $f.Close()
        $libre = $true
        break
    } catch {
        Start-Sleep -Seconds 3
    }
}
if (-not $libre) {
    Journal "ECHEC : le disque est encore ouvert par un processus. Rien n'a ete compacte."
    Journal "Remede : quitter Docker Desktop completement (icone -> Quit), puis relancer ce script."
    exit 4
}
Journal "disque libere : compaction possible."

# --- 4. compacter ----------------------------------------------------------
$compacte = $false
try {
    Journal "Optimize-VHD -Mode Full..."
    Optimize-VHD -Path $vhdx -Mode Full -ErrorAction Stop
    $compacte = $true
} catch {
    Journal "Optimize-VHD indisponible ($($_.Exception.Message)) -> repli diskpart"
}

if (-not $compacte) {
    $script = Join-Path $env:TEMP "lcd-compact.txt"
    @(
        "select vdisk file=`"$vhdx`"",
        "attach vdisk readonly",
        "compact vdisk",
        "detach vdisk",
        "exit"
    ) | Set-Content -Path $script -Encoding ASCII
    & diskpart.exe /s $script 2>&1 | ForEach-Object { Journal "  diskpart : $_" }
    Remove-Item $script -Force -ErrorAction SilentlyContinue
    $compacte = $true
}

$apres = TailleGo $vhdx
Journal "disque virtuel apres compaction : $apres Go"

# --- 5. relancer Docker et verifier que les donnees sont la ---------------
Journal "relance de Docker Desktop..."
if (Test-Path $dockerExe) { Start-Process $dockerExe | Out-Null }

$pret = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 5
    $null = & docker info 2>&1
    if ($LASTEXITCODE -eq 0) { $pret = $true; break }
}
Journal "docker repond : $pret"

$images = ""
if ($pret) {
    $images = (& docker images --format "{{.Repository}}:{{.Tag}}" 2>&1 | Measure-Object).Count
    Journal "images presentes : $images"
    Journal "relance des piles..."
    & docker compose -f "$PSScriptRoot\docker-compose.yml" up -d 2>&1 | Out-Null
    & docker compose -f "$PSScriptRoot\..\lab\docker-compose.yml" up -d 2>&1 | Out-Null
}

$libreApres = [Math]::Round((Get-PSDrive C).Free / 1GB, 1)
$gain = [Math]::Round($libreApres - $libreAvant, 1)
Journal "libre sur C: : $libreApres Go (gain mesure : $gain Go)"
Journal "=== fin ==="

if ($pret -and $gain -gt 0) { exit 0 } else { exit 1 }
