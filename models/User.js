const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingresa un email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // Don't include password in queries by default
  },
  edad: {
    type: Number,
    required: [true, 'La edad es requerida'],
    min: [1, 'La edad debe ser mayor a 0'],
    max: [120, 'La edad debe ser menor a 120']
  },
  peso: {
    type: Number,
    required: [true, 'El peso es requerido'],
    min: [1, 'El peso debe ser mayor a 0'],
    max: [1000, 'El peso debe ser menor a 1000 kg']
  },
  altura: {
    type: Number,
    required: [true, 'La altura es requerida'],
    min: [0.5, 'La altura debe ser mayor a 0.5 metros'],
    max: [3, 'La altura debe ser menor a 3 metros']
  },
  tipo_diabetes: {
    type: String,
    required: [true, 'El tipo de diabetes es requerido'],
    enum: {
      values: ['tipo 1', 'tipo 2', 'prediabetes'],
      message: 'El tipo de diabetes debe ser: tipo 1, tipo 2, o prediabetes'
    }
  },
  glucosa_basal: {
    type: Number,
    min: [50, 'La glucosa basal debe ser mayor a 50 mg/dL'],
    max: [500, 'La glucosa basal debe ser menor a 500 mg/dL']
  },
  preferencias_alimenticias: {
    type: [String],
    enum: {
      values: ['vegetariano', 'vegano', 'keto', 'paleo', 'mediterranea', 'sin_gluten', 'sin_lactosa', 'ninguna'],
      message: 'Preferencia alimenticia no válida'
    },
    default: ['ninguna']
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for BMI calculation
userSchema.virtual('imc').get(function() {
  return (this.peso / (this.altura * this.altura)).toFixed(2);
});

// Index for better query performance (email index is already created by unique: true)
userSchema.index({ tipo_diabetes: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
