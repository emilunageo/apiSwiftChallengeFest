const Food = require('../models/Food');

// @desc    Get all foods
// @route   GET /api/foods
// @access  Public
const getFoods = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tipo,
      indice_glucemico_max,
      recomendado_diabetes,
      sort = 'nombre'
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Search by name
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by type
    if (tipo) {
      query.id_tipo = tipo;
    }

    // Filter by glycemic index
    if (indice_glucemico_max) {
      query.indice_glucemico = { $lte: parseInt(indice_glucemico_max) };
    }

    // Filter recommended for diabetes
    if (recomendado_diabetes === 'true') {
      query.es_recomendado_diabetes = true;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const foods = await Food.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Food.countDocuments(query);

    res.json({
      success: true,
      data: {
        foods,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get single food
// @route   GET /api/foods/:id
// @access  Public
const getFood = async (req, res) => {
  try {
    const food = await Food.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Alimento no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        food
      }
    });

  } catch (error) {
    console.error('Get food error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de alimento inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Create new food
// @route   POST /api/foods
// @access  Private (could be public for hackathon)
const createFood = async (req, res) => {
  try {
    const foodData = req.body;

    const food = new Food(foodData);
    await food.save();

    res.status(201).json({
      success: true,
      message: 'Alimento creado exitosamente',
      data: {
        food
      }
    });

  } catch (error) {
    console.error('Create food error:', error);

    // Handle validation errors
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

// @desc    Update food
// @route   PUT /api/foods/:id
// @access  Private
const updateFood = async (req, res) => {
  try {
    const food = await Food.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Alimento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Alimento actualizado exitosamente',
      data: {
        food
      }
    });

  } catch (error) {
    console.error('Update food error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de alimento inválido'
      });
    }

    // Handle validation errors
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

// @desc    Delete food (soft delete)
// @route   DELETE /api/foods/:id
// @access  Private
const deleteFood = async (req, res) => {
  try {
    const food = await Food.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Alimento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Alimento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Delete food error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de alimento inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get recommended foods for diabetes
// @route   GET /api/foods/recommended
// @access  Public
const getRecommendedFoods = async (req, res) => {
  try {
    const foods = await Food.findRecommendedForDiabetes();

    res.json({
      success: true,
      data: {
        foods,
        count: foods.length
      }
    });

  } catch (error) {
    console.error('Get recommended foods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood,
  getRecommendedFoods
};
