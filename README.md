# 🎵 Audio Transcription API

A Node.js application that transcribes and summarizes audio files using Google Gemini 2.0 Flash Preview. Upload audio files (WAV, MP3, MP4) and get detailed transcriptions with intelligent summaries.

## ✨ Features

- **Multi-format Support**: WAV, MP3, MP4, M4A audio files
- **AI-Powered Transcription**: Using Google Gemini 2.0 Flash Preview
- **Three-Stage Processing**: Audio → Transcript → Summary → Beautiful formatting
- **Reliable Workflow**: Separated concerns for better accuracy and reliability  
- **Multi-language Support**: Automatic language detection (Thai/English prioritized)
- **Timestamp Support**: Automatic timestamps every 10-15 seconds and at speaker changes
- **Intelligent Summarization**: Automatic summary generation
- **Metadata Extraction**: Audio duration, language detection, speaker identification
- **Word-by-Word Accuracy**: No content minimization for serious use cases
- **Topic Organization**: Content grouped by topics with clear sections
- **File Upload Handling**: Secure file upload with validation
- **Auto Cleanup**: Temporary files are automatically removed
- **REST API**: Clean, well-documented API endpoints
- **Error Handling**: Comprehensive error responses
- **Health Monitoring**: Built-in health check endpoints

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd audio-transcript
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
```
Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=200MB
```

4. **Start the server:**
```bash
# Development mode
npm run dev

# Production mode (basic)
npm start

# Production mode with PM2 (recommended)
npm run pm2:prod
```

## 🚀 Production Deployment

For production deployment with process management, monitoring, and auto-restart capabilities:

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start in production mode
npm run pm2:prod

# Monitor the application
npm run pm2:status
npm run pm2:logs
npm run pm2:monit
```

See [PM2_DEPLOYMENT.md](./PM2_DEPLOYMENT.md) for detailed deployment instructions.

### PM2 Management Commands
```bash
npm run pm2:start      # Start the application
npm run pm2:stop       # Stop the application  
npm run pm2:restart    # Restart the application
npm run pm2:reload     # Graceful reload
npm run pm2:logs       # View logs
npm run pm2:monit      # Monitor resources
```

## 📡 API Endpoints

### Base URL: `http://localhost:3000`

### 1. Upload Audio for Transcription
```http
POST /api/transcribe
Content-Type: multipart/form-data
```

**Parameters:**
- `audio` (file, required): Audio file (wav, mp3, mp4, m4a)
- Max file size: 200MB

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "[00:05] Welcome everyone to today's meeting. [00:15] Today we'll discuss the quarterly results...",
    "formatted_transcript": "*Meeting Introduction*\n[00:00] Welcome everyone to today's meeting.\n[00:15] Today we'll discuss the quarterly results.\n\n*Discussion Topics*\n[01:30] Thank you for the introduction.\n[02:45] Let's review our key metrics...",
    "transcript_with_timestamps": [
      {"timestamp": "00:00", "speaker": "Speaker 1", "text": "Welcome everyone to today's meeting."},
      {"timestamp": "00:15", "speaker": "Speaker 1", "text": "Today we'll discuss the quarterly results."},
      {"timestamp": "01:30", "speaker": "Speaker 2", "text": "Thank you for the introduction."}
    ],
    "summary": "Concise summary of key points...",
    "metadata": {
      "estimated_duration": "5 minutes",
      "language": "English",
      "speakers": "2 speakers detected",
      "audio_quality": "good"
    },
    "key_points": [
      "Main topic discussed",
      "Important decision made", 
      "Action items identified"
    ],
    "main_topics": [
      "Meeting Introduction",
      "Financial Discussion",
      "Action Planning"
    ],
    "confidence_score": "high",
    "processing_info": {
      "file_name": "meeting.wav",
      "file_size": 1024000,
      "file_type": "audio/wav",
      "processing_time_ms": 15000,
      "timestamp": "2025-01-02T10:30:00.000Z"
    }
  },
  "message": "Audio file successfully transcribed and summarized"
}
```

### 2. Health Check
```http
GET /api/transcribe/health
```

### 3. Supported Formats
```http
GET /api/transcribe/supported-formats
```

### 4. Server Health
```http
GET /health
```

### 5. API Documentation
```http
GET /docs
```

## 🔧 Usage Examples

### cURL
```bash
curl -X POST \
  -F "audio=@meeting.wav" \
  http://localhost:3000/api/transcribe
```

### JavaScript (Browser)
```javascript
const formData = new FormData();
formData.append('audio', audioFile);

fetch('/api/transcribe', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Transcript:', data.data.transcript);
  console.log('Summary:', data.data.summary);
})
.catch(error => console.error('Error:', error));
```

### Node.js
```javascript
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const form = new FormData();
form.append('audio', fs.createReadStream('path/to/audio.wav'));

fetch('http://localhost:3000/api/transcribe', {
  method: 'POST',
  body: form
})
.then(res => res.json())
.then(data => console.log(data));
```

### Python
```python
import requests

url = 'http://localhost:3000/api/transcribe'
files = {'audio': open('audio_file.wav', 'rb')}

response = requests.post(url, files=files)
data = response.json()

print("Transcript:", data['data']['transcript'])
print("Summary:", data['data']['summary'])
```

## 🏗️ Project Structure

```
audio-transcript/
├── package.json              # Dependencies and scripts
├── server.js                 # Main server file
├── env.example              # Environment template
├── .gitignore               # Git ignore rules
├── README.md                # This file
├── uploads/                 # Temporary file storage
├── utils/
│   └── gemini.js           # Gemini API service
├── middleware/
│   └── upload.js           # File upload handling
└── routes/
    └── transcribe.js       # Transcription routes
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MAX_FILE_SIZE` | Maximum file size | 200MB |

### Supported Audio Formats

| Format | MIME Type | Description |
|--------|-----------|-------------|
| WAV | `audio/wav` | Waveform Audio File Format |
| MP3 | `audio/mpeg` | MPEG Audio Layer III |
| MP4 | `video/mp4` | MPEG-4 Part 14 (audio/video) |
| M4A | `audio/mp4` | MPEG-4 Audio |

## 🛡️ Error Handling

The API provides comprehensive error responses:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "processing_info": {
    "timestamp": "2025-01-02T10:30:00.000Z"
  }
}
```

### Common Error Codes

- `FILE_TOO_LARGE`: File exceeds 200MB limit
- `UNSUPPORTED_FILE_TYPE`: Invalid file format
- `NO_FILE`: No file uploaded
- `PROCESSING_ERROR`: Gemini API error
- `INTERNAL_ERROR`: Server error

## 🔍 Monitoring

### Health Checks

- **Service Health**: `GET /api/transcribe/health`
- **Server Health**: `GET /health`

Both endpoints provide detailed status information including:
- API key configuration status
- Server uptime
- Memory usage
- Timestamp

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name "audio-transcription-api"

# Monitor
pm2 monit

# Auto-restart on system reboot
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Setup for Production

```env
GEMINI_API_KEY=your_production_api_key
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=50MB
```

## 📝 API Response Schema

### Successful Transcription Response

```typescript
interface TranscriptionResponse {
  success: true;
  data: {
    transcript: string;
    summary: string;
    metadata: {
      estimated_duration: string;
      language: string;
      speakers: string;
      audio_quality: 'good' | 'fair' | 'poor';
    };
    key_points: string[];
    confidence_score: 'high' | 'medium' | 'low';
    processing_info: {
      file_name: string;
      file_size: number;
      file_type: string;
      processing_time_ms: number;
      timestamp: string;
    };
  };
  message: string;
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  processing_info?: {
    processing_time_ms?: number;
    timestamp: string;
  };
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
1. Check the documentation at `/docs` endpoint
2. Review health status at `/health`
3. Check server logs for detailed error information
4. Ensure your Gemini API key is valid and has sufficient credits

---

**Built with ❤️ using Node.js, Express.js, and Google Gemini 2.0 Flash** 