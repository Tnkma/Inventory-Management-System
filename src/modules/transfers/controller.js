import {
  createTransfer,
  approveTransfer,
  rejectTransfer,
  fulfillTransfer,
  getTransfers,
  getTransferById
} from "./service.js";


// =========================================================
// CREATE TRANSFER REQUEST
// =========================================================

const create = async (
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


    const transfer =
      await createTransfer(
        {
          ingredientId,
          quantity,
          reason
        },
        req.user.userId
      );


    res.status(201).json({

      success: true,

      message:
        "Stock request created successfully",

      data: transfer

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// APPROVE
// =========================================================

const approve = async (
  req,
  res,
  next
) => {

  try {

    const {
      transferId
    } = req.params;


    const transfer =
      await approveTransfer(
        transferId,
        req.user.userId
      );


    res.status(200).json({

      success: true,

      message:
        "Stock request approved successfully",

      data: transfer

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// REJECT
// =========================================================

const reject = async (
  req,
  res,
  next
) => {

  try {

    const {
      transferId
    } = req.params;

    const {
      rejectionReason
    } = req.body;


    const transfer =
      await rejectTransfer(
        transferId,
        req.user.userId,
        rejectionReason
      );


    res.status(200).json({

      success: true,

      message:
        "Stock request rejected successfully",

      data: transfer

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// FULFILL
// =========================================================

const fulfill = async (
  req,
  res,
  next
) => {

  try {

    const {
      transferId
    } = req.params;


    const transfer =
      await fulfillTransfer(
        transferId,
        req.user.userId
      );


    res.status(200).json({

      success: true,

      message:
        "Stock transfer fulfilled successfully",

      data: transfer

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET ALL
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
// GET ONE
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
  approve,
  reject,
  fulfill,
  getAll,
  getOne
};