$ErrorActionPreference = "SilentlyContinue"

# 1) Liberar puerto 4201 si está ocupado
$port = 4201
$pid = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }

# 2) Arrancar Angular en 4201
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","ng serve --proxy-config proxy.conf.js --port 4201"

# 3) Abrir /auth/login (pequeña espera para que levante)
Start-Sleep -Seconds 3
Start-Process msedge.exe "http://localhost:4201/auth/login"
