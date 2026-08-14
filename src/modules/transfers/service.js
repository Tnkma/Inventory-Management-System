import pool from "../../config/database.js";

import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";


// =========================================================
// HELPERS
// =========================================================

// ---------------------------------------------------------
// Get logged-in user's information
// ---------------------------------------------------------

const getUser = async (
  connection,
  userId
) => {

  const [users] =
    await connection.query(
      `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.assigned_location_id,
          r.name AS role

        FROM users u

        INNER JOIN roles r
          ON u.role_id = r.id

        WHERE u.id = ?
          AND u.is_active = TRUE

        LIMIT 1
      `,
      [userId]
    );


  if (users.length === 0) {

    const error = new Error(
      "User not found or inactive"
    );

    error.statusCode = 401;

    throw error;
  }


  return users[0];
};


// ---------------------------------------------------------
// Get main store
// ---------------------------------------------------------

const getMainStore = async (
  connection
) => {

  const [locations] =
    await connection.query(
      `
        SELECT
          id,
          name,
          location_type,
          is_active

        FROM inventory_locations

        WHERE location_type = 'MAIN_STORE'
          AND is_active = TRUE

        ORDER BY id ASC
      `
    );


  if (locations.length === 0) {

    const error = new Error(
      "Main store location has not been configured"
    );

    error.statusCode = 400;

    throw error;
  }


  if (locations.length > 1) {

    const error = new Error(
      "Multiple active main store locations found"
    );

    error.statusCode = 500;

    throw error;
  }


  return locations[0];
};


// ---------------------------------------------------------
// Get kitchen assigned to user
// ---------------------------------------------------------

const getAssignedKitchen = async (
  connection,
  userId
) => {

  const user =
    await getUser(
      connection,
      userId
    );


  if (
    user.role !== "KITCHEN_STAFF"
  ) {

    const error = new Error(
      "Only kitchen staff can create stock requests"
    );

    error.statusCode = 403;

    throw error;
  }


  if (!user.assigned_location_id) {

    const error = new Error(
      "Kitchen staff is not assigned to a kitchen"
    );

    error.statusCode = 400;

    throw error;
  }


  const [locations] =
    await connection.query(
      `
        SELECT
          id,
          name,
          location_type,
          is_active

        FROM inventory_locations

        WHERE id = ?
          AND location_type = 'KITCHEN'
          AND is_active = TRUE

        LIMIT 1
      `,
      [user.assigned_location_id]
    );


  if (locations.length === 0) {

    const error = new Error(
      "Assigned kitchen is invalid or inactive"
    );

    error.statusCode = 400;

    throw error;
  }


  return {
    user,
    kitchen: locations[0]
  };
};


// =========================================================
// CREATE TRANSFER REQUEST
// =========================================================

const createTransfer = async ({
  ingredientId,
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
    // Get kitchen staff + assigned kitchen
    // -----------------------------------------------------

    const {
      user,
      kitchen
    } =
      await getAssignedKitchen(
        connection,
        createdBy
      );


    // -----------------------------------------------------
    // Get main store
    // -----------------------------------------------------

    const mainStore =
      await getMainStore(
        connection
      );


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
    // Lock main store inventory
    //
    // We check available stock here so we do not allow
    // requests for stock that does not exist.
    //
    // IMPORTANT:
    // We do NOT reserve anything yet.
    // Reservation happens on approval.
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
          mainStore.id
        ]
      );


    if (sourceInventory.length === 0) {

      const error = new Error(
        "Ingredient is not currently stocked in the main store"
      );

      error.statusCode = 404;

      throw error;
    }


    const source =
      sourceInventory[0];


    const currentQuantity =
      Number(
        source.current_quantity
      );


    const reservedQuantity =
      Number(
        source.reserved_quantity
      );


    const availableQuantity =
      currentQuantity -
      reservedQuantity;


    if (
      transferQuantity >
      availableQuantity
    ) {

      const error = new Error(
        `Insufficient available stock. ` +
        `Available: ${availableQuantity} ${ingredient.unit}`
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Create request
    // -----------------------------------------------------

    const [result] =
      await connection.query(
        `
          INSERT INTO stock_transfers
          (
            ingredient_id,

            from_location_id,
            to_location_id,

            quantity,

            reason,

            requested_by,
            requested_at,

            status
          )

          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'REQUESTED')
        `,
        [
          ingredientId,

          mainStore.id,
          kitchen.id,

          transferQuantity,

          reason,

          createdBy
        ]
      );


    const transferId =
      result.insertId;


    await connection.commit();


    // -----------------------------------------------------
    // Future notification system
    // -----------------------------------------------------

    if (
      EVENTS.TRANSFER_REQUESTED
    ) {

      eventBus.emit(
        EVENTS.TRANSFER_REQUESTED,
        {
          transferId,

          ingredientId,

          ingredientName:
            ingredient.name,

          unit:
            ingredient.unit,

          fromLocationId:
            mainStore.id,

          fromLocationName:
            mainStore.name,

          toLocationId:
            kitchen.id,

          toLocationName:
            kitchen.name,

          quantity:
            transferQuantity,

          reason,

          requestedBy:
            user.id,

          requestedByName:
            `${user.first_name} ${user.last_name}`
        }
      );

    }


    return await getTransferById(
      transferId
    );


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// APPROVE TRANSFER
// =========================================================

const approveTransfer = async (
  transferId,
  approvedBy
) => {

  const connection =
    await pool.getConnection();


  try {

    await connection.beginTransaction();


    // -----------------------------------------------------
    // Get transfer and lock it
    // -----------------------------------------------------

    const [transfers] =
      await connection.query(
        `
          SELECT
            *

          FROM stock_transfers

          WHERE id = ?

          FOR UPDATE
        `,
        [transferId]
      );


    if (transfers.length === 0) {

      const error = new Error(
        "Transfer request not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const transfer =
      transfers[0];


    // -----------------------------------------------------
    // Verify approver
    // -----------------------------------------------------

    const approver =
      await getUser(
        connection,
        approvedBy
      );


    if (
      approver.role !== "ADMIN" &&
      approver.role !== "MANAGER"
    ) {

      const error = new Error(
        "Only admin or manager can approve transfer requests"
      );

      error.statusCode = 403;

      throw error;
    }


    // -----------------------------------------------------
    // Verify status
    // -----------------------------------------------------

    if (
      transfer.status !== "REQUESTED"
    ) {

      const error = new Error(
        `Transfer cannot be approved because it is already ${transfer.status}`
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
          transfer.ingredient_id,
          transfer.from_location_id
        ]
      );


    if (sourceInventory.length === 0) {

      const error = new Error(
        "Source inventory record not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const source =
      sourceInventory[0];


    const currentQuantity =
      Number(
        source.current_quantity
      );


    const reservedQuantity =
      Number(
        source.reserved_quantity
      );


    const availableQuantity =
      currentQuantity -
      reservedQuantity;


    const requestedQuantity =
      Number(
        transfer.quantity
      );


    // -----------------------------------------------------
    // Check available stock
    // -----------------------------------------------------

    if (
      requestedQuantity >
      availableQuantity
    ) {

      const error = new Error(
        "Insufficient available stock to approve this request"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Reserve stock
    // -----------------------------------------------------

    const newReservedQuantity =
      reservedQuantity +
      requestedQuantity;


    await connection.query(
      `
        UPDATE inventory

        SET
          reserved_quantity = ?,
          last_stock_update = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      [
        newReservedQuantity,

        source.id
      ]
    );


    // -----------------------------------------------------
    // Approve transfer
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE stock_transfers

        SET
          status = 'APPROVED',

          approved_by = ?,

          approved_at = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      [
        approvedBy,
        transferId
      ]
    );


    await connection.commit();


    // -----------------------------------------------------
    // Event for future notifications
    // -----------------------------------------------------

    if (
      EVENTS.TRANSFER_APPROVED
    ) {

      eventBus.emit(
        EVENTS.TRANSFER_APPROVED,
        {
          transferId,

          approvedBy,

          ingredientId:
            transfer.ingredient_id,

          fromLocationId:
            transfer.from_location_id,

          toLocationId:
            transfer.to_location_id,

          quantity:
            requestedQuantity
        }
      );

    }


    return await getTransferById(
      transferId
    );


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// REJECT TRANSFER
// =========================================================

const rejectTransfer = async (
  transferId,
  rejectedBy,
  rejectionReason
) => {

  const connection =
    await pool.getConnection();


  try {

    await connection.beginTransaction();


    // -----------------------------------------------------
    // Lock transfer
    // -----------------------------------------------------

    const [transfers] =
      await connection.query(
        `
          SELECT
            *

          FROM stock_transfers

          WHERE id = ?

          FOR UPDATE
        `,
        [transferId]
      );


    if (transfers.length === 0) {

      const error = new Error(
        "Transfer request not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const transfer =
      transfers[0];


    // -----------------------------------------------------
    // Verify rejector
    // -----------------------------------------------------

    const rejector =
      await getUser(
        connection,
        rejectedBy
      );


    if (
      rejector.role !== "ADMIN" &&
      rejector.role !== "MANAGER"
    ) {

      const error = new Error(
        "Only admin or manager can reject transfer requests"
      );

      error.statusCode = 403;

      throw error;
    }


    // -----------------------------------------------------
    // Verify status
    // -----------------------------------------------------

    if (
      transfer.status !== "REQUESTED"
    ) {

      const error = new Error(
        `Transfer cannot be rejected because it is already ${transfer.status}`
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Reject request
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE stock_transfers

        SET
          status = 'REJECTED',

          rejected_by = ?,

          rejected_at = CURRENT_TIMESTAMP,

          rejection_reason = ?

        WHERE id = ?
      `,
      [
        rejectedBy,

        rejectionReason,

        transferId
      ]
    );


    await connection.commit();


    // -----------------------------------------------------
    // Event for future notifications
    // -----------------------------------------------------

    if (
      EVENTS.TRANSFER_REJECTED
    ) {

      eventBus.emit(
        EVENTS.TRANSFER_REJECTED,
        {
          transferId,

          rejectedBy,

          rejectionReason
        }
      );

    }


    return await getTransferById(
      transferId
    );


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// FULFILL TRANSFER
// =========================================================

const fulfillTransfer = async (
  transferId,
  fulfilledBy
) => {

  const connection =
    await pool.getConnection();


  try {

    await connection.beginTransaction();


    // -----------------------------------------------------
    // Lock transfer
    // -----------------------------------------------------

    const [transfers] =
      await connection.query(
        `
          SELECT
            *

          FROM stock_transfers

          WHERE id = ?

          FOR UPDATE
        `,
        [transferId]
      );


    if (transfers.length === 0) {

      const error = new Error(
        "Transfer request not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const transfer =
      transfers[0];


    // -----------------------------------------------------
    // Verify store keeper
    // -----------------------------------------------------

    const fulfiller =
      await getUser(
        connection,
        fulfilledBy
      );


    if (
      fulfiller.role !== "STORE_KEEPER"
    ) {

      const error = new Error(
        "Only store keeper can fulfill transfer requests"
      );

      error.statusCode = 403;

      throw error;
    }


    // -----------------------------------------------------
    // Verify transfer status
    // -----------------------------------------------------

    if (
      transfer.status !== "APPROVED"
    ) {

      const error = new Error(
        `Transfer cannot be fulfilled because it is ${transfer.status}`
      );

      error.statusCode = 400;

      throw error;
    }


    const quantity =
      Number(
        transfer.quantity
      );


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
          transfer.ingredient_id,
          transfer.from_location_id
        ]
      );


    if (sourceInventory.length === 0) {

      const error = new Error(
        "Source inventory record not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const source =
      sourceInventory[0];


    const sourceCurrent =
      Number(
        source.current_quantity
      );


    const sourceReserved =
      Number(
        source.reserved_quantity
      );


    // -----------------------------------------------------
    // Safety checks
    // -----------------------------------------------------

    if (
      sourceReserved <
      quantity
    ) {

      const error = new Error(
        "Reserved stock is insufficient for this transfer"
      );

      error.statusCode = 400;

      throw error;
    }


    if (
      sourceCurrent <
      quantity
    ) {

      const error = new Error(
        "Current stock is insufficient to fulfill this transfer"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Destination inventory
    //
    // Kitchen inventory may not exist yet.
    // Create it if necessary.
    // -----------------------------------------------------

    await connection.query(
      `
        INSERT IGNORE INTO inventory
        (
          ingredient_id,
          location_id,
          current_quantity,
          reserved_quantity
        )

        VALUES (?, ?, 0, 0)
      `,
      [
        transfer.ingredient_id,
        transfer.to_location_id
      ]
    );


    // -----------------------------------------------------
    // Lock destination
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
          transfer.ingredient_id,
          transfer.to_location_id
        ]
      );


    if (
      destinationInventory.length === 0
    ) {

      const error = new Error(
        "Destination inventory record could not be created"
      );

      error.statusCode = 500;

      throw error;
    }


    const destination =
      destinationInventory[0];


    const destinationCurrent =
      Number(
        destination.current_quantity
      );


    // -----------------------------------------------------
    // Calculate new quantities
    // -----------------------------------------------------

    const newSourceCurrent =
      sourceCurrent -
      quantity;


    const newSourceReserved =
      sourceReserved -
      quantity;


    const newDestinationCurrent =
      destinationCurrent +
      quantity;


    // -----------------------------------------------------
    // Update source
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE inventory

        SET
          current_quantity = ?,

          reserved_quantity = ?,

          last_stock_update = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      [
        newSourceCurrent,

        newSourceReserved,

        source.id
      ]
    );


    // -----------------------------------------------------
    // Update destination
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
        newDestinationCurrent,

        destination.id
      ]
    );


    // -----------------------------------------------------
    // SOURCE STOCK MOVEMENT
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

          VALUES (
            ?,
            ?,
            'TRANSFER',
            ?,
            ?,
            ?,
            'TRANSFER',
            ?,
            ?,
            ?
          )
        `,
        [
          transfer.ingredient_id,

          transfer.from_location_id,

          -quantity,

          sourceCurrent,

          newSourceCurrent,

          transferId,

          transfer.reason,

          fulfilledBy
        ]
      );


    // -----------------------------------------------------
    // DESTINATION STOCK MOVEMENT
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

          VALUES (
            ?,
            ?,
            'TRANSFER',
            ?,
            ?,
            ?,
            'TRANSFER',
            ?,
            ?,
            ?
          )
        `,
        [
          transfer.ingredient_id,

          transfer.to_location_id,

          quantity,

          destinationCurrent,

          newDestinationCurrent,

          transferId,

          transfer.reason,

          fulfilledBy
        ]
      );


    // -----------------------------------------------------
    // Mark fulfilled
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE stock_transfers

        SET
          status = 'FULFILLED',

          fulfilled_by = ?,

          fulfilled_at = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      [
        fulfilledBy,

        transferId
      ]
    );


    await connection.commit();


    // -----------------------------------------------------
    // Event for future notifications
    // -----------------------------------------------------

    if (
      EVENTS.TRANSFER_COMPLETED
    ) {

      eventBus.emit(
        EVENTS.TRANSFER_COMPLETED,
        {
          transferId,

          ingredientId:
            transfer.ingredient_id,

          fromLocationId:
            transfer.from_location_id,

          toLocationId:
            transfer.to_location_id,

          quantity,

          fulfilledBy,

          sourceMovementId:
            sourceMovement.insertId,

          destinationMovementId:
            destinationMovement.insertId
        }
      );

    }


    return await getTransferById(
      transferId
    );


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// GET ALL TRANSFERS
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


          t.status,


          t.requested_by,

          CONCAT(
            requester.first_name,
            ' ',
            requester.last_name
          ) AS requested_by_name,


          t.requested_at,


          t.approved_by,

          CONCAT(
            approver.first_name,
            ' ',
            approver.last_name
          ) AS approved_by_name,


          t.approved_at,


          t.rejected_by,

          CONCAT(
            rejector.first_name,
            ' ',
            rejector.last_name
          ) AS rejected_by_name,


          t.rejected_at,

          t.rejection_reason,


          t.fulfilled_by,

          CONCAT(
            fulfiller.first_name,
            ' ',
            fulfiller.last_name
          ) AS fulfilled_by_name,


          t.fulfilled_at,


          t.created_at,

          t.updated_at


        FROM stock_transfers t


        INNER JOIN ingredients i
          ON t.ingredient_id = i.id


        INNER JOIN inventory_locations fl
          ON t.from_location_id = fl.id


        INNER JOIN inventory_locations tl
          ON t.to_location_id = tl.id


        LEFT JOIN users requester
          ON t.requested_by = requester.id


        LEFT JOIN users approver
          ON t.approved_by = approver.id


        LEFT JOIN users rejector
          ON t.rejected_by = rejector.id


        LEFT JOIN users fulfiller
          ON t.fulfilled_by = fulfiller.id


        ORDER BY
          t.created_at DESC,
          t.id DESC
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

          fl.location_type AS from_location_type,


          t.to_location_id,

          tl.name AS to_location,

          tl.location_type AS to_location_type,


          t.quantity,

          t.reason,


          t.status,


          -- REQUEST
          t.requested_by,

          CONCAT(
            requester.first_name,
            ' ',
            requester.last_name
          ) AS requested_by_name,

          requester.email AS requested_by_email,

          t.requested_at,


          -- APPROVAL
          t.approved_by,

          CONCAT(
            approver.first_name,
            ' ',
            approver.last_name
          ) AS approved_by_name,

          t.approved_at,


          -- REJECTION
          t.rejected_by,

          CONCAT(
            rejector.first_name,
            ' ',
            rejector.last_name
          ) AS rejected_by_name,

          t.rejected_at,

          t.rejection_reason,


          -- FULFILLMENT
          t.fulfilled_by,

          CONCAT(
            fulfiller.first_name,
            ' ',
            fulfiller.last_name
          ) AS fulfilled_by_name,

          t.fulfilled_at,


          t.created_at,

          t.updated_at


        FROM stock_transfers t


        INNER JOIN ingredients i
          ON t.ingredient_id = i.id


        INNER JOIN inventory_locations fl
          ON t.from_location_id = fl.id


        INNER JOIN inventory_locations tl
          ON t.to_location_id = tl.id


        LEFT JOIN users requester
          ON t.requested_by = requester.id


        LEFT JOIN users approver
          ON t.approved_by = approver.id


        LEFT JOIN users rejector
          ON t.rejected_by = rejector.id


        LEFT JOIN users fulfiller
          ON t.fulfilled_by = fulfiller.id


        WHERE t.id = ?

        LIMIT 1
      `,
      [transferId]
    );


  if (
    transfers.length === 0
  ) {

    const error = new Error(
      "Transfer not found"
    );

    error.statusCode = 404;

    throw error;
  }


  const transfer =
    transfers[0];


  // -------------------------------------------------------
  // Get physical stock movements belonging to transfer
  // -------------------------------------------------------

  const [movements] =
    await pool.query(
      `
        SELECT

          sm.id,

          sm.location_id,

          il.name AS location,

          sm.quantity,

          sm.previous_quantity,

          sm.new_quantity,

          sm.reason,

          sm.created_by,

          CONCAT(
            u.first_name,
            ' ',
            u.last_name
          ) AS created_by_name,

          sm.created_at

        FROM stock_movements sm

        INNER JOIN inventory_locations il
          ON sm.location_id = il.id

        LEFT JOIN users u
          ON sm.created_by = u.id

        WHERE sm.reference_type = 'TRANSFER'

          AND sm.reference_id = ?

        ORDER BY
          sm.created_at ASC,
          sm.id ASC
      `,
      [transferId]
    );


  return {
    ...transfer,

    movements
  };
};


export {
  createTransfer,

  approveTransfer,

  rejectTransfer,

  fulfillTransfer,

  getTransfers,

  getTransferById
};