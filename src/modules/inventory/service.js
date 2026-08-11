import pool from "../../config/database.js";

import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";


// =========================================================
// GET ALL INVENTORY
// =========================================================

const getInventory = async () => {

  const [inventory] = await pool.query(
    `
      SELECT

        inv.id,

        inv.ingredient_id,
        inv.location_id,

        i.name AS ingredient,
        i.sku,
        i.unit,

        loc.name AS location,

        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,

        inv.current_quantity,
        inv.reserved_quantity,

        (
          inv.current_quantity -
          inv.reserved_quantity
        ) AS available_quantity,

        inv.last_stock_update,

        inv.created_at,
        inv.updated_at

      FROM inventory inv

      INNER JOIN ingredients i
        ON inv.ingredient_id = i.id

      INNER JOIN inventory_locations loc
        ON inv.location_id = loc.id

      WHERE i.is_active = TRUE
        AND loc.is_active = TRUE

      ORDER BY
        i.name ASC,
        loc.name ASC
    `
  );


  return inventory;
};


// =========================================================
// GET INVENTORY BY INGREDIENT + LOCATION
// =========================================================

const getInventoryByIngredient = async (
  ingredientId,
  locationId
) => {

  const [inventory] = await pool.query(
    `
      SELECT

        inv.id,

        inv.ingredient_id,
        inv.location_id,

        i.name AS ingredient,
        i.sku,
        i.unit,

        loc.name AS location,

        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,

        inv.current_quantity,
        inv.reserved_quantity,

        (
          inv.current_quantity -
          inv.reserved_quantity
        ) AS available_quantity,

        inv.last_stock_update,

        inv.created_at,
        inv.updated_at

      FROM inventory inv

      INNER JOIN ingredients i
        ON inv.ingredient_id = i.id

      INNER JOIN inventory_locations loc
        ON inv.location_id = loc.id

      WHERE inv.ingredient_id = ?
        AND inv.location_id = ?

      LIMIT 1
    `,
    [
      ingredientId,
      locationId
    ]
  );


  if (inventory.length === 0) {

    const error = new Error(
      "Inventory record not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return inventory[0];
};


// =========================================================
// UPDATE STOCK
// =========================================================

const updateStock = async ({
  ingredientId,
  locationId,
  quantity,
  movementType,
  reason = null,
  referenceType = null,
  referenceId = null
}, createdBy) => {

  const connection =
    await pool.getConnection();


  try {

    await connection.beginTransaction();


    // -----------------------------------------------------
    // Validate location
    // -----------------------------------------------------

    const [locations] =
      await connection.query(
        `
          SELECT
            id,
            name

          FROM inventory_locations

          WHERE id = ?
            AND is_active = TRUE

          LIMIT 1
        `,
        [locationId]
      );


    if (locations.length === 0) {

      const error = new Error(
        "Inventory location not found"
      );

      error.statusCode = 404;

      throw error;
    }


    // -----------------------------------------------------
    // Get current inventory
    // Lock row for transaction
    // -----------------------------------------------------

    const [inventory] =
      await connection.query(
        `
          SELECT
            current_quantity

          FROM inventory

          WHERE ingredient_id = ?
            AND location_id = ?

          FOR UPDATE
        `,
        [
          ingredientId,
          locationId
        ]
      );


    if (inventory.length === 0) {

      const error = new Error(
        "Inventory record not found for this location"
      );

      error.statusCode = 404;

      throw error;
    }


    const previousQuantity =
      Number(
        inventory[0].current_quantity
      );


    // -----------------------------------------------------
    // Calculate new quantity
    // -----------------------------------------------------

    const stockChange =
      Number(quantity);


    const newQuantity =
      previousQuantity +
      stockChange;


    // -----------------------------------------------------
    // Prevent negative stock
    // -----------------------------------------------------

    if (newQuantity < 0) {

      const error = new Error(
        "Insufficient stock"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Update inventory
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE inventory

        SET
          current_quantity = ?,
          last_stock_update = CURRENT_TIMESTAMP

        WHERE ingredient_id = ?
          AND location_id = ?
      `,
      [
        newQuantity,
        ingredientId,
        locationId
      ]
    );


    // -----------------------------------------------------
    // Record stock movement
    // -----------------------------------------------------

    const [movement] =
      await connection.query(
        `
          INSERT INTO stock_movements
          (
            ingredient_id,
            location_id,
            movement_type,
            quantity,
            previous_quantity,
            new_quantity,
            reference_type,
            reference_id,
            reason,
            created_by
          )

          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          ingredientId,
          locationId,
          movementType,
          quantity,
          previousQuantity,
          newQuantity,
          referenceType,
          referenceId,
          reason,
          createdBy
        ]
      );

    await connection.commit();


    // -----------------------------------------------------
    // Emit event AFTER successful transaction
    // -----------------------------------------------------

    eventBus.emit(
      EVENTS.STOCK_UPDATED,
      {
        ingredientId,
        locationId,

        movementId:
          movement.insertId,

        movementType,

        quantity:
          Number(quantity),

        previousQuantity,

        newQuantity,

        createdBy
      }
    );


    return {

      ingredientId,

      locationId,

      movementId:
        movement.insertId,

      movementType,

      quantity:
        Number(quantity),

      previousQuantity,

      newQuantity

    };


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// GET STOCK MOVEMENT HISTORY
// =========================================================

const getStockMovements = async ({
  ingredientId = null,
  movementType = null
} = {}) => {

  let query = `
    SELECT

      sm.id,
      sm.ingredient_id,

      i.name AS ingredient,
      i.sku,
      i.unit,

      sm.movement_type,
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

    LEFT JOIN users u
      ON sm.created_by = u.id

    WHERE 1 = 1
  `;

  const params = [];


  // Filter by ingredient
  if (ingredientId) {

    query += `
      AND sm.ingredient_id = ?
    `;

    params.push(ingredientId);
  }


  // Filter by movement type
  if (movementType) {

    query += `
      AND sm.movement_type = ?
    `;

    params.push(movementType);
  }


  query += `
    ORDER BY sm.created_at DESC, sm.id DESC
  `;


  const [movements] =
    await pool.query(
      query,
      params
    );


  return movements;
};


// Check if stock is low for an ingredient
const checkLowStock = async (ingredientId) => {

  const [rows] = await pool.query(
    `
      SELECT

        i.id,
        i.name,
        i.unit,

        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,

        inv.current_quantity,
        inv.reserved_quantity,

        (
          inv.current_quantity -
          inv.reserved_quantity
        ) AS available_quantity

      FROM ingredients i

      INNER JOIN inventory inv
        ON i.id = inv.ingredient_id

      WHERE i.id = ?
        AND i.is_active = TRUE

      LIMIT 1
    `,
    [ingredientId]
  );


  if (rows.length === 0) {

    const error = new Error(
      "Ingredient inventory not found"
    );

    error.statusCode = 404;

    throw error;
  }


  const inventory = rows[0];


  const isLowStock =
    Number(inventory.available_quantity)
    <= Number(inventory.reorder_level);


  return {
    ingredientId: inventory.id,
    ingredientName: inventory.name,
    unit: inventory.unit,

    currentQuantity:
      Number(inventory.current_quantity),

    reservedQuantity:
      Number(inventory.reserved_quantity),

    availableQuantity:
      Number(inventory.available_quantity),

    reorderLevel:
      Number(inventory.reorder_level),

    minimumStock:
      Number(inventory.minimum_stock),

    isLowStock
  };
};


export {
    getInventory,
    getInventoryByIngredient,
    updateStock,
    getStockMovements,
    checkLowStock  
};