const Job = require('../models/Job');
const geminiService = require('./geminiService');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += (vecA[i] * vecB[i]);
    mA += (vecA[i] * vecA[i]);
    mB += (vecB[i] * vecB[i]);
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}

/**
 * Find relevant content from user's knowledge base
 * @param {string} userId 
 * @param {string} query 
 * @returns {Promise<string>} - Context string
 */
async function getRelevantContext(userId, query) {
  try {
    // 1. Generate embedding for the query
    const queryEmbedding = await geminiService.generateEmbedding(query);
    if (!queryEmbedding.length) return "";

    // 2. Find jobs belonging to the user that have embeddings
    const jobs = await Job.find({ 
      userId, 
      status: 'done', 
      embeddings: { $exists: true, $not: { $size: 0 } } 
    }).select('title pipeline.stage2_clean embeddings');

    // 3. Calculate similarity and sort
    const scoredJobs = jobs.map(job => ({
      title: job.title,
      content: job.pipeline.stage2_clean,
      similarity: cosineSimilarity(queryEmbedding, job.embeddings)
    })).sort((a, b) => b.similarity - a.similarity);

    // 4. Take top 3 results and format as context
    const context = scoredJobs.slice(0, 3).map(j => `TÀI LIỆU: ${j.title}\nNỘI DUNG: ${j.content}`).join('\n\n---\n\n');
    
    return context;
  } catch (error) {
    console.error('RAG Context Error:', error);
    return "";
  }
}

/**
 * Chat with the knowledge base
 * @param {string} userId 
 * @param {string} message 
 * @returns {Promise<string>} - AI response
 */
async function chatWithBrain(userId, message) {
  try {
    const context = await getRelevantContext(userId, message);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `
      Bạn là "Trí tuệ Nhân tạo Cá nhân" của sinh viên. 
      Bạn có quyền truy cập vào các tài liệu học tập, bài giảng và ghi chú của sinh viên đó.
      
      Dưới đây là nội dung liên quan từ Kho tri thức của sinh viên:
      ---
      ${context}
      ---

      Nhiệm vụ:
      - Trả lời câu hỏi của sinh viên dựa trên ngữ cảnh được cung cấp ở trên.
      - Nếu nội dung không có trong ngữ cảnh, hãy trả lời dựa trên kiến thức phổ quát của bạn nhưng thông báo cho sinh viên là thông tin này không nằm trong tài liệu của họ.
      - Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp và hỗ trợ học tập tối đa.
    `;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `CÂU HỎI CỦA SINH VIÊN: ${message}` }
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Brain Chat Error:', error);
    throw error;
  }
}

module.exports = {
  chatWithBrain,
};
