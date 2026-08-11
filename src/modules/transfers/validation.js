const validateCreateTransfer = (
  req,
  res,
  next
) => {

  const {
    ingredientId,
    fromLocationId,
    toLocationId,
    quantity
  } = req.body;


  if (!ingredientId) {

    const error = new Error(
      "Ingredient is required"
    );

    error.statusCode = 400;

    throw error;
  }


  if (!fromLocationId) {

    const error = new Error(
      "Source location is required"
    );

    error.statusCode = 400;

    throw error;
  }


  if (!toLocationId) {

    const error = new Error(
      "Destination location is required"
    );

    error.statusCode = 400;

    throw error;
  }


  if (
    quantity === undefined ||
    quantity === null ||
    Number(quantity) <= 0
  ) {

    const error = new Error(
      "Transfer quantity must be greater than zero"
    );

    error.statusCode = 400;

    throw error;
  }


  if (
    Number(fromLocationId) ===
    Number(toLocationId)
  ) {

    const error = new Error(
      "Source and destination locations must be different"
    );

    error.statusCode = 400;

    throw error;
  }


  next();
};


export {
  validateCreateTransfer
};