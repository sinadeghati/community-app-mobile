# Read-only smoke test — production vs staging API isolation.
# Does not write data. Safe to run anytime.

$productionUrl = "https://api.korook.com/api/listings/"
$stagingUrl = "https://community-app-backend-staging.up.railway.app/api/listings/"

function Get-ListingCount {
    param([string]$Url)
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 20
        if ($null -eq $response) { return 0 }
        if ($response -is [System.Array]) { return $response.Count }
        if ($response.results) { return @($response.results).Count }
        return 1
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return -1
    }
}

Write-Host ""
Write-Host "IranianApp API environment verification"
Write-Host ""

Write-Host "Production: $productionUrl"
$prodCount = Get-ListingCount -Url $productionUrl
Write-Host "  Listings: $prodCount"
Write-Host ""

Write-Host "Staging: $stagingUrl"
$stagingCount = Get-ListingCount -Url $stagingUrl
Write-Host "  Listings: $stagingCount"
Write-Host ""

if ($prodCount -ge 0 -and $stagingCount -ge 0) {
    if ($prodCount -gt 0 -and $prodCount -eq $stagingCount) {
        Write-Host "WARNING: Production and staging listing counts match."
        Write-Host "Databases may not be isolated - check Railway DATABASE_URL."
        Write-Host ""
    }
    elseif ($stagingCount -eq 0) {
        Write-Host "OK: Staging appears isolated (empty listings)."
        Write-Host ""
    }
    else {
        Write-Host "OK: Staging has its own data set: $stagingCount listings."
        Write-Host ""
    }
}

Write-Host "Mobile config:"
Write-Host "  development/staging -> community-app-backend-staging.up.railway.app"
Write-Host "  production          -> api.korook.com"
Write-Host ""
