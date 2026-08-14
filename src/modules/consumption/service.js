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
// RECORD CONSUMPTION
// =========================================================

const recordConsumption = async ({
  ingredientId,
  quantity,
  reason = null
}, createdBy) => {

  // -------------------------------------------------------
  // GET USER LOCATION
  // -------------------------------------------------------

  const [users] =
    await pool.query(
      `
        SELECT
          u.id,
          u.role_id,
          u.assigned_location_id,
          r.name AS role,
          l.name AS location_name,
          l.location_type,
          l.is_active AS location_active

        FROM users u

        INNER JOIN roles r
          ON u.role_id = r.id

        LEFT JOIN inventory_locations l
          ON u.assigned_location_id = l.id

        WHERE u.id = ?

        LIMIT 1
      `,
      [createdBy]
    );


  if (users.length === 0) {

    const error = new Error(
      "User not found"
    );

    error.statusCode = 404;

    throw error;
  }


  const user =
    users[0];


  // -------------------------------------------------------
  // USER MUST HAVE A LOCATION
  // -------------------------------------------------------

  if (!user.assigned_location_id) {

    const error = new Error(
      "User is not assigned to an inventory location"
    );

    error.statusCode = 400;

    throw error;
  }


  // -------------------------------------------------------
  // LOCATION MUST BE ACTIVE
  // -------------------------------------------------------

  if (!user.location_active) {

    const error = new Error(
      "Assigned inventory location is inactive"
    );

    error.statusCode = 400;

    throw error;
  }


  const locationId =
    user.assigned_location_id;


  // -------------------------------------------------------
  // KITCHEN STAFF MUST BE ASSIGNED TO A KITCHEN
  // -------------------------------------------------------

  if (
    user.role === "KITCHEN_STAFF" &&
    user.location_type !== "KITCHEN"
  ) {

    const error = new Error(
      "Kitchen staff must be assigned to a kitchen"
    );

    error.statusCode = 400;

    throw error;
  }


  // -------------------------------------------------------
  // VALIDATE INGREDIENT
  // -------------------------------------------------------

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


  // -------------------------------------------------------
  // VALIDATE QUANTITY
  // -------------------------------------------------------

  const consumptionQuantity =
    Number(quantity);


  if (
    !Number.isFinite(
      consumptionQuantity
    ) ||
    consumptionQuantity <= 0
  ) {

    const error = new Error(
      "Consumption quantity must be greater than zero"
    );

    error.statusCode = 400;

    throw error;
  }


  // -------------------------------------------------------
  // UPDATE STOCK
  // -------------------------------------------------------

  const stockUpdate =
    await updateStock(
      {
        ingredientId,

        locationId,

        quantity:
          -consumptionQuantity,

        movementType:
          "CONSUMPTION",

        reason:
          reason?.trim() ||
          "Ingredient consumption",

        referenceType:
          "CONSUMPTION"
      },

      createdBy
    );


  // -------------------------------------------------------
  // EMIT EVENT
  // -------------------------------------------------------

  eventBus.emit(
    EVENTS.CONSUMPTION_RECORDED,
    {
      ingredientId,

      ingredientName:
        ingredient.name,

      unit:
        ingredient.unit,

      locationId,

      locationName:
        user.location_name,

      quantity:
        consumptionQuantity,

      movementId:
        stockUpdate.movementId,

      previousQuantity:
        stockUpdate.previousQuantity,

      newQuantity:
        stockUpdate.newQuantity,

      reason:
        reason?.trim() ||
        "Ingredient consumption",

      createdBy
    }
  );


  // -------------------------------------------------------
  // RETURN RESULT
  // -------------------------------------------------------

  return {

    ingredientId,

    ingredientName:
      ingredient.name,

    unit:
      ingredient.unit,

    locationId,

    locationName:
      user.location_name,

    quantity:
      consumptionQuantity,

    movementId:
      stockUpdate.movementId,

    previousQuantity:
      stockUpdate.previousQuantity,

    newQuantity:
      stockUpdate.newQuantity,

    reason:
      reason?.trim() ||
      "Ingredient consumption"

  };
};




// =========================================================
// GET ALL CONSUMPTION
// =========================================================

const getConsumptions = async () => {

  const [consumptions] =
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

        WHERE sm.movement_type = 'CONSUMPTION'

        ORDER BY sm.created_at DESC
      `
    );


  return consumptions;
};


// =========================================================
// GET CONSUMPTION BY ID
// =========================================================

const getConsumptionById = async (
  consumptionId
) => {

  const [consumptions] =
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
            'CONSUMPTION'

        LIMIT 1
      `,
      [consumptionId]
    );


  if (consumptions.length === 0) {

    const error = new Error(
      "Consumption record not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return consumptions[0];
};


export {
  recordConsumption,
  getConsumptions,
  getConsumptionById
};