import {
  getInventory,
  getInventoryByIngredient,
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

    const inventory = await getInventory();

    res.status(200).json({
      success: true,
      data: inventory
    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET INVENTORY BY INGREDIENT
// =========================================================

const getInventoryItem = async (req, res, next) => {

  try {

    const { ingredientId } = req.params;

    const inventory =
      await getInventoryByIngredient(
        ingredientId
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

    const { ingredientId } = req.params;

    const {
      quantity,
      movementType,
      reason,
      referenceType,
      referenceId
    } = req.body;


    const result = await updateStock(
      {
        ingredientId,
        quantity,
        movementType,
        reason,
        referenceType,
        referenceId
      },
      req.user.userId,
      // console.log("Authenticated user:", req.user)
    );


    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
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
      movementType
    } = req.query;


    const movements =
      await getStockMovements({
        ingredientId,
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



// check low stock for ingredients
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


export {
  getAllInventory,
  getInventoryItem,
  updateIngredientStock,
  getStockMovementHistory,
  checkIngredientLowStock
};