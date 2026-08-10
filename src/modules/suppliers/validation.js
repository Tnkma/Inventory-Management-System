const validateCreateSupplier = ({
  name,
  phone,
  email
}) => {

  if (!name) {
    const error = new Error(
      "Supplier name is required"
    );

    error.statusCode = 400;
    throw error;
  }


  if (email) {

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      const error = new Error(
        "Invalid supplier email"
      );

      error.statusCode = 400;
      throw error;
    }
  }


  if (phone && phone.length < 7) {
    const error = new Error(
      "Invalid supplier phone number"
    );

    error.statusCode = 400;
    throw error;
  }

};


export {
  validateCreateSupplier
};