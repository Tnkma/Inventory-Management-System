const validateRegistration = ({
  firstName,
  lastName,
  email,
  password
}) => {

  if (!firstName || !lastName || !email || !password) {
    const error = new Error(
      "First name, last name, email and password are required"
    );

    error.statusCode = 400;
    throw error;
  }


  if (password.length < 8) {
    const error = new Error(
      "Password must be at least 8 characters"
    );

    error.statusCode = 400;
    throw error;
  }


  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  if (!emailPattern.test(email)) {
    const error = new Error("Invalid email address");
    error.statusCode = 400;
    throw error;
  }
};


const validateLogin = ({ email, password }) => {

  if (!email || !password) {
    const error = new Error(
      "Email and password are required"
    );

    error.statusCode = 400;
    throw error;
  }
};


export {
  validateRegistration,
  validateLogin
};