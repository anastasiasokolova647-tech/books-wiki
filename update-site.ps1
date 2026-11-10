
$ErrorActionPreference = "Stop"

$Source = "C:\Users\Asus\OneDrive\Робочий стіл\Чай опівночі1"
$Quartz = "C:\Users\Asus\quartz"
$Dest = Join-Path $Quartz "content"

function Stop-Safely($Message) {
    Write-Host ""
    Write-Host "STOP: $Message" -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

function Run-Checked($Description, [scriptblock]$Command) {
    Write-Host ""
    Write-Host "=== $Description ===" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Stop-Safely "$Description failed"
    }
}

try {
    Set-Location $Quartz

    if (-not (Test-Path (Join-Path $Source "index.md"))) {
        Stop-Safely "Obsidian index.md is missing"
    }

    if ((Get-Item (Join-Path $Source "index.md")).Length -eq 0) {
        Stop-Safely "Obsidian index.md is empty"
    }

    $Branch = (git branch --show-current).Trim()
    if ($Branch -ne "v5") {
        Stop-Safely "Expected branch v5, found $Branch"
    }

    $GitChanges = @(git status --porcelain)
    if ($GitChanges.Count -gt 0) {
        Stop-Safely "Local Git changes detected. Resolve them before publishing."
    }

    Run-Checked "FETCH GITHUB" {
        git fetch origin v5
    }

    $Behind = [int](git rev-list --count HEAD..origin/v5)

    if ($Behind -gt 0) {
        Run-Checked "MERGE GITHUB UPDATES" {
            git merge --no-edit origin/v5
        }
    }

    Write-Host ""
    Write-Host "=== COPY OBSIDIAN ===" -ForegroundColor Cyan

    robocopy $Source $Dest /E /XD ".obsidian" ".trash" /XF "desktop.ini" "index.md" /R:1 /W:1 /NP
$RoboExitCode = $LASTEXITCODE
   if ($RoboExitCode -ge 8) {
        Stop-Safely "Obsidian copy failed"
    }

    Write-Host ""
    Write-Host "=== RESTORE PWA FILES ===" -ForegroundColor Cyan

    $PwaFiles = @(
        "manifest.webmanifest",
        "icon-192.png",
        "icon-512.png",
        "service-worker.js"
    )

    foreach ($File in $PwaFiles) {
        $From = Join-Path $Quartz "quartz\static\$File"
        if (-not (Test-Path $From)) {
            Stop-Safely "Missing PWA file: $File"
        }
        Copy-Item $From $Dest -Force
    }

    if (-not (Test-Path (Join-Path $Dest "index.md"))) {
        Stop-Safely "Quartz index.md is missing"
    }

    Run-Checked "BUILD QUARTZ" {
        npx.cmd quartz build
    }

    $PublicIndex = Join-Path $Quartz "public\index.html"

    if (-not (Test-Path $PublicIndex)) {
        Stop-Safely "Built homepage is missing"
    }

    if ((Get-Item $PublicIndex).Length -eq 0) {
        Stop-Safely "Built homepage is empty"
    }

    Run-Checked "CHECK CODE" {
        npm.cmd run check
    }

    Write-Host ""
    Write-Host "=== SAVE CHANGES ===" -ForegroundColor Cyan

    git add -A

    $DeletedIndex = git diff --cached --name-only --diff-filter=D -- content/index.md
    if ($DeletedIndex) {
        Stop-Safely "Homepage deletion detected"
    }

    git diff --cached --quiet

    if ($LASTEXITCODE -eq 1) {
        Run-Checked "COMMIT" {
            git commit -m "Sync Obsidian changes"
        }
    }
    elseif ($LASTEXITCODE -ne 0) {
        Stop-Safely "Could not inspect Git changes"
    }

    $Ahead = [int](git rev-list --count origin/v5..HEAD)

    if ($Ahead -gt 0) {
        Run-Checked "PUBLISH TO GITHUB" {
            git push origin HEAD:v5
        }
    }
    else {
        Write-Host "Everything is already published."
    }

    Write-Host ""
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "SUCCESS - GITHUB SYNC COMPLETED" -ForegroundColor Green
    Write-Host "Wait for GitHub Pages deployment." -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
}
catch {
    Write-Host $_ -ForegroundColor Red
    Stop-Safely "Unexpected error"
}

Read-Host "Press Enter to close"

