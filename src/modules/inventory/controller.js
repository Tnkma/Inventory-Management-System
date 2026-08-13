import {
  getInventory,
  getInventoryByIngredient,
  createInventoryRecord,
  updateStock,
  getStockMovements,
  checkLowStock
} from "./service.js";


// =========================================================
// GET ALL INVENTORY
// =========================================================

const getAllInventory = async (req, res, next) => {

  try {

    console.log("getAllInventory called");

    const inventory =
      await getInventory();

    res.status(200).json({
      success: true,
      data: inventory
    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET INVENTORY BY INGREDIENT + LOCATION
// =========================================================

const getInventoryItem = async (
  req,
  res,
  next
) => {

  try {

    const { ingredientId } =
      req.params;

    const { locationId } =
      req.query;


    // -----------------------------------------------------
    // Validate locationId
    // -----------------------------------------------------

    if (!locationId) {

      const error = new Error(
        "locationId is required"
      );

      error.statusCode = 400;

      throw error;
    }


    const inventory =
      await getInventoryByIngredient(
        ingredientId,
        locationId
      );


    res.status(200).json({
      success: true,
      data: inventory
    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// UPDATE STOCK
// =========================================================

const updateIngredientStock = async (
  req,
  res,
  next
) => {

  try {

    const { ingredientId } =
      req.params;


    const {
      locationId,
      quantity,
      movementType,
      reason,
      referenceType,
      referenceId
    } = req.body;


    // -----------------------------------------------------
    // PURCHASE movements must come through purchases
    // -----------------------------------------------------

    if (movementType === "PURCHASE") {

      const error = new Error(
        "Purchase stock must be received through the purchase module"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Update stock
    // -----------------------------------------------------

    const result =
      await updateStock(
        {
          ingredientId,
          locationId,
          quantity,
          movementType,
          reason,
          referenceType,
          referenceId
        },

        req.user.userId
      );


    res.status(200).json({

      success: true,

      message:
        "Stock updated successfully",

      data: result

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET STOCK MOVEMENT HISTORY
// =========================================================

const getStockMovementHistory = async (
  req,
  res,
  next
) => {

  try {

    const {
      ingredientId,
      locationId,
      movementType
    } = req.query;


    const movements =
      await getStockMovements({
        ingredientId,
        locationId,
        movementType
      });


    res.status(200).json({
      success: true,
      data: movements
    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// CHECK LOW STOCK
// =========================================================

const checkIngredientLowStock = async (
  req,
  res,
  next
) => {

  try {

    const { ingredientId } =
      req.params;


    const result =
      await checkLowStock(
        ingredientId
      );


    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {

    next(error);

  }
};

// =========================================================
// CREATE INVENTORY RECORD
// =========================================================

const createInventory = async (
  req,
  res,
  next
) => {

  try {

    const {
      ingredientId,
      locationId
    } = req.body;


    if (!ingredientId) {

      const error = new Error(
        "ingredientId is required"
      );

      error.statusCode = 400;

      throw error;
    }


    if (!locationId) {

      const error = new Error(
        "locationId is required"
      );

      error.statusCode = 400;

      throw error;
    }


    const inventory =
      await createInventoryRecord({
        ingredientId,
        locationId
      });


    res.status(201).json({

      success: true,

      message:
        "Inventory record created successfully",

      data: inventory

    });

  } catch (error) {

    next(error);

  }
};


export {
  getAllInventory,
  getInventoryItem,
  updateIngredientStock,
  getStockMovementHistory,
  checkIngredientLowStock,
  createInventory
};