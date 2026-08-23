$Source = "C:\Users\Asus\OneDrive\Робочий стіл\Курси Час для Себе"
$Dest   = "C:\Users\Asus\quartz\content"
$Quartz = "C:\Users\Asus\quartz"

$SourceIndex = Join-Path $Source "index.md"
$DestIndex   = Join-Path $Dest "index.md"
$PublicIndex = Join-Path $Quartz "public\index.html"

Write-Host ""
Write-Host "=== SAFETY CHECK: SOURCE INDEX ==="

if (-not (Test-Path $SourceIndex)) {
    Write-Host "STOP: Obsidian index.md is missing."
    Write-Host "Nothing was copied or pushed."
    Read-Host "Press Enter"
    exit 1
}

if ((Get-Item $SourceIndex).Length -eq 0) {
    Write-Host "STOP: Obsidian index.md is empty."
    Write-Host "Nothing was copied or pushed."
    Read-Host "Press Enter"
    exit 1
}

Write-Host "SOURCE INDEX OK"
Write-Host ""
Write-Host "=== COPY OBSIDIAN -> QUARTZ ==="

robocopy $Source $Dest /MIR /XD ".obsidian" ".trash" /XF "desktop.ini" /R:1 /W:1 /NP

if ($LASTEXITCODE -ge 8) {
    Write-Host "STOP: ROBOCOPY ERROR $LASTEXITCODE"
    Read-Host "Press Enter"
    exit 1
}

Write-Host ""
Write-Host "=== SAFETY CHECK: QUARTZ INDEX ==="

if (-not (Test-Path $DestIndex)) {
    Write-Host "STOP: content\index.md disappeared after sync."
    Write-Host "Git was NOT touched."
    Read-Host "Press Enter"
    exit 1
}

if ((Get-Item $DestIndex).Length -eq 0) {
    Write-Host "STOP: content\index.md is empty."
    Write-Host "Git was NOT touched."
    Read-Host "Press Enter"
    exit 1
}

Write-Host "QUARTZ INDEX OK"

Set-Location $Quartz

Write-Host ""
Write-Host "=== BUILD QUARTZ ==="

npx.cmd quartz build

if ($LASTEXITCODE -ne 0) {
    Write-Host "STOP: QUARTZ BUILD FAILED."
    Write-Host "Nothing was committed or pushed."
    Read-Host "Press Enter"
    exit 1
}

Write-Host ""
Write-Host "=== SAFETY CHECK: PUBLIC HOME ==="

if (-not (Test-Path $PublicIndex)) {
    Write-Host "STOP: public\index.html was not created."
    Write-Host "Nothing was committed or pushed."
    Read-Host "Press Enter"
    exit 1
}

if ((Get-Item $PublicIndex).Length -eq 0) {
    Write-Host "STOP: public\index.html is empty."
    Write-Host "Nothing was committed or pushed."
    Read-Host "Press Enter"
    exit 1
}

Write-Host "PUBLIC HOME OK"

Write-Host ""
Write-Host "=== GIT ADD ==="
git add -A

$IndexChange = git diff --cached --name-status -- content/index.md

if ($IndexChange -match "^D\s") {
    Write-Host "STOP: Git is trying to DELETE content/index.md."
    Write-Host "Commit and push cancelled."
    git restore --staged content/index.md
    Read-Host "Press Enter"
    exit 1
}

git diff --cached --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "NO CHANGES"
    Read-Host "Press Enter"
    exit 0
}

Write-Host ""
Write-Host "=== GIT COMMIT ==="
git commit -m "Sync Obsidian changes"

if ($LASTEXITCODE -ne 0) {
    Write-Host "STOP: COMMIT ERROR"
    Read-Host "Press Enter"
    exit 1
}

Write-Host ""
Write-Host "=== GIT PUSH ==="
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "STOP: PUSH ERROR"
    Read-Host "Press Enter"
    exit 1
}

Write-Host ""
Write-Host "=========================="
Write-Host "DONE - SAFETY CHECKS PASSED"
Write-Host "index.md survived."
Write-Host "Quartz built successfully."
Write-Host "Wait for GitHub Actions."
Write-Host "=========================="
Read-Host "Press Enter"
