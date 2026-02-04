@echo off
SETLOCAL
SET "XAMPP_PATH=C:\xampp\htdocs\intramail"
SET "PROJECT_PATH=%~dp0"

echo ===================================================
echo   FMC HONG INTRAMAIL - AUTOMATED DEPLOYER
echo ===================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed! 
    echo Please install Node.js from https://nodejs.org/ first.
    pause
    exit /b
)

:: 2. Create XAMPP Directories
echo [1/5] Setting up XAMPP directories at %XAMPP_PATH%...
if not exist "%XAMPP_PATH%" mkdir "%XAMPP_PATH%"
if not exist "%XAMPP_PATH%\api" mkdir "%XAMPP_PATH%\api"
if not exist "%XAMPP_PATH%\uploads" mkdir "%XAMPP_PATH%\uploads"

:: 3. Deploy Backend (PHP)
echo [2/5] Deploying PHP Backend...
:: Check if public/api/index.php exists, else try api/index.php
if exist "%PROJECT_PATH%public\api\index.php" (
    copy /Y "%PROJECT_PATH%public\api\index.php" "%XAMPP_PATH%\api\index.php" >nul
) else if exist "%PROJECT_PATH%api\index.php" (
    copy /Y "%PROJECT_PATH%api\index.php" "%XAMPP_PATH%\api\index.php" >nul
) else (
    echo [WARNING] Could not find index.php to copy! Please check your folder structure.
)

:: 4. Install Dependencies
echo [3/5] Installing Dependencies (this may take a minute)...
call npm install --legacy-peer-deps

:: 5. Build Frontend
echo [4/5] Building Frontend Assets...
call npm run build

:: 6. Deploy Frontend
echo [5/5] Moving App to Web Server...
if exist "%PROJECT_PATH%dist" (
    xcopy /E /Y "%PROJECT_PATH%dist\*" "%XAMPP_PATH%\" >nul
    echo.
    echo [SUCCESS] Deployment Complete!
    echo.
    echo Access the app here: http://localhost/intramail
) else (
    echo [ERROR] Build failed. The 'dist' folder was not created.
    echo Please check the console errors above.
)

pause
