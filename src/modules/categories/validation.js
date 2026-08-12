const validateCreateCategory = (req, res, next) => {

  const {
    name
  } = req.body;


  if (!name || !name.trim()) {

    const error = new Error(
      "Category name is required"
    );

    error.statusCode = 400;

    throw error;
  }


  next();
};


const validateUpdateCategory = (req, res, next) => {

  const {
    name
  } = req.body;


  if (
    name !== undefined &&
    !name.trim()
  ) {

    const error = new Error(
      "Category name cannot be empty"
    );

    error.statusCode = 400;

    throw error;
  }


  next();
};


const validateCategoryStatus = (req, res, next) => {

  const {
    isActive
  } = req.body;


  if (
    typeof isActive !== "boolean"
  ) {

    const error = new Error(
      "isActive must be a boolean"
    );

    error.statusCode = 400;

    throw error;
  }


  next();
};


export {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryStatus
};