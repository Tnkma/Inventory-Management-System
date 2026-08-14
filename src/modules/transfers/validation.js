// =========================================================
// CREATE TRANSFER REQUEST
// =========================================================

const validateCreateTransfer = (
  req,
  res,
  next
) => {

  const {
    ingredientId,
    quantity,
    reason
  } = req.body;


  // -------------------------------------------------------
  // Ingredient
  // -------------------------------------------------------

  if (!ingredientId) {

    const error = new Error(
      "Ingredient is required"
    );

    error.statusCode = 400;

    throw error;
  }


  // -------------------------------------------------------
  // Quantity
  // -------------------------------------------------------

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


  // -------------------------------------------------------
  // Reason
  // -------------------------------------------------------

  if (
    reason !== undefined &&
    reason !== null &&
    (
      typeof reason !== "string" ||
      reason.trim().length === 0
    )
  ) {

    const error = new Error(
      "Transfer reason must be a valid string"
    );

    error.statusCode = 400;

    throw error;
  }


  next();
};


// =========================================================
// REJECT TRANSFER
// =========================================================

const validateRejectTransfer = (
  req,
  res,
  next
) => {

  const {
    rejectionReason
  } = req.body;


  if (
    !rejectionReason ||
    typeof rejectionReason !== "string" ||
    !rejectionReason.trim()
  ) {

    const error = new Error(
      "Rejection reason is required"
    );

    error.statusCode = 400;

    throw error;
  }


  next();
};


export {
  validateCreateTransfer,
  validateRejectTransfer
};