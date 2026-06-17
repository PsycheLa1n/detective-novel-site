@echo off
chcp 65001 >nul
title 推理小说检索网站

echo.
echo   ╔══════════════════════════════════════╗
echo   ║     🔍 推理小说检索网站            ║
echo   ╚══════════════════════════════════════╝
echo.
echo   [1/2] 启动本地服务器...
start "Server" /min cmd /c "node server.js"
timeout /t 3 /nobreak >nul

echo   [2/2] 启动公网隧道...
echo.
echo   ┌──────────────────────────────────────┐
echo   │  🌐 公网访问地址（发给学生）:        │
echo   │                                      │
echo   │  等待下方出现 https:// 开头的地址... │
echo   └──────────────────────────────────────┘
echo.
echo   ⚠️ 不要关闭此窗口！按 Ctrl+C 可停止
echo   ──────────────────────────────────────
echo.
ngrok http 3000
