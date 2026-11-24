@echo off
chcp 65001 >nul
title PPAP 實驗室量測前置作業系統 (內網共享版)
echo ============================================================
echo   正在啟動 PPAP 尺寸球標與規格移轉工具 (內部網路共享版)
echo ============================================================
echo.
echo   本機開啟網址：  http://localhost:3880
echo   內網同事連線網址（請將以下任一 IPv4 網址分享給同區網同事）：
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do (
    echo     ^> http://%%b:3880
  )
)
echo.
echo   ※ 首次供內網同事連線前，請先對「開放內網防火牆(右鍵以系統管理員執行).bat」
echo     按右鍵選擇「以系統管理員身分執行」一次。
echo   ※ 使用期間請保持此黑色視窗開啟，關閉即停止服務。
echo ============================================================
echo.
cd /d "%~dp0ppap-tool"
start "" "http://localhost:3880"
npm run start
pause
