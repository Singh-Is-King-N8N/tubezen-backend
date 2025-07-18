@echo off
echo Installing YouTube Audio Proxy Server...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install

REM Check if Python is installed (for yt-dlp)
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python first.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if yt-dlp is installed
yt-dlp --version >nul 2>&1
if %errorlevel% neq 0 (
    echo yt-dlp is not installed. Installing yt-dlp...
    pip install yt-dlp
) else (
    echo yt-dlp is already installed.
)

REM Test yt-dlp installation
echo Testing yt-dlp installation...
yt-dlp --version

echo.
echo Installation complete!
echo.
echo To start the server:
echo   npm start
echo.
echo To start in development mode:
echo   npm run dev
echo.
echo Server will be available at:
echo   http://localhost:3000
echo.
echo Endpoints:
echo   - Health check: http://localhost:3000/health
echo   - Video info: http://localhost:3000/info/:videoId
echo   - Audio download: http://localhost:3000/audio/:videoId
echo   - Audio stream: http://localhost:3000/stream/:videoId
pause 