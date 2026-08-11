import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  completePurchase,
  cancelPurchase
} from "./service.js";


// =========================================================
// CREATE PURCHASE
// =========================================================

const createPurchaseController = async (
  req,
  res,
  next
) => {

  try {

    const {
      supplierId,
      items,
      notes
    } = req.body;


    const purchase =
      await createPurchase(
        {
          supplierId,
          items,
          notes
        },
        req.user.userId
      );


    return res.status(201).json({

      success: true,

      message:
        "Purchase created successfully",

      data: purchase

    });


  } catch (error) {

    next(error);

  }
};



// =========================================================
// GET ALL PURCHASES
// =========================================================

const getAllPurchasesController = async (
  req,
  res,
  next
) => {

  try {

    const purchases =
      await getPurchases();


    return res.status(200).json({

      success: true,

      data: purchases

    });

  } catch (error) {

    next(error);

  }
};



// =========================================================
// GET PURCHASE BY ID
// =========================================================

const getPurchaseController = async (
  req,
  res,
  next
) => {

  try {

    const {
      purchaseId
    } = req.params;


    const purchase =
      await getPurchaseById(
        purchaseId
      );


    return res.status(200).json({

      success: true,

      data: purchase

    });

  } catch (error) {

    next(error);

  }
};



// =========================================================
// COMPLETE PURCHASE
// =========================================================

const completePurchaseController = async (
  req,
  res,
  next
) => {

  try {

    const {
      purchaseId
    } = req.params;


    const purchase =
      await completePurchase(
        purchaseId,
        req.user.userId
      );


    return res.status(200).json({

      success: true,

      message:
        "Purchase completed successfully",

      data: purchase

    });


  } catch (error) {

    next(error);

  }
};



// =========================================================
// CANCEL PURCHASE
// =========================================================

const cancelPurchaseController = async (
  req,
  res,
  next
) => {

  try {

    const {
      purchaseId
    } = req.params;


    const {
      reason
    } = req.body;


    const purchase =
      await cancelPurchase(
        purchaseId,
        req.user.userId,
        reason
      );


    return res.status(200).json({

      success: true,

      message:
        "Purchase cancelled successfully",

      data: purchase

    });


  } catch (error) {

    next(error);

  }
};

export {
  createPurchaseController,
  getAllPurchasesController,
  getPurchaseController,
  completePurchaseController,
  cancelPurchaseController
};