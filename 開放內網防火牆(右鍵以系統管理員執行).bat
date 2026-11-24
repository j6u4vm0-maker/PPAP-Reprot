@echo off
chcp 65001 >nul
title 開放 PPAP 工具內網防火牆 (TCP 3880)
echo ============================================================
echo   設定 Windows 防火牆：允許內部網路連線至 TCP 3880 埠
echo ============================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo [錯誤] 請對此檔案按右鍵，選擇「以系統管理員身分執行」！
  echo.
  pause
  exit /b 1
)

netsh advfirewall firewall delete rule name="PPAP Dimension Tool LAN (3880)" >nul 2>&1
netsh advfirewall firewall add rule name="PPAP Dimension Tool LAN (3880)" dir=in action=allow protocol=TCP localport=3880 profile=private,domain
if %errorlevel% equ 0 (
  echo.
  echo [成功] 已開放內網（私人與網域網路）存取 TCP 3880 埠！
  echo 現在可點兩下「啟動PPAP尺寸工具.bat」，讓內網同事連線使用。
) else (
  echo.
  echo [失敗] 防火牆規則設定失敗，請確認具備系統管理員權限。
)
echo.
pause
