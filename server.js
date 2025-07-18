const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { exec } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'capacitor://localhost', 'ionic://localhost'],
  credentials: true
}));

// Create downloads directory
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get audio info (metadata only, no download)
app.get('/info/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log(`Getting info for video: ${videoId}`);
    
    const command = `yt-dlp --dump-json --no-playlist https://www.youtube.com/watch?v=${videoId}`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error getting video info:', error);
        return res.status(500).json({ error: 'Failed to get video info' });
      }
      
      try {
        const videoInfo = JSON.parse(stdout);
        
        // Extract audio formats
        const audioFormats = videoInfo.formats.filter(format => 
          format.acodec && format.acodec !== 'none' && !format.vcodec
        );
        
        // Sort by quality (bitrate)
        audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        
        const bestAudio = audioFormats[0];
        
        res.json({
          videoId,
          title: videoInfo.title,
          channel: videoInfo.uploader,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail,
          audioFormats: audioFormats.map(format => ({
            formatId: format.format_id,
            quality: format.quality,
            bitrate: format.bitrate,
            filesize: format.filesize,
            mimeType: format.mime_type
          })),
          bestAudio: bestAudio ? {
            formatId: bestAudio.format_id,
            quality: bestAudio.quality,
            bitrate: bestAudio.bitrate,
            filesize: bestAudio.filesize,
            mimeType: bestAudio.mime_type
          } : null
        });
      } catch (parseError) {
        console.error('Error parsing video info:', parseError);
        res.status(500).json({ error: 'Failed to parse video info' });
      }
    });
  } catch (error) {
    console.error('Error in /info endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download audio endpoint
app.get('/audio/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { format = 'bestaudio' } = req.query;
    
    console.log(`Downloading audio for video: ${videoId}, format: ${format}`);
    
    // Check if already downloaded
    const outputPath = path.join(downloadsDir, `${videoId}.mp3`);
    if (fs.existsSync(outputPath)) {
      console.log(`Serving cached audio for: ${videoId}`);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${videoId}.mp3"`);
      return fs.createReadStream(outputPath).pipe(res);
    }
    
    // Download using yt-dlp
    const command = `yt-dlp -f ${format} -o "${outputPath}" --extract-audio --audio-format mp3 --audio-quality 0 https://www.youtube.com/watch?v=${videoId}`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error downloading audio:', error);
        return res.status(500).json({ error: 'Failed to download audio' });
      }
      
      if (fs.existsSync(outputPath)) {
        console.log(`Successfully downloaded audio for: ${videoId}`);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${videoId}.mp3"`);
        fs.createReadStream(outputPath).pipe(res);
      } else {
        console.error('Download completed but file not found:', outputPath);
        res.status(500).json({ error: 'Download completed but file not found' });
      }
    });
  } catch (error) {
    console.error('Error in /audio endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stream audio endpoint (for direct playback)
app.get('/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { format = 'bestaudio' } = req.query;
    
    console.log(`Streaming audio for video: ${videoId}`);
    
    // Check if already downloaded
    const outputPath = path.join(downloadsDir, `${videoId}.mp3`);
    if (fs.existsSync(outputPath)) {
      console.log(`Streaming cached audio for: ${videoId}`);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      
      const stat = fs.statSync(outputPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg',
        });
        
        const stream = fs.createReadStream(outputPath, { start, end });
        stream.pipe(res);
      } else {
        res.setHeader('Content-Length', fileSize);
        fs.createReadStream(outputPath).pipe(res);
      }
      return;
    }
    
    // Download and stream
    const command = `yt-dlp -f ${format} -o "${outputPath}" --extract-audio --audio-format mp3 --audio-quality 0 https://www.youtube.com/watch?v=${videoId}`;
    
    exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error downloading audio for streaming:', error);
        return res.status(500).json({ error: 'Failed to download audio' });
      }
      
      if (fs.existsSync(outputPath)) {
        console.log(`Successfully downloaded and streaming audio for: ${videoId}`);
        res.setHeader('Content-Type', 'audio/mpeg');
        fs.createReadStream(outputPath).pipe(res);
      } else {
        console.error('Download completed but file not found for streaming:', outputPath);
        res.status(500).json({ error: 'Download completed but file not found' });
      }
    });
  } catch (error) {
    console.error('Error in /stream endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clean up old files endpoint
app.delete('/cleanup', (req, res) => {
  try {
    const files = fs.readdirSync(downloadsDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = Date.now() - stats.mtime.getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    res.json({ 
      message: `Cleaned up ${deletedCount} old files`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`YouTube Audio Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Audio download: http://localhost:${PORT}/audio/:videoId`);
  console.log(`Audio stream: http://localhost:${PORT}/stream/:videoId`);
  console.log(`Video info: http://localhost:${PORT}/info/:videoId`);
}); 