$Source = "C:\Users\Asus\OneDrive\Робочий стіл\Курси Час для Себе"
$Dest   = "C:\Users\Asus\quartz\content"

Write-Host "COPY OBSIDIAN -> QUARTZ"

robocopy $Source $Dest /MIR /XD ".obsidian" ".trash" /XF "desktop.ini" /R:1 /W:1 /NP

if ($LASTEXITCODE -ge 8) {
    Write-Host "ROBOCOPY ERROR: $LASTEXITCODE"
    Read-Host "Press Enter"
    exit 1
}

Set-Location "C:\Users\Asus\quartz"

Write-Host "GIT ADD"
git add -A

git diff --cached --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "NO CHANGES"
    Read-Host "Press Enter"
    exit 0
}

Write-Host "GIT COMMIT"
git commit -m "Sync Obsidian changes"

if ($LASTEXITCODE -ne 0) {
    Write-Host "COMMIT ERROR"
    Read-Host "Press Enter"
    exit 1
}

Write-Host "GIT PUSH"
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "PUSH ERROR"
    Read-Host "Press Enter"
    exit 1
}

Write-Host ""
Write-Host "=========================="
Write-Host "DONE"
Write-Host "Wait for GitHub Actions."
Write-Host "=========================="
Read-Host "Press Enter"