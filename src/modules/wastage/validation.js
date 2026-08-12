const validateRecordWastage = ({
  ingredientId,
  quantity,
  reason
}) => {

  if (!ingredientId) {

    const error = new Error(
      "Ingredient ID is required"
    );

    error.statusCode = 400;

    throw error;
  }


  if (
    quantity === undefined ||
    quantity === null
  ) {

    const error = new Error(
      "Wastage quantity is required"
    );

    error.statusCode = 400;

    throw error;
  }


  if (
    !Number.isFinite(
      Number(quantity)
    ) ||
    Number(quantity) <= 0
  ) {

    const error = new Error(
      "Wastage quantity must be greater than zero"
    );

    error.statusCode = 400;

    throw error;
  }


  if (
    !reason ||
    !reason.trim()
  ) {

    const error = new Error(
      "Wastage reason is required"
    );

    error.statusCode = 400;

    throw error;
  }

};


export {
  validateRecordWastage
};