const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const JSZip = require('jszip');
const youtubeTranscript = require('youtube-transcript');
const Tesseract = require('tesseract.js');

/**
 * Extract embedded JPEG buffers from a PDF for OCR fallback
 */
function extractJpegsFromPdfBuffer(pdfBuffer) {
  const images = [];
  const startMarker = Buffer.from([0xFF, 0xD8, 0xFF]);
  const endMarker = Buffer.from([0xFF, 0xD9]);

  let pos = 0;
  while (pos < pdfBuffer.length && images.length < 8) {
    const start = pdfBuffer.indexOf(startMarker, pos);
    if (start === -1) break;

    const end = pdfBuffer.indexOf(endMarker, start + startMarker.length);
    if (end === -1) break;

    const jpegBuffer = pdfBuffer.slice(start, end + endMarker.length);
    if (jpegBuffer.length > 8000) {
      images.push(jpegBuffer);
    }
    pos = end + endMarker.length;
  }
  return images;
}

/**
 * Perform Tesseract OCR on scanned documents
 */
async function performOCR(filePath, pdfBuffer) {
  console.log('📄 Scanned document detected. Launching Tesseract.js OCR engine...');
  let combinedText = '';

  try {
    const jpegBuffers = extractJpegsFromPdfBuffer(pdfBuffer);
    if (jpegBuffers.length > 0) {
      console.log(`🔍 Extracted ${jpegBuffers.length} page images from PDF for OCR processing.`);
      for (let i = 0; i < jpegBuffers.length; i++) {
        try {
          const result = await Tesseract.recognize(jpegBuffers[i], 'eng');
          if (result && result.data && result.data.text) {
            combinedText += `\n--- Page ${i + 1} (OCR) ---\n` + result.data.text;
          }
        } catch (imgErr) {
          console.warn(`OCR warning on image ${i + 1}:`, imgErr.message);
        }
      }
    }
  } catch (ocrError) {
    console.error('❌ OCR Processing Error:', ocrError.message);
  }

  return combinedText.trim();
}

/**
 * Extract text from PDF buffer/path
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let extractedText = '';

    try {
      const data = await pdfParse(dataBuffer);
      extractedText = (data && data.text) ? data.text.trim() : '';
    } catch (parseErr) {
      console.warn('PDF text parse warning:', parseErr.message);
    }

    if (extractedText.length < 50) {
      console.log('⚠️ Minimal text found in PDF layer. Falling back to OCR processing...');
      const ocrText = await performOCR(filePath, dataBuffer);
      if (ocrText.length > 10) {
        extractedText = ocrText;
      }
    }

    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from Word document (.docx, .doc)
 */
async function extractTextFromWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value ? result.value.trim() : '';
  } catch (error) {
    console.error('Word extraction error:', error.message);
    throw new Error(`Failed to extract text from Word document: ${error.message}`);
  }
}

/**
 * Extract text from PowerPoint (.pptx)
 */
async function extractTextFromPPTX(filePath) {
  try {
    const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
        const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
        return numA - numB;
      });

    let fullText = '';
    for (let index = 0; index < slideFiles.length; index++) {
      const fileName = slideFiles[index];
      const content = await zip.file(fileName).async('string');
      const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
      if (textMatches) {
        const slideText = textMatches
          .map(m => m.replace(/<a:t[^>]*>|<\/a:t>/g, '').trim())
          .filter(t => t.length > 0)
          .join(' ');
        if (slideText) {
          fullText += `\n--- Slide ${index + 1} ---\n${slideText}`;
        }
      }
    }

    return fullText.trim() || 'No text could be extracted from PowerPoint slides.';
  } catch (error) {
    console.error('PPTX extraction error:', error.message);
    throw new Error(`Failed to extract text from PowerPoint: ${error.message}`);
  }
}

/**
 * Parse YouTube Video ID
 */
function parseYouTubeVideoId(url) {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

/**
 * Extract YouTube captions transcript
 */
async function extractYouTubeTranscript(url) {
  const videoId = parseYouTubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL format. Please provide a valid YouTube video or shorts link.');
  }

  try {
    console.log(`🎬 Fetching YouTube transcript for video ID: ${videoId}`);
    const transcriptItems = await youtubeTranscript.fetchTranscript(videoId);
    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('No public captions or transcript found for this video.');
    }
    const text = transcriptItems.map(item => item.text).join(' ');
    return text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\n/g, ' ');
  } catch (error) {
    console.error('YouTube transcript error:', error.message);
    throw new Error(`Could not fetch YouTube transcript: ${error.message}`);
  }
}

module.exports = {
  extractTextFromPDF,
  extractTextFromWord,
  extractTextFromPPTX,
  extractYouTubeTranscript,
};
