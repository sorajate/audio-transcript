const { GoogleGenAI } = require('@google/genai');
const fs = require('fs-extra');
const path = require('path');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in environment variables');
    }
    
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  /**
   * Convert file to the format expected by Gemini API
   * @param {string} filePath - Path to the audio file
   * @returns {Promise<Object>} File data for Gemini API
   */
  async prepareFileForGemini(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // Map file extensions to MIME types
      const mimeTypes = {
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.m4a': 'audio/mp4'
      };
      
      const mimeType = mimeTypes[fileExtension];
      if (!mimeType) {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      return {
        inlineData: {
          mimeType: mimeType,
          data: fileBuffer.toString('base64')
        }
      };
    } catch (error) {
      console.error('Error preparing file for Gemini:', error);
      throw error;
    }
  }

  /**
   * Format transcript for better readability
   * @param {Object} transcriptData - Raw transcript data from Gemini
   * @returns {Promise<Object>} Formatted transcript
   */
  async formatTranscript(transcriptData) {
    try {
      const systemPrompt = `You are a transcript formatter. Make the content in beautiful format. The text is transcript text I want you to help arrange it to make it easier to read. in format like this:

*Summary content when it got topic to make it easier to understand*
[00:00] message 
[00:50] message ....................
*Summary 2*
[05:00] message 2
[08:50] message 2

You need to follow the coming language if most of it is "Thai" use thai as main language else use english.
Don't adjust the word or try to minimize it. We use it in real serious situation everything must be word by word except we separate the timestamp into new line always.

Just return the formatted text directly without any explanation.`;

      // Create user message with properly escaped data
      const userPrompt = `Here is the transcript to format:

TRANSCRIPT:
${transcriptData.transcript}

TIMESTAMPS:
${transcriptData.transcript_with_timestamps ? transcriptData.transcript_with_timestamps.map(item => 
  `[${item.timestamp}] ${item.speaker}: ${item.text}`
).join('\n') : 'No detailed timestamps available'}

FORMAT IT BEAUTIFULLY WITH TOPIC SUMMARIES AND CLEAR TIMESTAMP SEPARATION.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
          }
        ],
        config: {
          maxOutputTokens: 4096,
          temperature: 0.1,
          topK: 40,
          topP: 0.95
        }
      });

      return {
        success: true,
        formatted_transcript: response.text.trim(),
        original_transcript: transcriptData.transcript
      };

    } catch (error) {
      console.error('Error formatting transcript:', error);
      return {
        success: false,
        formatted_transcript: transcriptData.transcript, // Fallback to original
        original_transcript: transcriptData.transcript,
        error: error.message
      };
    }
  }

  /**
   * Generate summary from transcript text
   * @param {string} transcriptText - The transcript text to summarize
   * @returns {Promise<Object>} Summary with key points
   */
  async generateSummary(transcriptText) {
    try {
      const systemPrompt = `You are an expert content summarizer. Create a comprehensive summary that helps readers quickly understand the key information.

REQUIREMENTS:
- Extract critical points and important context
- Identify main topics and themes
- Highlight key decisions, actions, or conclusions
- Make it easy for readers to understand the core message
- Use clear, concise language
- Include specific details that matter

Return the response in this format:

SUMMARY:
[Your comprehensive summary here]

KEY_POINTS:
• [Critical point 1]
• [Critical point 2] 
• [Critical point 3]
[etc...]

MAIN_TOPICS:
• [Topic 1]
• [Topic 2]
[etc...]`;

      const userPrompt = `Please summarize this transcript:

${transcriptText}

Focus on extracting the most important information and context to help readers understand the content quickly.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
          }
        ],
        config: {
          maxOutputTokens: 2048,
          temperature: 0.2,
          topK: 40,
          topP: 0.95
        }
      });

      const result = response.text.trim();
      
      // Parse the structured response
      const summaryMatch = result.match(/SUMMARY:\s*(.*?)(?=KEY_POINTS:|MAIN_TOPICS:|$)/s);
      const keyPointsMatch = result.match(/KEY_POINTS:\s*(.*?)(?=MAIN_TOPICS:|$)/s);
      const topicsMatch = result.match(/MAIN_TOPICS:\s*(.*?)$/s);

      const summary = summaryMatch ? summaryMatch[1].trim() : result;
      const keyPoints = keyPointsMatch ? 
        keyPointsMatch[1].split('•').filter(p => p.trim()).map(p => p.trim()) : [];
      const mainTopics = topicsMatch ? 
        topicsMatch[1].split('•').filter(t => t.trim()).map(t => t.trim()) : [];

      return {
        success: true,
        summary,
        key_points: keyPoints,
        main_topics: mainTopics,
        raw_response: result
      };

    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        success: false,
        summary: "Summary generation failed",
        key_points: [],
        main_topics: [],
        error: error.message
      };
    }
  }

  /**
   * Transcribe audio file to text only
   * @param {string} filePath - Path to the audio file
   * @returns {Promise<Object>} Transcript with timestamps
   */
  async transcribeOnly(filePath) {
    try {
      // Prepare the audio file for Gemini
      const audioFile = await this.prepareFileForGemini(filePath);
      
      const prompt = `Please transcribe this audio file with timestamps.

REQUIREMENTS:
- Include timestamps every 10-15 seconds and at speaker changes in MM:SS format
- Preserve exact words spoken - no paraphrasing
- Format: [00:05] exact words spoken [00:15] more exact words
- Detect language and speaker changes
- Also provide structured timestamps with speaker identification

Return in this format:

TRANSCRIPT:
[00:00] exact words spoken [00:15] more words [00:30] etc...

STRUCTURED_TIMESTAMPS:
[00:00] Speaker 1: exact words spoken
[00:15] Speaker 1: more words  
[00:30] Speaker 2: etc...

METADATA:
Duration: X minutes
Language: detected language
Speakers: number detected
Quality: assessment`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              audioFile
            ]
          }
        ],
        config: {
          maxOutputTokens: 4096,
          temperature: 0.1,
          topK: 40,
          topP: 0.95
        }
      });

      const result = response.text.trim();
      
      // Parse the structured response
      const transcriptMatch = result.match(/TRANSCRIPT:\s*(.*?)(?=STRUCTURED_TIMESTAMPS:|METADATA:|$)/s);
      const structuredMatch = result.match(/STRUCTURED_TIMESTAMPS:\s*(.*?)(?=METADATA:|$)/s);
      const metadataMatch = result.match(/METADATA:\s*(.*?)$/s);

      const transcript = transcriptMatch ? transcriptMatch[1].trim() : result;
      
      // Parse structured timestamps
      const transcript_with_timestamps = [];
      if (structuredMatch) {
        const timestampLines = structuredMatch[1].split('\n').filter(line => line.trim());
        for (const line of timestampLines) {
          const match = line.match(/\[(\d{2}:\d{2})\]\s*([^:]+):\s*(.*)/);
          if (match) {
            transcript_with_timestamps.push({
              timestamp: match[1],
              speaker: match[2].trim(),
              text: match[3].trim()
            });
          }
        }
      }

      // Parse metadata
      let metadata = {
        estimated_duration: "Unknown",
        language: "Unknown",
        speakers: "Unknown",
        audio_quality: "Unknown"
      };
      
      if (metadataMatch) {
        const metadataText = metadataMatch[1];
        const durationMatch = metadataText.match(/Duration:\s*([^\n]+)/);
        const languageMatch = metadataText.match(/Language:\s*([^\n]+)/);
        const speakersMatch = metadataText.match(/Speakers:\s*([^\n]+)/);
        const qualityMatch = metadataText.match(/Quality:\s*([^\n]+)/);
        
        if (durationMatch) metadata.estimated_duration = durationMatch[1].trim();
        if (languageMatch) metadata.language = languageMatch[1].trim();
        if (speakersMatch) metadata.speakers = speakersMatch[1].trim();
        if (qualityMatch) metadata.audio_quality = qualityMatch[1].trim();
      }

      return {
        success: true,
        transcript,
        transcript_with_timestamps,
        metadata,
        raw_response: result
      };

    } catch (error) {
      console.error('Error in transcription:', error);
      return {
        success: false,
        transcript: "Transcription failed",
        transcript_with_timestamps: [],
        metadata: {
          estimated_duration: "Unknown",
          language: "Unknown", 
          speakers: "Unknown",
          audio_quality: "Unknown"
        },
        error: error.message
      };
    }
  }

  /**
   * Generate transcript and summary for audio file (3-step process)
   * @param {string} filePath - Path to the audio file
   * @returns {Promise<Object>} Transcript and summary
   */
  async transcribeAndSummarize(filePath) {
    try {
      console.log('Step 1: Transcribing audio to text...');
      // Step 1: Get transcript with timestamps
      const transcriptResult = await this.transcribeOnly(filePath);
      
      if (!transcriptResult.success) {
        return {
          success: false,
          error: 'Transcription failed: ' + transcriptResult.error
        };
      }

      console.log('Step 2: Generating summary from transcript...');
      // Step 2: Generate summary from transcript text
      const summaryResult = await this.generateSummary(transcriptResult.transcript);

      console.log('Step 3: Formatting transcript for better readability...');
      // Step 3: Format the transcript beautifully
      const formatResult = await this.formatTranscript(transcriptResult);

      // Combine all results
      const finalResult = {
        transcript: transcriptResult.transcript,
        transcript_with_timestamps: transcriptResult.transcript_with_timestamps,
        metadata: transcriptResult.metadata,
        summary: summaryResult.summary || "Summary generation failed",
        key_points: summaryResult.key_points || [],
        main_topics: summaryResult.main_topics || [],
        confidence_score: "high", // Since we're doing multi-step processing
        formatted_transcript: formatResult.formatted_transcript,
        formatting_success: formatResult.success,
        summary_success: summaryResult.success
      };

      return {
        success: true,
        data: finalResult,
        raw_responses: {
          transcript: transcriptResult.raw_response,
          summary: summaryResult.raw_response
        }
      };

    } catch (error) {
      console.error('Error in 3-step transcription and summarization:', error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Check if file type is supported
   * @param {string} mimeType - MIME type of the file
   * @returns {boolean} Whether the file type is supported
   */
  isSupportedFileType(mimeType) {
    const supportedTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'video/mp4',
      'audio/mp4'
    ];
    return supportedTypes.includes(mimeType);
  }

  /**
   * Validate file size (200MB limit)
   * @param {number} fileSize - File size in bytes
   * @returns {boolean} Whether the file size is acceptable
   */
  isValidFileSize(fileSize) {
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    return fileSize <= maxSize;
  }
}

module.exports = GeminiService; 