# Quick Test Script for D2 UI Backend APIs

$baseUrl = "http://127.0.0.1:8080"

Write-Host "=== D2 UI Backend API Quick Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if MVP is running
Write-Host "Checking if MVP is running..." -ForegroundColor Yellow
try {
    $test = Invoke-WebRequest -Uri "$baseUrl/local/device/config" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   [OK] MVP is running" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] MVP is not running. Please start: mvn spring-boot:run" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test Handshake
Write-Host "1. Testing POST /local/device/handshake..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/local/device/handshake" `
        -Method POST -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "   [OK] Handshake successful" -ForegroundColor Green
        Write-Host "   deviceId: $($result.data.deviceId)" -ForegroundColor Gray
        Write-Host "   tokenExpiresAt: $($result.data.tokenExpiresAt)" -ForegroundColor Gray
    } else {
        Write-Host "   [ERROR] Handshake failed: $($result.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   [ERROR] Handshake request failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test Activities
Write-Host "2. Testing GET /local/device/activities..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/local/device/activities" `
        -Method GET -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        $stale = $result.data.stale
        $count = $result.data.items.Count
        if ($stale) {
            Write-Host "   [WARN] Using cached data (stale=true)" -ForegroundColor Yellow
            Write-Host "   cachedAt: $($result.data.cachedAt)" -ForegroundColor Gray
        } else {
            Write-Host "   [OK] Activities fetched successfully (stale=false)" -ForegroundColor Green
        }
        Write-Host "   items count: $count" -ForegroundColor Gray
        
        # Show first activity as sample
        if ($count -gt 0) {
            Write-Host "   Sample activity:" -ForegroundColor Gray
            $result.data.items[0] | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor DarkGray
        }
    } else {
        Write-Host "   [ERROR] Activities fetch failed: $($result.message)" -ForegroundColor Red
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 503) {
        Write-Host "   [WARN] Platform unreachable (503)" -ForegroundColor Yellow
    } elseif ($statusCode -eq 401) {
        Write-Host "   [ERROR] Token invalid (401)" -ForegroundColor Red
    } else {
        Write-Host "   [ERROR] Request failed: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start Kiosk frontend: npm run dev" -ForegroundColor White
Write-Host "  2. Open browser and navigate to Settings > Device & Platform" -ForegroundColor White
Write-Host "  3. Test Handshake and Fetch Activities buttons" -ForegroundColor White
