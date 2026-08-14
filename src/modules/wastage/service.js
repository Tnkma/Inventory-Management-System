import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";

import {
  updateStock
} from "../inventory/service.js";

import pool
  from "../../config/database.js";


// =========================================================
// RECORD WASTAGE
// =========================================================

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

  if (
    !reason ||
    !reason.trim()
  ) {

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


// =========================================================
// GET ALL WASTAGE
// =========================================================

const getWastages = async () => {

  const [wastages] =
    await pool.query(
      `
        SELECT

          sm.id,

          sm.ingredient_id,

          i.name AS ingredient,

          i.sku,

          i.unit,


          sm.location_id,

          il.name AS location,

          il.location_type,


          sm.quantity,

          sm.previous_quantity,

          sm.new_quantity,


          sm.reference_type,

          sm.reference_id,


          sm.reason,


          sm.created_by,

          CONCAT(
            u.first_name,
            ' ',
            u.last_name
          ) AS created_by_name,


          sm.created_at

        FROM stock_movements sm

        INNER JOIN ingredients i
          ON sm.ingredient_id = i.id

        INNER JOIN inventory_locations il
          ON sm.location_id = il.id

        LEFT JOIN users u
          ON sm.created_by = u.id

        WHERE sm.movement_type =
          'WASTAGE'

        ORDER BY
          sm.created_at DESC
      `
    );


  return wastages;
};


// =========================================================
// GET WASTAGE BY ID
// =========================================================

const getWastageById = async (
  wastageId
) => {

  const [wastages] =
    await pool.query(
      `
        SELECT

          sm.id,

          sm.ingredient_id,

          i.name AS ingredient,

          i.sku,

          i.unit,


          sm.location_id,

          il.name AS location,

          il.location_type,


          sm.quantity,

          sm.previous_quantity,

          sm.new_quantity,


          sm.reference_type,

          sm.reference_id,


          sm.reason,


          sm.created_by,

          CONCAT(
            u.first_name,
            ' ',
            u.last_name
          ) AS created_by_name,


          sm.created_at

        FROM stock_movements sm

        INNER JOIN ingredients i
          ON sm.ingredient_id = i.id

        INNER JOIN inventory_locations il
          ON sm.location_id = il.id

        LEFT JOIN users u
          ON sm.created_by = u.id

        WHERE sm.id = ?

          AND sm.movement_type =
            'WASTAGE'

        LIMIT 1
      `,
      [wastageId]
    );


  if (wastages.length === 0) {

    const error = new Error(
      "Wastage record not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return wastages[0];
};


export {
  recordWastage,
  getWastages,
  getWastageById
};