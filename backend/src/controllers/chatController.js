const ragService = require('../services/ragService');

/**
 * Handle student chat queries (RAG)
 */
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId; // Requires auth

    if (!message) {
      return res.status(400).json({ message: 'Vui lòng nhập lời nhắn' });
    }

    const response = await ragService.chatWithBrain(userId, message);

    res.json({
      message: response,
      role: 'assistant',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
