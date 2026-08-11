const validateCreateLocation = (req, res, next) => {

  const {
    name
  } = req.body;


  if (
    !name ||
    typeof name !== "string" ||
    !name.trim()
  ) {

    const error = new Error(
      "Location name is required"
    );

    error.statusCode = 400;

    throw error;
  }


  next();
};


const validateUpdateLocation = (
  req,
  res,
  next
) => {

  const {
    name
  } = req.body;


  if (
    name !== undefined &&
    (
      typeof name !== "string" ||
      !name.trim()
    )
  ) {

    const error = new Error(
      "Location name must be a valid string"
    );

    error.statusCode = 400;

    throw error;
  }


  next();
};


export {
  validateCreateLocation,
  validateUpdateLocation
};