const validateCreateIngredient = ({
  name,
  categoryId,
  unit
}) => {

  if (!name) {
    const error = new Error(
      "Ingredient name is required"
    );

    error.statusCode = 400;
    throw error;
  }


  if (!categoryId) {
    const error = new Error(
      "Category is required"
    );

    error.statusCode = 400;
    throw error;
  }


  if (!unit) {
    const error = new Error(
      "Unit of measurement is required"
    );

    error.statusCode = 400;
    throw error;
  }

};


export {
  validateCreateIngredient
};