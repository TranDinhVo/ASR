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
 * Process content following the 3-model pipeline: 
 * Stage 1 (Raw) -> Stage 2 (Clean/Correct) -> Stage 3 (Summarize/Extract)
 * @param {string} filePath - Path to local file
 * @param {string} mimeType - Mime type of the file
 * @param {string} textContent - Optional extracted text for documents
 * @returns {Object} - Results containing stage1_raw, stage2_clean, stage3_summary, keyPoints, keywords
 */
async function processPipeline(filePath, mimeType, textContent = null) {
  try {
    const isMedia = mimeType.startsWith('audio/') || mimeType.startsWith('video/');
    let fileUri = null;

    if (isMedia) {
      console.log(`Uploading ${filePath} to Gemini File API...`);
      const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType: mimeType, 
        displayName: path.basename(filePath),
      });

      const file = uploadResult.file;
      let fileStatus = await fileManager.getFile(file.name);
      while (fileStatus.state === "PROCESSING") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        fileStatus = await fileManager.getFile(file.name);
      }

      if (fileStatus.state === "FAILED") {
        throw new Error("File processing failed on Gemini side.");
      }
      fileUri = file.uri;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      Bạn là một AI chuyên gia về giáo dục và quản lý tri thức cho sinh viên.
      Hãy thực hiện quy trình xử lý dữ liệu qua 3 giai đoạn (3-Model Pipeline) sau đây:

      GIAI ĐOẠN 1: RECOGNITION (Whisper equivalent)
      - Nếu là audio/video: Chuyển toàn bộ lời nói thành văn bản thô, trung thực nhất có thể.
      - nếu là tài liệu: Giữ nguyên văn bản đã trích xuất.

      GIAI ĐOẠN 2: ERROR CORRECTION (ViT5-Correct equivalent)
      - Hiệu đính văn bản thô ở Giai đoạn 1. Sửa lỗi chính tả, ngữ pháp, chuẩn hóa các thuật ngữ chuyên môn tiếng Việt.
      - Chuyển đổi các câu nói ngắt quãng từ audio thành câu văn hoàn chỉnh, dễ đọc.

      GIAI ĐOẠN 3: KNOWLEDGE EXTRACTION (ViT5-Summarize equivalent)
      - Tóm tắt nội dung đã hiệu đính ở Giai đoạn 2 thành một bản tóm tắt súc tích, logic.
      - Trích xuất các Ý chính (Key Points) quan trọng nhất cho việc học tập.
      - Trích xuất các Từ khóa (Keywords) chuyên môn.

      Yêu cầu đầu ra trả về JSON theo cấu trúc sau:
      {
        "stage1_raw": "văn bản thô từ Giai đoạn 1",
        "stage2_clean": "văn bản đã hiệu đính từ Giai đoạn 2",
        "stage3_summary": "bản tóm tắt từ Giai đoạn 3",
        "keyPoints": ["ý 1", "ý 2", "..."],
        "keywords": ["từ 1", "từ 2", "..."]
      }
    `;

    const parts = [];
    if (isMedia) {
      parts.push({
        fileData: { mimeType, fileUri }
      });
    }
    
    const textToInclude = textContent ? `NỘI DUNG TÀI LIỆU:\n${textContent}\n\n` : "";
    parts.push({ text: textToInclude + prompt });

    console.log(`🚀 [Gemini] Generating content for Job...`);
    let result;
    let retries = 3;
    while (retries > 0) {
      try {
        result = await model.generateContent(parts);
        break;
      } catch (err) {
        if (err.status === 503 || (err.message && err.message.includes('503'))) {
          retries--;
          if (retries === 0) throw err;
          console.log(`⚠️ [Gemini] 503 Service Unavailable, retrying in 5s... (${retries} retries left)`);
          await new Promise(res => setTimeout(res, 5000));
        } else {
          throw err;
        }
      }
    }
    const responseText = result.response.text();
    
    console.log(`📩 [Gemini] Raw Response length: ${responseText.length}`);

    try {
      return JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON. Response was:", responseText);
      // Fallback to regex if needed
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error("Gemini returned invalid JSON structure");
    }
  } catch (error) {
    console.error("Gemini Pipeline Error:", error.message);
    if (error.response) {
      console.error("Gemini Error Details:", JSON.stringify(error.response.data));
    }
    throw error;
  }
}

/**
 * Generate embeddings for RAG
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Embedding Error:", error);
    return [];
  }
}

module.exports = {
  processPipeline,
  generateEmbedding,
};
