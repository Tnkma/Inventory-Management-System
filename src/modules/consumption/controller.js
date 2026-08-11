import {
  recordConsumption
} from "./service.js";

import {
  validateRecordConsumption
} from "./validation.js";


const recordConsumptionController = async (
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


    validateRecordConsumption({
      ingredientId,
      quantity
    });


    const consumption =
      await recordConsumption(
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
        "Ingredient consumption recorded successfully",

      data: consumption

    });


  } catch (error) {

    next(error);

  }
};


export {
  recordConsumptionController
};