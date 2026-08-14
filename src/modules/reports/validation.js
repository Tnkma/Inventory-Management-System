const validateReportFilters = ({
  startDate,
  endDate,
  locationId,
  ingredientId
}) => {

  if (startDate && Number.isNaN(Date.parse(startDate))) {

    const error = new Error(
      "Invalid start date"
    );

    error.statusCode = 400;

    throw error;
  }


  if (endDate && Number.isNaN(Date.parse(endDate))) {

    const error = new Error(
      "Invalid end date"
    );

    error.statusCode = 400;

    throw error;
  }


  if (
    startDate &&
    endDate &&
    new Date(startDate) > new Date(endDate)
  ) {

    const error = new Error(
      "Start date cannot be after end date"
    );

    error.statusCode = 400;

    throw error;
  }


  if (
    locationId !== undefined &&
    locationId !== null &&
    locationId !== "" &&
    !Number.isInteger(Number(locationId))
  ) {

    const error = new Error(
      "Invalid location ID"
    );

    error.statusCode = 400;

    throw error;
  }


  if (
    ingredientId !== undefined &&
    ingredientId !== null &&
    ingredientId !== "" &&
    !Number.isInteger(Number(ingredientId))
  ) {

    const error = new Error(
      "Invalid ingredient ID"
    );

    error.statusCode = 400;

    throw error;
  }

};


export {
  validateReportFilters
};