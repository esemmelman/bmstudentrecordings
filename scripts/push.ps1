param([string]$Message = 'Update recordings website')
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
npm test
if ($LASTEXITCODE -ne 0) { throw 'Tests failed; changes were not pushed.' }
git add -- site scripts .github package.json recordings.test.js README.md .gitignore AGENTS.md
if ($LASTEXITCODE -ne 0) { throw 'Could not stage website files.' }
git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { throw 'Commit failed.' }
}
git push origin main
if ($LASTEXITCODE -ne 0) { throw 'Push failed.' }
