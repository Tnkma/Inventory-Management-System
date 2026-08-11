import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";

import {
  updateStock
} from "../inventory/service.js";

import pool
  from "../../config/database.js";


const recordWastage = async ({
  ingredientId,
  quantity,
  reason
}, createdBy) => {

  // -----------------------------------------------------
  // Check ingredient
  // -----------------------------------------------------

  const [ingredients] =
    await pool.query(
      `
        SELECT
          id,
          name,
          unit,
          is_active

        FROM ingredients

        WHERE id = ?

        LIMIT 1
      `,
      [ingredientId]
    );


  if (ingredients.length === 0) {

    const error = new Error(
      "Ingredient not found"
    );

    error.statusCode = 404;

    throw error;
  }


  const ingredient =
    ingredients[0];


  if (!ingredient.is_active) {

    const error = new Error(
      "Ingredient is inactive"
    );

    error.statusCode = 400;

    throw error;
  }


  // -----------------------------------------------------
  // Validate quantity
  // -----------------------------------------------------

  const wastageQuantity =
    Number(quantity);


  if (
    !Number.isFinite(wastageQuantity) ||
    wastageQuantity <= 0
  ) {

    const error = new Error(
      "Wastage quantity must be greater than zero"
    );

    error.statusCode = 400;

    throw error;
  }


  // -----------------------------------------------------
  // Validate reason
  // -----------------------------------------------------

  if (!reason || !reason.trim()) {

    const error = new Error(
      "Wastage reason is required"
    );

    error.statusCode = 400;

    throw error;
  }


  // -----------------------------------------------------
  // Update inventory
  // -----------------------------------------------------

  const stockUpdate =
    await updateStock(
      {
        ingredientId,

        quantity:
          -wastageQuantity,

        movementType:
          "WASTAGE",

        reason:
          reason.trim(),

        referenceType:
          "WASTAGE"
      },

      createdBy
    );


  // -----------------------------------------------------
  // Emit event
  // -----------------------------------------------------

  eventBus.emit(
    EVENTS.WASTAGE_RECORDED,
    {
      ingredientId,

      ingredientName:
        ingredient.name,

      unit:
        ingredient.unit,

      quantity:
        wastageQuantity,

      movementId:
        stockUpdate.movementId,

      previousQuantity:
        stockUpdate.previousQuantity,

      newQuantity:
        stockUpdate.newQuantity,

      reason:
        reason.trim(),

      createdBy
    }
  );


  return {

    ingredientId,

    ingredientName:
      ingredient.name,

    unit:
      ingredient.unit,

    quantity:
      wastageQuantity,

    movementId:
      stockUpdate.movementId,

    previousQuantity:
      stockUpdate.previousQuantity,

    newQuantity:
      stockUpdate.newQuantity,

    reason:
      reason.trim()

  };
};


export {
  recordWastage
};