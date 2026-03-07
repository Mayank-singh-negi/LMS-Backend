# Test Ollama Integration with E-Learning Backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Ollama AI Integration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendUrl = "http://localhost:5000"
$ollamaUrl = "http://localhost:11434"

# Test 1: Check Ollama Connection
Write-Host "`n1. Testing Ollama Connection..." -ForegroundColor Yellow
try {
    $ollamaResponse = curl.exe -s "$ollamaUrl/api/tags" 
    if ($?) {
        Write-Host "✅ Ollama is running and accessible" -ForegroundColor Green
        Write-Host $ollamaResponse | ConvertFrom-Json | ConvertTo-Json
    }
} catch {
    Write-Host "❌ Ollama connection failed: $_" -ForegroundColor Red
}

# Test 2: Check Backend Health
Write-Host "`n2. Testing Backend Health..." -ForegroundColor Yellow
try {
    $healthResponse = curl.exe -s "$backendUrl/api/v1/health"
    if ($?) {
        Write-Host "✅ Backend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend health check failed: $_" -ForegroundColor Red
}

# Test 3: Test Doubt Solver with Ollama
Write-Host "`n3. Testing Doubt Solver with Ollama..." -ForegroundColor Yellow
$doubtPayload = @{
    question = "What is photosynthesis?"
    lessonContent = "Photosynthesis is a process used by plants to convert light energy into chemical energy. It occurs in two stages: light reactions and the Calvin cycle."
    courseTitle = "Biology 101"
} | ConvertTo-Json

Write-Host "Sending request to /api/v1/ai/solve-doubt..." -ForegroundColor Cyan
Write-Host "Payload: $doubtPayload" -ForegroundColor DarkCyan

try {
    $response = curl.exe -s -X POST `
        -H "Content-Type: application/json" `
        -d $doubtPayload `
        "$backendUrl/api/v1/ai/solve-doubt"
    
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response | ConvertFrom-Json | ConvertTo-Json
} catch {
    Write-Host "❌ Doubt Solver test failed: $_" -ForegroundColor Red
}

# Test 4: Test Quiz Generator with Ollama
Write-Host "`n4. Testing Quiz Generator with Ollama..." -ForegroundColor Yellow
$quizPayload = @{
    lessonContent = "The Industrial Revolution was a period marked by transition from agrarian to industrial economies. Key innovations included the steam engine and mechanized textile production."
} | ConvertTo-Json

Write-Host "Sending request to /api/v1/ai/generate-quiz..." -ForegroundColor Cyan

try {
    $response = curl.exe -s -X POST `
        -H "Content-Type: application/json" `
        -d $quizPayload `
        "$backendUrl/api/v1/ai/generate-quiz"
    
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response | ConvertFrom-Json | ConvertTo-Json
} catch {
    Write-Host "❌ Quiz Generator test failed: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
