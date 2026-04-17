const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require("fs");
const path = require("path");

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

/**
 * Transcribe and summarize audio file using Gemini 1.5 Flash
 * @param {string} filePath - Path to local audio file
 * @param {string} language - Language ('vi', 'en', etc.)
 * @param {string} mimeType - Mime type of the file
 * @returns {Object} - { transcript, summary, keyPoints, keywords }
 */
async function transcribeAndSummarize(filePath, language = 'vi', mimeType = 'audio/mpeg') {
  try {
    // 1. Upload file to Gemini File API
    console.log(`Uploading ${filePath} to Gemini File API...`);
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: mimeType, 
      displayName: path.basename(filePath),
    });

    const file = uploadResult.file;
    console.log(`Uploaded file: ${file.displayName} (URI: ${file.uri})`);

    // 2. Poll for file processing (audio files might take a moment to be "ACTIVE")
    // Note: For small files, it's usually active immediately, but let's be safe.
    let fileStatus = await fileManager.getFile(file.name);
    while (fileStatus.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      fileStatus = await fileManager.getFile(file.name);
    }

    if (fileStatus.state === "FAILED") {
      throw new Error("Audio file processing failed on Gemini side.");
    }

    // 3. Generate content
    const model = genAI.getGenerativeModel(
      { model: "gemini-flash-latest" },
      { apiVersion: "v1beta" }
    );

    const prompt = `
      Bạn là một trợ lý AI chuyên nghiệp về xử lý âm thanh. 
      Nhiệm vụ của bạn là xử lý file âm thanh đính kèm và trả về kết quả dưới định dạng JSON chính xác như sau:
      {
        "transcript": "toàn bộ văn bản chuyển từ âm thanh",
        "summary": "một đoạn văn ngắn tóm tắt nội dung chính",
        "keyPoints": ["ý chính 1", "ý chính 2", "abc..."],
        "keywords": ["từ khoá 1", "từ khoá 2", "..."],
        "segments": [
          { "start": 0, "end": 10, "text": "nội dung đoạn đầu" },
          ...
        ]
      }
      
      Yêu cầu:
      - Tự động nhận diện ngôn ngữ được nói trong audio và sử dụng CHÍNH ngôn ngữ đó để viết transcript, summary và keyPoints.
      - Nếu là đoạn hội thoại, hãy cố gắng phân biệt các câu.
      - Phần 'segments' hãy chia nhỏ theo thời gian (giây) nếu có thể.
      - CHỈ trả về JSON, không kèm giải thích gì thêm.
    `;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    console.log("Gemini Response received");

    // Extract JSON from response (handling potential markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Gemini response");
    }

    const data = JSON.parse(jsonMatch[0]);

    // 4. Cleanup (optional: Gemini File API files expire after 2 days anyway)
    // await fileManager.deleteFile(file.name);

    return data;
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
}

module.exports = {
  transcribeAndSummarize,
};
