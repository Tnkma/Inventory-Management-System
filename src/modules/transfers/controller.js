import {
  createTransfer,
  getTransfers,
  getTransferById
} from "./service.js";


// =========================================================
// CREATE TRANSFER
// =========================================================

const create = async (
  req,
  res,
  next
) => {

  try {

    const {
      ingredientId,
      fromLocationId,
      toLocationId,
      quantity,
      reason
    } = req.body;


    const transfer =
      await createTransfer(
        {
          ingredientId,
          fromLocationId,
          toLocationId,
          quantity,
          reason
        },
        req.user.userId
      );


    res.status(201).json({

      success: true,

      message:
        "Stock transfer completed successfully",

      data: transfer

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET ALL TRANSFERS
// =========================================================

const getAll = async (
  req,
  res,
  next
) => {

  try {

    const transfers =
      await getTransfers();


    res.status(200).json({

      success: true,

      data: transfers

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET TRANSFER BY ID
// =========================================================

const getOne = async (
  req,
  res,
  next
) => {

  try {

    const {
      transferId
    } = req.params;


    const transfer =
      await getTransferById(
        transferId
      );


    res.status(200).json({

      success: true,

      data: transfer

    });

  } catch (error) {

    next(error);

  }
};


export {
  create,
  getAll,
  getOne
};