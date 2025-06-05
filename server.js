require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const transcribeRoutes = require('./routes/transcribe');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your production domain
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/transcribe', transcribeRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Audio Transcription API',
    version: '1.0.0',
    endpoints: {
      transcribe: 'POST /api/transcribe',
      health: 'GET /api/transcribe/health',
      supported_formats: 'GET /api/transcribe/supported-formats'
    },
    documentation: {
      upload_field: 'audio',
      max_file_size: '200MB',
      supported_formats: ['wav', 'mp3', 'mp4', 'm4a'],
      response_format: 'JSON with transcript and summary'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    gemini_api_configured: !!process.env.GEMINI_API_KEY
  });
});

// API documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    title: 'Audio Transcription API Documentation',
    version: '1.0.0',
    description: 'API for transcribing and summarizing audio files using Google Gemini 2.0 Flash',
    endpoints: [
      {
        method: 'POST',
        path: '/api/transcribe',
        description: 'Upload audio file for transcription and summarization',
        parameters: {
          audio: {
            type: 'file',
            required: true,
            description: 'Audio file (wav, mp3, mp4, m4a)',
            max_size: '200MB'
          }
        },
        response: {
          success: 'boolean',
          data: {
            transcript: 'string',
            summary: 'string',
            metadata: 'object',
            key_points: 'array',
            confidence_score: 'string',
            processing_info: 'object'
          },
          message: 'string'
        }
      },
      {
        method: 'GET',
        path: '/api/transcribe/health',
        description: 'Check transcription service health'
      },
      {
        method: 'GET',
        path: '/api/transcribe/supported-formats',
        description: 'Get list of supported audio formats'
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Server health check'
      }
    ],
    examples: {
      curl_upload: `curl -X POST \\
  -F "audio=@your-audio-file.wav" \\
  http://localhost:3000/api/transcribe`,
      javascript_upload: `const formData = new FormData();
formData.append('audio', audioFile);

fetch('/api/transcribe', {
  method: 'POST',
  body: formData
}).then(res => res.json()).then(data => console.log(data));`
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist',
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /docs',
      'POST /api/transcribe',
      'GET /api/transcribe/health',
      'GET /api/transcribe/supported-formats'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🎵 Audio Transcription API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Server running on: http://localhost:${PORT}
📚 Documentation: http://localhost:${PORT}/docs
🏥 Health check: http://localhost:${PORT}/health
🎤 Transcribe endpoint: http://localhost:${PORT}/api/transcribe

🔧 Configuration:
   • Environment: ${process.env.NODE_ENV || 'development'}
   • Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}
   • Max file size: 200MB
   • Supported formats: wav, mp3, mp4, m4a

Ready to transcribe audio files! 🎉
`);
});

module.exports = app; 