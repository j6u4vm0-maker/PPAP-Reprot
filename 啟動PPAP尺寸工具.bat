@echo off
chcp 65001 >nul
title PPAP 實驗室量測前置作業系統 (Next.js)
echo ============================================================
echo   正在啟動 PPAP 尺寸球標與規格移轉工具 (Next.js 本地伺服器)...
echo   瀏覽器將自動開啟 http://localhost:3880
echo   關閉此視窗將停止本地伺服器。
echo ============================================================
cd /d "%~dp0ppap-tool"
start "" "http://localhost:3880"
npm run start
pause
