# YouTube Audio Proxy Server

A backend proxy server that downloads YouTube audio using `yt-dlp` and serves it to your mobile app.

## Features

- ✅ **Real YouTube audio downloads** using `yt-dlp`
- ✅ **Caching** - files are cached for 24 hours
- ✅ **Multiple audio formats** support
- ✅ **Streaming support** for direct playback
- ✅ **CORS enabled** for mobile app access
- ✅ **Error handling** and logging
- ✅ **Health check** endpoint

## Prerequisites

- **Node.js** (v14 or higher)
- **Python** (for yt-dlp)
- **yt-dlp** (will be installed automatically)

## Quick Installation

### Windows
```bash
cd server
install.bat
```

### Linux/Mac
```bash
cd server
chmod +x install.sh
./install.sh
```

### Manual Installation
```bash
cd server
npm install
pip install yt-dlp
```

## Usage

### Start the Server
```bash
npm start
```

### Development Mode (with auto-restart)
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Get Video Info
```
GET /info/:videoId
```
Returns video metadata and available audio formats.

**Example:**
```bash
curl http://localhost:3000/info/dQw4w9WgXcQ
```

### Download Audio
```
GET /audio/:videoId
```
Downloads and returns the audio file.

**Example:**
```bash
curl http://localhost:3000/audio/dQw4w9WgXcQ -o song.mp3
```

### Stream Audio
```
GET /stream/:videoId
```
Streams audio for direct playback (supports range requests).

**Example:**
```bash
curl http://localhost:3000/stream/dQw4w9WgXcQ
```

### Cleanup Old Files
```
DELETE /cleanup
```
Removes cached files older than 24 hours.

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `DOWNLOADS_DIR` - Directory for cached files (default: ./downloads)

### CORS Settings

The server is configured to allow requests from:
- `http://localhost:3000`
- `http://localhost:5173`
- `capacitor://localhost`
- `ionic://localhost`

## How It Works

1. **Your mobile app** sends a video ID to the server
2. **Server uses yt-dlp** to download the audio from YouTube
3. **Server caches** the file locally
4. **Server returns** the audio file to your app
5. **Your app saves** the audio to device storage

## Troubleshooting

### yt-dlp Installation Issues
If yt-dlp installation fails, try:
```bash
pip install --upgrade yt-dlp
```

### Port Already in Use
Change the port in `server.js` or set the `PORT` environment variable:
```bash
PORT=3001 npm start
```

### CORS Issues
Update the CORS origins in `server.js` to include your app's domain.

### File Permission Issues
Make sure the `downloads` directory is writable:
```bash
chmod 755 downloads
```

## Security Notes

- This server is for development/testing only
- In production, add authentication and rate limiting
- Consider using HTTPS in production
- Monitor disk usage (cached files can grow large)

## Deployment Options

### Local Development
- Run on your development machine
- Access from `http://localhost:3000`

### Cloud Deployment
Deploy to services like:
- **Heroku** (free tier available)
- **Railway** (free tier available)
- **Render** (free tier available)
- **DigitalOcean** (paid)
- **AWS EC2** (paid)

### Docker Deployment
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache python3 py3-pip
RUN pip3 install yt-dlp
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT License - feel free to use and modify as needed. 