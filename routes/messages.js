const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  markMessagesAsRead,
  getUnreadCount,
  getConversation
} = require('../controllers/messageController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/messages
// @desc    Get messages for authenticated user
// @access  Private
// Query params: page, limit, conversation_with, unread_only, sent_only, received_only
router.get('/', getMessages);

// @route   GET /api/messages/unread-count
// @desc    Get unread messages count
// @access  Private
router.get('/unread-count', getUnreadCount);

// @route   GET /api/messages/conversation/:userId
// @desc    Get conversation between current user and specified user
// @access  Private
router.get('/conversation/:userId', getConversation);

// @route   PUT /api/messages/mark-read
// @desc    Mark multiple messages as read
// @access  Private
router.put('/mark-read', markMessagesAsRead);

// @route   POST /api/messages
// @desc    Create new message
// @access  Private
router.post('/', createMessage);

// @route   GET /api/messages/:id
// @desc    Get specific message
// @access  Private
router.get('/:id', getMessage);

// @route   PUT /api/messages/:id
// @desc    Update message (only if not read yet)
// @access  Private
router.put('/:id', updateMessage);

// @route   DELETE /api/messages/:id
// @desc    Delete message (soft delete)
// @access  Private
router.delete('/:id', deleteMessage);

module.exports = router;
