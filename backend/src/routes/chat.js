const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// All chat routes require authentication
router.post('/', auth, chatController.chat);

module.exports = router;
