import jwt from "jsonwebtoken";

import env from "../config/env.js";


const authenticate = (req, res, next) => {

  try {

    const authorization =
      req.headers.authorization;


    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required"
      });
    }


    const [scheme, token] =
      authorization.split(" ");


    if (
      scheme !== "Bearer" ||
      !token
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format"
      });
    }


    const decoded = jwt.verify(
      token,
      env.jwt.secret
    );


    req.user = decoded;


    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });

  }

};


export default authenticate;