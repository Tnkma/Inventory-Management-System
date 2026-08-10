import {
  register,
  login
} from "./service.js";

import {
  validateRegistration,
  validateLogin
} from "./validation.js";


const registerUser = async (req, res, next) => {

  try {

    validateRegistration(req.body);

    const user = await register(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user
    });

  } catch (error) {

    next(error);

  }
};


const loginUser = async (req, res, next) => {

  try {

    validateLogin(req.body);

    const result = await login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });

  } catch (error) {

    next(error);

  }
};


export {
  registerUser,
  loginUser
};