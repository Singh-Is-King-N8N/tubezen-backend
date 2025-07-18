#!/bin/bash

echo "Installing YouTube Audio Proxy Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "yt-dlp is not installed. Installing yt-dlp..."
    
    # Try different installation methods
    if command -v pip &> /dev/null; then
        echo "Installing yt-dlp via pip..."
        pip install yt-dlp
    elif command -v pip3 &> /dev/null; then
        echo "Installing yt-dlp via pip3..."
        pip3 install yt-dlp
    elif command -v brew &> /dev/null; then
        echo "Installing yt-dlp via Homebrew..."
        brew install yt-dlp
    elif command -v apt-get &> /dev/null; then
        echo "Installing yt-dlp via apt..."
        sudo apt-get update
        sudo apt-get install -y yt-dlp
    elif command -v yum &> /dev/null; then
        echo "Installing yt-dlp via yum..."
        sudo yum install -y yt-dlp
    else
        echo "Could not install yt-dlp automatically."
        echo "Please install yt-dlp manually:"
        echo "  - Visit: https://github.com/yt-dlp/yt-dlp#installation"
        echo "  - Or run: pip install yt-dlp"
        exit 1
    fi
else
    echo "yt-dlp is already installed."
fi

# Test yt-dlp installation
echo "Testing yt-dlp installation..."
yt-dlp --version

echo ""
echo "Installation complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To start in development mode:"
echo "  npm run dev"
echo ""
echo "Server will be available at:"
echo "  http://localhost:3000"
echo ""
echo "Endpoints:"
echo "  - Health check: http://localhost:3000/health"
echo "  - Video info: http://localhost:3000/info/:videoId"
echo "  - Audio download: http://localhost:3000/audio/:videoId"
echo "  - Audio stream: http://localhost:3000/stream/:videoId" 