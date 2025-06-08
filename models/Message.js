const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario remitente es requerido']
  },
  to_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario destinatario es requerido']
  },
  content: {
    type: String,
    required: [true, 'El contenido del mensaje es requerido'],
    trim: true,
    maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres'],
    minlength: [1, 'El mensaje debe tener al menos 1 caracter']
  },
  sent_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  read_at: {
    type: Date,
    default: null
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para verificar si el mensaje ha sido leído
messageSchema.virtual('is_read').get(function() {
  return this.read_at !== null;
});

// Virtual para obtener el tiempo transcurrido desde el envío
messageSchema.virtual('time_since_sent').get(function() {
  const now = new Date();
  const diffMs = now - this.sent_at;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else if (diffMins > 0) {
    return `${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  } else {
    return 'Ahora';
  }
});

// Índices para mejorar el rendimiento de las consultas
messageSchema.index({ from_user_id: 1, sent_at: -1 });
messageSchema.index({ to_user_id: 1, sent_at: -1 });
messageSchema.index({ from_user_id: 1, to_user_id: 1, sent_at: -1 });
messageSchema.index({ is_deleted: 1 });

// Middleware pre-save para validaciones adicionales
messageSchema.pre('save', function(next) {
  // Evitar que un usuario se envíe mensajes a sí mismo
  if (this.from_user_id.toString() === this.to_user_id.toString()) {
    const error = new Error('Un usuario no puede enviarse mensajes a sí mismo');
    return next(error);
  }
  next();
});

// Método estático para obtener conversación entre dos usuarios
messageSchema.statics.getConversation = function(userId1, userId2, options = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  return this.find({
    $or: [
      { from_user_id: userId1, to_user_id: userId2 },
      { from_user_id: userId2, to_user_id: userId1 }
    ],
    is_deleted: false
  })
  .populate('from_user_id', 'nombre email')
  .populate('to_user_id', 'nombre email')
  .sort({ sent_at: -1 })
  .skip(skip)
  .limit(limit);
};

// Método estático para obtener mensajes no leídos de un usuario
messageSchema.statics.getUnreadMessages = function(userId) {
  return this.find({
    to_user_id: userId,
    read_at: null,
    is_deleted: false
  })
  .populate('from_user_id', 'nombre email')
  .sort({ sent_at: -1 });
};

// Método estático para marcar mensajes como leídos
messageSchema.statics.markAsRead = function(messageIds, userId) {
  return this.updateMany(
    {
      _id: { $in: messageIds },
      to_user_id: userId,
      read_at: null,
      is_deleted: false
    },
    {
      read_at: new Date()
    }
  );
};

// Método de instancia para marcar un mensaje como leído
messageSchema.methods.markAsRead = function() {
  if (!this.read_at) {
    this.read_at = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Método de instancia para eliminar lógicamente un mensaje
messageSchema.methods.softDelete = function() {
  this.is_deleted = true;
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
