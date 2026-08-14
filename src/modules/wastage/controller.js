import {
  recordWastage,
  getWastages,
  getWastageById
} from "./service.js";

import {
  validateRecordWastage
} from "./validation.js";


// =========================================================
// GET ALL WASTAGE
// =========================================================

const listWastages = async (
  req,
  res,
  next
) => {

  try {

    const wastages =
      await getWastages();


    return res.status(200).json({

      success: true,

      data:
        wastages

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET WASTAGE BY ID
// =========================================================

const getWastage = async (
  req,
  res,
  next
) => {

  try {

    const wastage =
      await getWastageById(
        req.params.id
      );


    return res.status(200).json({

      success: true,

      data:
        wastage

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// RECORD WASTAGE
// =========================================================

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

      data:
        wastage

    });

  } catch (error) {

    next(error);

  }
};


export {
  listWastages,
  getWastage,
  recordWastageController
};