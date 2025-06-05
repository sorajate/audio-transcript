const express = require('express');
const router = express.Router();
const GeminiService = require('../utils/gemini');
const { uploadWithErrorHandling, cleanupFile } = require('../middleware/upload');

// Initialize Gemini service
const geminiService = new GeminiService();

/**
 * POST /transcribe
 * Upload audio file and get transcription + summary
 */
router.post('/', uploadWithErrorHandling, async (req, res) => {
  const startTime = Date.now();
  let filePath = null;
  
  try {
    // Get uploaded file information
    const file = req.file;
    filePath = file.path;
    
    console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);
    
    // Validate file with Gemini service
    if (!geminiService.isSupportedFileType(file.mimetype)) {
      await cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        error: `Unsupported file type: ${file.mimetype}`,
        code: 'UNSUPPORTED_FILE_TYPE'
      });
    }
    
    if (!geminiService.isValidFileSize(file.size)) {
      await cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 200MB limit',
        code: 'FILE_TOO_LARGE'
      });
    }
    
    // Process the audio file with Gemini
    console.log('Sending file to Gemini for processing...');
    const result = await geminiService.transcribeAndSummarize(filePath);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    if (result.success) {
      // Successful transcription
      const response = {
        success: true,
        data: {
          ...result.data,
          processing_info: {
            file_name: file.originalname,
            file_size: file.size,
            file_type: file.mimetype,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
          }
        },
        message: 'Audio file successfully transcribed and summarized'
      };
      
      console.log(`Successfully processed ${file.originalname} in ${processingTime}ms`);
      
      // Clean up uploaded file
      await cleanupFile(filePath);
      
      res.json(response);
    } else {
      // Error in transcription
      console.error(`Failed to process ${file.originalname}:`, result.error);
      
      // Clean up uploaded file
      await cleanupFile(filePath);
      
      res.status(500).json({
        success: false,
        error: 'Failed to process audio file: ' + result.error,
        code: 'PROCESSING_ERROR',
        processing_info: {
          file_name: file.originalname,
          file_size: file.size,
          file_type: file.mimetype,
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        }
      });
    }
    
  } catch (error) {
    console.error('Unexpected error in transcription route:', error);
    
    // Clean up uploaded file if it exists
    if (filePath) {
      await cleanupFile(filePath);
    }
    
    const processingTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR',
      processing_info: {
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /transcribe/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Transcription service is healthy',
    timestamp: new Date().toISOString(),
    gemini_configured: !!process.env.GEMINI_API_KEY
  });
});

/**
 * GET /transcribe/supported-formats
 * Get list of supported audio formats
 */
router.get('/supported-formats', (req, res) => {
  res.json({
    success: true,
    data: {
      supported_formats: [
        {
          extension: '.wav',
          mime_type: 'audio/wav',
          description: 'Waveform Audio File Format'
        },
        {
          extension: '.mp3',
          mime_type: 'audio/mpeg',
          description: 'MPEG Audio Layer III'
        },
        {
          extension: '.mp4',
          mime_type: 'video/mp4',
          description: 'MPEG-4 Part 14 (audio/video)'
        },
        {
          extension: '.m4a',
          mime_type: 'audio/mp4',
          description: 'MPEG-4 Audio'
        }
      ],
      max_file_size: '200MB',
      field_name: 'audio'
    },
    message: 'Supported audio formats for transcription'
  });
});

module.exports = router; 