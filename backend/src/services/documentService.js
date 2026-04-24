const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extract text from various document types
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - Mime type of the file
 * @returns {Promise<string>} - Extracted text
 */
async function extractText(filePath, mimeType) {
  try {
    const dataBuffer = fs.readFileSync(filePath);

    if (mimeType === 'application/pdf') {
      const data = await pdf(dataBuffer);
      return data.text;
    } 
    
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    if (mimeType === 'text/plain') {
      return dataBuffer.toString('utf8');
    }

    throw new Error(`Unsupported document type for extraction: ${mimeType}`);
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

module.exports = {
  extractText,
};
