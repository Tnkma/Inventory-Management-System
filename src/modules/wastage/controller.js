import {
  recordWastage
} from "./service.js";

import {
  validateRecordWastage
} from "./validation.js";


const recordWastageController = async (
  req,
  res,
  next
) => {

  try {

    const {
      ingredientId,
      quantity,
      reason
    } = req.body;


    validateRecordWastage({
      ingredientId,
      quantity,
      reason
    });


    const wastage =
      await recordWastage(
        {
          ingredientId,
          quantity,
          reason
        },

        req.user.userId
      );


    return res.status(201).json({

      success: true,

      message:
        "Ingredient wastage recorded successfully",

      data: wastage

    });


  } catch (error) {

    next(error);

  }
};


export {
  recordWastageController
};