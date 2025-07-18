FROM node:22

# Install ffmpeg and yt-dlp
RUN apt-get update && apt-get install -y ffmpeg python3-pip && pip3 install -U yt-dlp

# Set workdir and copy files
WORKDIR /app
COPY . .

# Install node dependencies
RUN npm install

# Start the server
CMD ["node", "server.js"] 