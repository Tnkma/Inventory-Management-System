import pool from "../../config/database.js";

import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";


// =========================================================
// CREATE TRANSFER
// =========================================================

const createTransfer = async ({
  ingredientId,
  fromLocationId,
  toLocationId,
  quantity,
  reason = null
}, createdBy) => {

  const connection =
    await pool.getConnection();

  try {

    await connection.beginTransaction();


    const transferQuantity =
      Number(quantity);


    // -----------------------------------------------------
    // Validate quantity
    // -----------------------------------------------------

    if (
      !Number.isFinite(transferQuantity) ||
      transferQuantity <= 0
    ) {

      const error = new Error(
        "Transfer quantity must be greater than zero"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Prevent same-location transfer
    // -----------------------------------------------------

    if (
      Number(fromLocationId) ===
      Number(toLocationId)
    ) {

      const error = new Error(
        "Source and destination locations must be different"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Check ingredient
    // -----------------------------------------------------

    const [ingredients] =
      await connection.query(
        `
          SELECT
            id,
            name,
            unit

          FROM ingredients

          WHERE id = ?
            AND is_active = TRUE

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


    // -----------------------------------------------------
    // Check locations
    // -----------------------------------------------------

    const [locations] =
      await connection.query(
        `
          SELECT
            id,
            name

          FROM inventory_locations

          WHERE id IN (?, ?)
            AND is_active = TRUE
        `,
        [
          fromLocationId,
          toLocationId
        ]
      );


    if (locations.length !== 2) {

      const error = new Error(
        "One or both inventory locations are invalid"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Lock source inventory
    // -----------------------------------------------------

    const [sourceInventory] =
      await connection.query(
        `
          SELECT
            id,
            current_quantity,
            reserved_quantity

          FROM inventory

          WHERE ingredient_id = ?
            AND location_id = ?

          FOR UPDATE
        `,
        [
          ingredientId,
          fromLocationId
        ]
      );


    if (sourceInventory.length === 0) {

      const error = new Error(
        "Source inventory record not found"
      );

      error.statusCode = 404;

      throw error;
    }


    // -----------------------------------------------------
    // Lock destination inventory
    // -----------------------------------------------------

    const [destinationInventory] =
      await connection.query(
        `
          SELECT
            id,
            current_quantity,
            reserved_quantity

          FROM inventory

          WHERE ingredient_id = ?
            AND location_id = ?

          FOR UPDATE
        `,
        [
          ingredientId,
          toLocationId
        ]
      );


    if (destinationInventory.length === 0) {

      const error = new Error(
        "Destination inventory record not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const source =
      sourceInventory[0];

    const destination =
      destinationInventory[0];


    const sourceQuantity =
      Number(source.current_quantity);

    const sourceReserved =
      Number(source.reserved_quantity);


    const sourceAvailable =
      sourceQuantity - sourceReserved;


    // -----------------------------------------------------
    // Check available stock
    // -----------------------------------------------------

    if (
      transferQuantity >
      sourceAvailable
    ) {

      const error = new Error(
        `Insufficient available stock. ` +
        `Available: ${sourceAvailable} ${ingredient.unit}`
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Calculate new quantities
    // -----------------------------------------------------

    const newSourceQuantity =
      sourceQuantity - transferQuantity;

    const destinationQuantity =
      Number(destination.current_quantity);

    const newDestinationQuantity =
      destinationQuantity + transferQuantity;


    // -----------------------------------------------------
    // Create transfer record
    // -----------------------------------------------------

    const [transferResult] =
      await connection.query(
        `
          INSERT INTO stock_transfers
          (
            ingredient_id,
            from_location_id,
            to_location_id,
            quantity,
            reason,
            created_by
          )

          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          ingredientId,
          fromLocationId,
          toLocationId,
          transferQuantity,
          reason,
          createdBy
        ]
      );


    const transferId =
      transferResult.insertId;


    // -----------------------------------------------------
    // Update source inventory
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE inventory

        SET
          current_quantity = ?,
          last_stock_update = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      [
        newSourceQuantity,
        source.id
      ]
    );


    // -----------------------------------------------------
    // Update destination inventory
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE inventory

        SET
          current_quantity = ?,
          last_stock_update = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      [
        newDestinationQuantity,
        destination.id
      ]
    );


    // -----------------------------------------------------
    // Source stock movement
    // -----------------------------------------------------

    const [sourceMovement] =
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

          VALUES (?, ?, 'TRANSFER', ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          ingredientId,
          fromLocationId,
          -transferQuantity,
          sourceQuantity,
          newSourceQuantity,
          "TRANSFER",
          transferId,
          reason,
          createdBy
        ]
      );


    // -----------------------------------------------------
    // Destination stock movement
    // -----------------------------------------------------

    const [destinationMovement] =
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

          VALUES (?, ?, 'TRANSFER', ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          ingredientId,
          toLocationId,
          transferQuantity,
          destinationQuantity,
          newDestinationQuantity,
          "TRANSFER",
          transferId,
          reason,
          createdBy
        ]
      );


    await connection.commit();


    // -----------------------------------------------------
    // Emit event AFTER successful transaction
    // -----------------------------------------------------

    eventBus.emit(
      EVENTS.TRANSFER_COMPLETED,
      {
        transferId,

        ingredientId,

        ingredientName:
          ingredient.name,

        fromLocationId,

        toLocationId,

        quantity:
          transferQuantity,

        sourcePreviousQuantity:
          sourceQuantity,

        sourceNewQuantity:
          newSourceQuantity,

        destinationPreviousQuantity:
          destinationQuantity,

        destinationNewQuantity:
          newDestinationQuantity,

        sourceMovementId:
          sourceMovement.insertId,

        destinationMovementId:
          destinationMovement.insertId,

        createdBy
      }
    );


    return {

      transferId,

      ingredientId,

      ingredientName:
        ingredient.name,

      fromLocationId,

      toLocationId,

      quantity:
        transferQuantity,

      sourcePreviousQuantity:
        sourceQuantity,

      sourceNewQuantity:
        newSourceQuantity,

      destinationPreviousQuantity:
        destinationQuantity,

      destinationNewQuantity:
        newDestinationQuantity
    };


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// GET TRANSFERS
// =========================================================

const getTransfers = async () => {

  const [transfers] =
    await pool.query(
      `
        SELECT

          t.id,

          t.ingredient_id,
          i.name AS ingredient,
          i.unit,

          t.from_location_id,
          fl.name AS from_location,

          t.to_location_id,
          tl.name AS to_location,

          t.quantity,

          t.reason,

          t.created_by,

          CONCAT(
            u.first_name,
            ' ',
            u.last_name
          ) AS created_by_name,

          t.created_at

        FROM stock_transfers t

        INNER JOIN ingredients i
          ON t.ingredient_id = i.id

        INNER JOIN inventory_locations fl
          ON t.from_location_id = fl.id

        INNER JOIN inventory_locations tl
          ON t.to_location_id = tl.id

        LEFT JOIN users u
          ON t.created_by = u.id

        ORDER BY t.created_at DESC
      `
    );


  return transfers;
};


// =========================================================
// GET TRANSFER BY ID
// =========================================================

const getTransferById = async (
  transferId
) => {

  const [transfers] =
    await pool.query(
      `
        SELECT

          t.id,

          t.ingredient_id,
          i.name AS ingredient,
          i.unit,

          t.from_location_id,
          fl.name AS from_location,

          t.to_location_id,
          tl.name AS to_location,

          t.quantity,

          t.reason,

          t.created_by,

          CONCAT(
            u.first_name,
            ' ',
            u.last_name
          ) AS created_by_name,

          t.created_at

        FROM stock_transfers t

        INNER JOIN ingredients i
          ON t.ingredient_id = i.id

        INNER JOIN inventory_locations fl
          ON t.from_location_id = fl.id

        INNER JOIN inventory_locations tl
          ON t.to_location_id = tl.id

        LEFT JOIN users u
          ON t.created_by = u.id

        WHERE t.id = ?

        LIMIT 1
      `,
      [transferId]
    );


  if (transfers.length === 0) {

    const error = new Error(
      "Transfer not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return transfers[0];
};


export {
  createTransfer,
  getTransfers,
  getTransferById
};