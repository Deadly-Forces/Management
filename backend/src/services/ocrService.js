const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Preprocesses image using Sharp to boost OCR quality.
 * Converts to grayscale, applies normalization and thresholding.
 */
async function preprocessImage(inputBuffer) {
  try {
    return await sharp(inputBuffer)
      .resize({ width: 2400, withoutEnlargement: false }) // Upscale low-res docs
      .grayscale()
      .normalise()
      .threshold(140)
      .png()
      .toBuffer();
  } catch (err) {
    console.warn('[ocrService] Sharp preprocessing warning:', err.message);
    return inputBuffer;
  }
}

/**
 * Extracts raw text from an uploaded document (Buffer or File Path).
 * Supports WebP, PNG, JPEG, TIFF, and PDF formats.
 *
 * @param {string|Buffer} input - File path or buffer
 * @param {string} [mimeType] - Optional MIME type hint
 * @returns {Promise<{ text: string, confidence: number }>}
 */
exports.extractText = async (input, mimeType = '') => {
  try {
    let buffer;
    let ext = '';

    if (typeof input === 'string') {
      if (!fs.existsSync(input)) {
        throw new Error(`File not found at path: ${input}`);
      }
      buffer = fs.readFileSync(input);
      ext = path.extname(input).toLowerCase();
    } else if (Buffer.isBuffer(input)) {
      buffer = input;
    } else {
      throw new Error('Invalid input: must be file path or Buffer');
    }

    // Handle PDF documents
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(buffer);
        if (pdfData.text && pdfData.text.trim().length > 20) {
          return {
            text: pdfData.text.trim(),
            confidence: 95.0
          };
        }
      } catch (pdfErr) {
        console.warn('[ocrService] pdf-parse fallback:', pdfErr.message);
        // If corrupted PDF, let it throw or handle gracefully
        if (pdfErr.message.includes('bad') || pdfErr.message.includes('Invalid PDF')) {
          throw new Error('Corrupted or invalid PDF file');
        }
      }
    }

    // Handle Image inputs (WebP, PNG, JPEG, etc.)
    // First attempt raw OCR
    let { data: { text, confidence } } = await Tesseract.recognize(buffer, 'eng');

    // If confidence < 70% or text is very sparse, apply Sharp preprocessing
    if (confidence < 70 || text.trim().length < 50) {
      const processedBuffer = await preprocessImage(buffer);
      const secondAttempt = await Tesseract.recognize(processedBuffer, 'eng');
      
      // Use whichever attempt yielded higher confidence or longer extracted text
      if (secondAttempt.data.confidence > confidence || secondAttempt.data.text.length > text.length) {
        text = secondAttempt.data.text;
        confidence = secondAttempt.data.confidence;
      }
    }

    return {
      text: text || '',
      confidence: Number((confidence || 75).toFixed(2))
    };
  } catch (error) {
    console.error('[ocrService] OCR Extraction Error:', error.message);
    throw error;
  }
};
