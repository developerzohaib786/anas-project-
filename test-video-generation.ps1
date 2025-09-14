# PowerShell test script for video generation function
# Update the AUTH_TOKEN variable with your token from the browser console

$SUPABASE_URL = "https://pbndydilyqxqmcxwadvy.supabase.co"
$AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"

# Test image (base64 encoded sample)
$IMAGE_DATA = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

Write-Host "🧪 Testing Video Generation Function..." -ForegroundColor Green
Write-Host "📡 Supabase URL: $SUPABASE_URL" -ForegroundColor Cyan
Write-Host "🔑 Auth Token: $($AUTH_TOKEN.Substring(0, [Math]::Min(20, $AUTH_TOKEN.Length)))..." -ForegroundColor Cyan
Write-Host ""

# Prepare the request body
$requestBody = @{
    image = $IMAGE_DATA
    movement_description = "smooth camera pan from left to right with gentle zoom"
    sfx_description = "ambient nature sounds"
    video_size = "horizontal"
    prompt = "Test video generation"
} | ConvertTo-Json

# Headers
$headers = @{
    "Authorization" = "Bearer $AUTH_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "📡 Testing video generation..." -ForegroundColor Yellow

try {
    # Make the POST request
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-video" -Method POST -Headers $headers -Body $requestBody
    
    Write-Host "✅ Request successful!" -ForegroundColor Green
    Write-Host "📋 Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    # Check if we got a generation ID
    if ($response.generationId) {
        Write-Host ""
        Write-Host "✅ Got generation ID: $($response.generationId)" -ForegroundColor Green
        Write-Host "📊 Testing status check..." -ForegroundColor Yellow
        
        Start-Sleep -Seconds 2
        
        try {
            $statusResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/generate-video?jobId=$($response.generationId)" -Method GET -Headers $headers
            Write-Host "📊 Status Response:" -ForegroundColor Cyan
            $statusResponse | ConvertTo-Json -Depth 10 | Write-Host
        }
        catch {
            Write-Host "❌ Status check failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host ""
        Write-Host "ℹ️ No generation ID found - this might be expected for fallback responses" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Request failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        }
        catch {
            Write-Host "Could not read error response body" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green