Write-Host "Starting llama-server (CPU inference)..." -ForegroundColor Cyan
$llama = Start-Process -FilePath ".\llama_bin\llama-server.exe" -ArgumentList "-m outputs/sid-ai-q4_k_m.gguf --host 127.0.0.1 --port 8081 -c 4096 -t 6 -ngl 0 --no-warmup" -NoNewWindow -PassThru
Start-Sleep -Seconds 3

Write-Host "Starting FastAPI backend..." -ForegroundColor Cyan
$uvicorn = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app:app --host 0.0.0.0 --port 8888" -NoNewWindow -PassThru -WorkingDirectory ".\backend"

Write-Host "`nsid.ai is running!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:8888" -ForegroundColor Yellow
Write-Host "  Model:    http://localhost:8081" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop"

try {
    Wait-Process -Id $uvicorn.Id
} finally {
    Stop-Process -Id $llama.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $uvicorn.Id -Force -ErrorAction SilentlyContinue
}
