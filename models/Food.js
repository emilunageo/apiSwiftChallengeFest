const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del alimento es requerido'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  id_tipo: {
    type: String,
    required: [true, 'El tipo de alimento es requerido'],
    enum: {
      values: [
        'cereales', 'frutas', 'verduras', 'legumbres', 'carnes', 
        'pescados', 'lacteos', 'grasas', 'azucares', 'bebidas',
        'frutos_secos', 'condimentos', 'procesados'
      ],
      message: 'Tipo de alimento no válido'
    }
  },
  indice_glucemico: {
    type: Number,
    required: [true, 'El índice glucémico es requerido'],
    min: [0, 'El índice glucémico debe ser mayor o igual a 0'],
    max: [100, 'El índice glucémico debe ser menor o igual a 100']
  },
  carga_glucemica: {
    type: Number,
    required: [true, 'La carga glucémica es requerida'],
    min: [0, 'La carga glucémica debe ser mayor o igual a 0'],
    max: [50, 'La carga glucémica debe ser menor o igual a 50']
  },
  carbohidratos_totales: {
    type: Number,
    required: [true, 'Los carbohidratos totales son requeridos'],
    min: [0, 'Los carbohidratos deben ser mayor o igual a 0'],
    max: [100, 'Los carbohidratos no pueden exceder 100g por 100g de alimento']
  },
  grasas: {
    type: Number,
    required: [true, 'Las grasas son requeridas'],
    min: [0, 'Las grasas deben ser mayor o igual a 0'],
    max: [100, 'Las grasas no pueden exceder 100g por 100g de alimento']
  },
  proteinas: {
    type: Number,
    required: [true, 'Las proteínas son requeridas'],
    min: [0, 'Las proteínas deben ser mayor o igual a 0'],
    max: [100, 'Las proteínas no pueden exceder 100g por 100g de alimento']
  },
  fibra: {
    type: Number,
    required: [true, 'La fibra es requerida'],
    min: [0, 'La fibra debe ser mayor o igual a 0'],
    max: [50, 'La fibra no puede exceder 50g por 100g de alimento']
  },
  tiempo_digestion_estimado: {
    type: Number,
    required: [true, 'El tiempo de digestión estimado es requerido'],
    min: [5, 'El tiempo de digestión debe ser al menos 5 minutos'],
    max: [480, 'El tiempo de digestión no puede exceder 8 horas (480 minutos)']
  },
  calorias_por_100g: {
    type: Number,
    min: [0, 'Las calorías deben ser mayor o igual a 0'],
    max: [900, 'Las calorías no pueden exceder 900 por 100g']
  },
  descripcion: {
    type: String,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    trim: true
  },
  es_recomendado_diabetes: {
    type: Boolean,
    default: function() {
      // Automatically set based on glycemic index
      return this.indice_glucemico <= 55;
    }
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

// Virtual for glycemic classification
foodSchema.virtual('clasificacion_glucemica').get(function() {
  if (this.indice_glucemico <= 55) return 'bajo';
  if (this.indice_glucemico <= 70) return 'medio';
  return 'alto';
});

// Virtual for glycemic load classification
foodSchema.virtual('clasificacion_carga_glucemica').get(function() {
  if (this.carga_glucemica <= 10) return 'baja';
  if (this.carga_glucemica <= 20) return 'media';
  return 'alta';
});

// Virtual for total macronutrients
foodSchema.virtual('total_macronutrientes').get(function() {
  return this.carbohidratos_totales + this.grasas + this.proteinas;
});

// Indexes for better query performance
foodSchema.index({ nombre: 'text' });
foodSchema.index({ id_tipo: 1 });
foodSchema.index({ indice_glucemico: 1 });
foodSchema.index({ es_recomendado_diabetes: 1 });

// Pre-save middleware to calculate calories if not provided
foodSchema.pre('save', function(next) {
  if (!this.calorias_por_100g) {
    // Rough calculation: 4 cal/g carbs, 4 cal/g protein, 9 cal/g fat
    this.calorias_por_100g = Math.round(
      (this.carbohidratos_totales * 4) + 
      (this.proteinas * 4) + 
      (this.grasas * 9)
    );
  }
  next();
});

// Static method to find foods by glycemic index range
foodSchema.statics.findByGlycemicIndex = function(min = 0, max = 100) {
  return this.find({
    indice_glucemico: { $gte: min, $lte: max },
    isActive: true
  });
};

// Static method to find recommended foods for diabetes
foodSchema.statics.findRecommendedForDiabetes = function() {
  return this.find({
    es_recomendado_diabetes: true,
    isActive: true
  }).sort({ indice_glucemico: 1 });
};

module.exports = mongoose.model('Food', foodSchema);
