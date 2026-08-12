import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";

import {
  updateStock
} from "../inventory/service.js";

import pool
  from "../../config/database.js";




  const recordConsumption = async ({
  ingredientId,
  quantity,
  reason = null
}, createdBy) => {

  // -----------------------------------------------------
  // Validate ingredient
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

  const consumptionQuantity =
    Number(quantity);


  if (
    !Number.isFinite(consumptionQuantity) ||
    consumptionQuantity <= 0
  ) {

    const error = new Error(
      "Consumption quantity must be greater than zero"
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
          -consumptionQuantity,

        movementType:
          "CONSUMPTION",

        reason:
          reason || "Ingredient consumption",

        referenceType:
          "CONSUMPTION"

      },
      createdBy
    );


  // -----------------------------------------------------
  // Emit consumption event
  // -----------------------------------------------------

  eventBus.emit(
    EVENTS.CONSUMPTION_RECORDED,
    {
      ingredientId,

      ingredientName:
        ingredient.name,

      unit:
        ingredient.unit,

      quantity:
        consumptionQuantity,

      movementId:
        stockUpdate.movementId,

      previousQuantity:
        stockUpdate.previousQuantity,

      newQuantity:
        stockUpdate.newQuantity,

      reason,

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
      consumptionQuantity,

    movementId:
      stockUpdate.movementId,

    previousQuantity:
      stockUpdate.previousQuantity,

    newQuantity:
      stockUpdate.newQuantity
  };
};


export {
  recordConsumption
};