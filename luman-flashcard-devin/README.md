# Luman Flashcard Generator - Backend

Flashcard generation backend for the Luman learning platform. This service transforms various learning materials into AI-powered interactive flashcards.

## Features

- **Multiple Input Types**: 
  - PDF files (with OCR support for scanned documents)
  - Word documents (.docx)
  - PowerPoint presentations (.pptx)
  - YouTube video URLs (transcript extraction)
  - Direct text input

- **AI-Powered**: Uses Sarvam AI to generate intelligent, context-aware flashcards

- **Smart Flashcard Format**:
  - Question and answer pairs
  - Category classification
  - Difficulty levels (easy, medium, hard)
  - Key points for each concept

- **OCR Support**: Tesseract.js for handling scanned PDFs

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` and add your Sarvam AI API key:
```
SARVAM_AI_API_KEY=your_actual_api_key_here
PORT=3000
```

## Usage

Start the server:
```bash
node server.js
```

The demo webpage will be available at: `http://localhost:3000`

## API Endpoints

### 1. File Upload
- **POST** `/api/flashcards/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (PDF, Word, or PowerPoint file)
- **Response**: JSON with generated flashcards

### 2. YouTube URL
- **POST** `/api/flashcards/youtube`
- **Content-Type**: `application/json`
- **Body**: `{ "url": "youtube_url" }`
- **Response**: JSON with generated flashcards

### 3. Text Input
- **POST** `/api/flashcards/text`
- **Content-Type**: `application/json`
- **Body**: `{ "text": "your learning material" }`
- **Response**: JSON with generated flashcards

### 4. Health Check
- **GET** `/api/health`
- **Response**: `{ "status": "ok", "message": "Flashcard API is running" }`

## Response Format

```json
{
  "success": true,
  "sourceType": "PDF",
  "textLength": 12345,
  "flashcards": [
    {
      "question": "What is machine learning?",
      "answer": "Machine learning is a subset of AI that enables systems to learn from data.",
      "category": "AI Concepts",
      "difficulty": "medium",
      "keyPoints": [
        "Subset of AI",
        "Learns from data",
        "Improves with experience"
      ]
    }
  ],
  "summary": "Brief summary of the main topics covered"
}
```

## Technology Stack

- **Backend**: Express.js
- **File Processing**: 
  - PDF: pdf-parse
  - Word: mammoth
  - PowerPoint: Custom XML parsing
  - OCR: Tesseract.js
- **Video Processing**: ytdl-core, youtube-transcript
- **AI**: Sarvam AI API
- **Demo Frontend**: Plain HTML/CSS/JavaScript

## Cost Optimization

- Single API call per request (batch processing)
- Efficient prompt engineering
- Fallback mechanism if AI fails
- No caching (as requested)

## Integration Notes

This backend is designed to be integrated with other Luman features:
- Mind maps
- RAG (Retrieval Augmented Generation)
- Adaptive study plans

The API responses are structured to work seamlessly with other backend services.

## Troubleshooting

1. **OCR Performance**: OCR can be slow for large PDFs. Consider implementing progress indicators for production.

2. **YouTube Transcripts**: Some videos may not have transcripts available. The API will return an error in such cases.

3. **Sarvam AI API**: Ensure your API key is valid and has sufficient credits. The system includes a fallback mode if the API fails.

## Development

For development with auto-reload:
```bash
npm install -g nodemon
nodemon server.js
```

## License

ISC