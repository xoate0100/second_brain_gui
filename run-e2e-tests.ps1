# E2E Test Runner Script
# Runs Playwright E2E tests and writes results to file
# This avoids tool call timeouts by writing to file instead of streaming output

$ErrorActionPreference = "Continue"
$outputFile = "e2e-test-results-latest.txt"

Write-Host "Starting E2E tests..."
Write-Host "Results will be written to: $outputFile"

cd frontend

# Run tests and write to file
npx playwright test --reporter=list *> "../$outputFile" 2>&1

$exitCode = $LASTEXITCODE

cd ..

Write-Host "Tests completed with exit code: $exitCode"
Write-Host "Results written to: $outputFile"

exit $exitCode




