import {
  recordConsumption,
  getConsumptions,
  getConsumptionById
} from "./service.js";

import {
  validateRecordConsumption
} from "./validation.js";


// =========================================================
// GET ALL CONSUMPTION
// =========================================================

const listConsumptions = async (
  req,
  res,
  next
) => {

  try {

    const consumptions =
      await getConsumptions();


    return res.status(200).json({

      success: true,

      data:
        consumptions

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET CONSUMPTION BY ID
// =========================================================

const getConsumption = async (
  req,
  res,
  next
) => {

  try {

    const consumption =
      await getConsumptionById(
        req.params.id
      );


    return res.status(200).json({

      success: true,

      data:
        consumption

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// RECORD CONSUMPTION
// =========================================================

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

      data:
        consumption

    });

  } catch (error) {

    next(error);

  }
};


export {
  listConsumptions,
  getConsumption,
  recordConsumptionController
};