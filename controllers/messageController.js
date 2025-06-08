const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages for authenticated user
// @route   GET /api/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      conversation_with,
      unread_only = false,
      sent_only = false,
      received_only = false
    } = req.query;

    const userId = req.user._id;
    const skip = (page - 1) * limit;

    // Build query
    let query = { is_deleted: false };

    if (conversation_with) {
      // Get conversation between current user and specific user
      query = {
        $or: [
          { from_user_id: userId, to_user_id: conversation_with },
          { from_user_id: conversation_with, to_user_id: userId }
        ],
        is_deleted: false
      };
    } else if (unread_only === 'true') {
      // Get only unread messages for current user
      query = {
        to_user_id: userId,
        read_at: null,
        is_deleted: false
      };
    } else if (sent_only === 'true') {
      // Get only sent messages
      query = {
        from_user_id: userId,
        is_deleted: false
      };
    } else if (received_only === 'true') {
      // Get only received messages
      query = {
        to_user_id: userId,
        is_deleted: false
      };
    } else {
      // Get all messages (sent and received)
      query = {
        $or: [
          { from_user_id: userId },
          { to_user_id: userId }
        ],
        is_deleted: false
      };
    }

    const messages = await Message.find(query)
      .populate('from_user_id', 'nombre email')
      .populate('to_user_id', 'nombre email')
      .sort({ sent_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_messages: total,
          has_next: page * limit < total,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get specific message
// @route   GET /api/messages/:id
// @access  Private
const getMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { from_user_id: userId },
        { to_user_id: userId }
      ],
      is_deleted: false
    })
    .populate('from_user_id', 'nombre email')
    .populate('to_user_id', 'nombre email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    // Mark as read if user is the recipient and message is unread
    if (message.to_user_id._id.toString() === userId.toString() && !message.read_at) {
      await message.markAsRead();
    }

    res.json({
      success: true,
      data: {
        message
      }
    });

  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Create new message
// @route   POST /api/messages
// @access  Private
const createMessage = async (req, res) => {
  try {
    const { to_user_id, content } = req.body;
    const from_user_id = req.user._id;

    // Validate input
    if (!to_user_id || !content) {
      return res.status(400).json({
        success: false,
        message: 'El destinatario y el contenido son requeridos'
      });
    }

    // Check if recipient exists and is active
    const recipient = await User.findOne({ 
      _id: to_user_id, 
      isActive: true 
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Usuario destinatario no encontrado'
      });
    }

    // Create message
    const message = new Message({
      from_user_id,
      to_user_id,
      content: content.trim()
    });

    await message.save();

    // Populate user data for response
    await message.populate('from_user_id', 'nombre email');
    await message.populate('to_user_id', 'nombre email');

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: {
        message
      }
    });

  } catch (error) {
    console.error('Create message error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors
      });
    }

    // Handle custom validation errors (like self-messaging)
    if (error.message === 'Un usuario no puede enviarse mensajes a sí mismo') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Update message (only content, and only if not read yet)
// @route   PUT /api/messages/:id
// @access  Private
const updateMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'El contenido es requerido'
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      from_user_id: userId,
      is_deleted: false
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado o no tienes permisos para editarlo'
      });
    }

    // Only allow editing if message hasn't been read yet
    if (message.read_at) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un mensaje que ya ha sido leído'
      });
    }

    message.content = content.trim();
    await message.save();

    await message.populate('from_user_id', 'nombre email');
    await message.populate('to_user_id', 'nombre email');

    res.json({
      success: true,
      message: 'Mensaje actualizado exitosamente',
      data: {
        message
      }
    });

  } catch (error) {
    console.error('Update message error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Delete message (soft delete)
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      from_user_id: userId,
      is_deleted: false
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado o no tienes permisos para eliminarlo'
      });
    }

    await message.softDelete();

    res.json({
      success: true,
      message: 'Mensaje eliminado exitosamente'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/mark-read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { message_ids } = req.body;
    const userId = req.user._id;

    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de mensajes'
      });
    }

    const result = await Message.markAsRead(message_ids, userId);

    res.json({
      success: true,
      message: `${result.modifiedCount} mensaje(s) marcado(s) como leído(s)`,
      data: {
        modified_count: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Message.countDocuments({
      to_user_id: userId,
      read_at: null,
      is_deleted: false
    });

    res.json({
      success: true,
      data: {
        unread_count: count
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Check if the other user exists
    const otherUser = await User.findOne({
      _id: otherUserId,
      isActive: true
    });

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const messages = await Message.getConversation(currentUserId, otherUserId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Message.countDocuments({
      $or: [
        { from_user_id: currentUserId, to_user_id: otherUserId },
        { from_user_id: otherUserId, to_user_id: currentUserId }
      ],
      is_deleted: false
    });

    res.json({
      success: true,
      data: {
        messages,
        other_user: {
          _id: otherUser._id,
          nombre: otherUser.nombre,
          email: otherUser.email
        },
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_messages: total,
          has_next: page * limit < total,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  markMessagesAsRead,
  getUnreadCount,
  getConversation
};
