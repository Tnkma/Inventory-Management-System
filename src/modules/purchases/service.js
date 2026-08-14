import pool from "../../config/database.js";

import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";



// =========================================================
// CREATE PURCHASE
// =========================================================

const createPurchase = async ({
  supplierId,
  items,
  notes = null
}, userId) => {

  const connection =
    await pool.getConnection();


  try {

    await connection.beginTransaction();


    // -----------------------------------------------------
    // Check supplier
    // -----------------------------------------------------

    const [suppliers] =
      await connection.query(
        `
          SELECT id
          FROM suppliers
          WHERE id = ?
            AND is_active = TRUE
          LIMIT 1
        `,
        [supplierId]
      );


    if (suppliers.length === 0) {

      const error = new Error(
        "Supplier not found"
      );

      error.statusCode = 404;

      throw error;
    }


    // -----------------------------------------------------
    // Validate purchase items
    // -----------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      const error = new Error(
        "Purchase must contain at least one item"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Create purchase
    // -----------------------------------------------------

    const [purchaseResult] =
      await connection.query(
        `
          INSERT INTO purchases
          (
            supplier_id,
            user_id,
            status,
            notes
          )

          VALUES (?, ?, 'PENDING', ?)
        `,
        [
          supplierId,
          userId,
          notes
        ]
      );


    const purchaseId =
      purchaseResult.insertId;


    // -----------------------------------------------------
    // Add purchase items
    // -----------------------------------------------------

    let totalAmount = 0;


    for (const item of items) {

      const {
        ingredientId,
        quantity,
        unitPrice
      } = item;


      if (
        !ingredientId ||
        quantity <= 0 ||
        unitPrice < 0
      ) {

        const error = new Error(
          "Invalid purchase item"
        );

        error.statusCode = 400;

        throw error;
      }


      // Check ingredient
      const [ingredients] =
        await connection.query(
          `
            SELECT id
            FROM ingredients
            WHERE id = ?
              AND is_active = TRUE
            LIMIT 1
          `,
          [ingredientId]
        );


      if (ingredients.length === 0) {

        const error = new Error(
          `Ingredient ${ingredientId} not found`
        );

        error.statusCode = 404;

        throw error;
      }


      const itemTotal =
        Number(quantity) *
        Number(unitPrice);


      totalAmount += itemTotal;


      await connection.query(
        `
          INSERT INTO purchase_items
          (
            purchase_id,
            ingredient_id,
            quantity,
            unit_price
          )

          VALUES (?, ?, ?, ?)
        `,
        [
          purchaseId,
          ingredientId,
          quantity,
          unitPrice
        ]
      );
    }


    // -----------------------------------------------------
    // Update purchase total
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE purchases

        SET total_amount = ?

        WHERE id = ?
      `,
      [
        totalAmount,
        purchaseId
      ]
    );


    await connection.commit();


    // -----------------------------------------------------
    // Emit event
    // -----------------------------------------------------

    eventBus.emit(
      EVENTS.PURCHASE_CREATED,
      {
        purchaseId,
        supplierId,
        userId,
        totalAmount
      }
    );


    return {
      purchaseId,
      supplierId,
      userId,
      status: "PENDING",
      totalAmount
    };


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};



// =========================================================
// GET ALL PURCHASES
// =========================================================

const getPurchases = async () => {

  const [purchases] = await pool.query(
    `
      SELECT

        p.id,
        p.supplier_id,
        s.name AS supplier,

        p.user_id,
        CONCAT(
          u.first_name,
          ' ',
          u.last_name
        ) AS created_by,

        p.purchase_date,
        p.status,
        p.total_amount,
        p.notes,

        p.created_at,
        p.updated_at

      FROM purchases p

      INNER JOIN suppliers s
        ON p.supplier_id = s.id

      INNER JOIN users u
        ON p.user_id = u.id

      ORDER BY p.created_at DESC
    `
  );


  return purchases;
};


  // =========================================================
  // GET PURCHASE BY ID
  // =========================================================

  const getPurchaseById = async (
    purchaseId
  ) => {

    const [purchases] = await pool.query(
      `
        SELECT

          p.id,

          p.supplier_id,
          s.name AS supplier,


          -- =================================================
          -- SUBMITTED BY
          -- =================================================

          p.user_id,

          CONCAT(
            u.first_name,
            ' ',
            u.last_name
          ) AS created_by,


          -- =================================================
          -- PURCHASE
          -- =================================================

          p.purchase_date,

          p.status,

          p.total_amount,

          p.notes,


          -- =================================================
          -- APPROVAL
          -- =================================================

          p.approved_by,

          CONCAT(
            approver.first_name,
            ' ',
            approver.last_name
          ) AS approved_by_name,

          p.approved_at,


          -- =================================================
          -- RECORD DATES
          -- =================================================

          p.created_at,

          p.updated_at


        FROM purchases p


        INNER JOIN suppliers s
          ON p.supplier_id = s.id


        INNER JOIN users u
          ON p.user_id = u.id


        LEFT JOIN users approver
          ON p.approved_by = approver.id


        WHERE p.id = ?

        LIMIT 1
      `,
      [purchaseId]
    );


    if (purchases.length === 0) {

      const error = new Error(
        "Purchase not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const purchase = purchases[0];


    // -------------------------------------------------------
    // Get purchase items
    // -------------------------------------------------------

    const [items] = await pool.query(
      `
        SELECT

          pi.id,

          pi.ingredient_id,

          i.name AS ingredient,

          i.sku,

          i.unit,

          pi.quantity,

          pi.unit_price,

          pi.total_price,

          pi.created_at

        FROM purchase_items pi

        INNER JOIN ingredients i
          ON pi.ingredient_id = i.id

        WHERE pi.purchase_id = ?

        ORDER BY pi.id ASC
      `,
      [purchaseId]
    );


    purchase.items = items;


    return purchase;
  };


// =========================================================
// COMPLETE PURCHASE
// =========================================================

const completePurchase = async (
  purchaseId,
  completedBy
) => {

  const connection =
    await pool.getConnection();

  let purchase;
  let items = [];
  let stockUpdates = [];


  try {

    await connection.beginTransaction();


    // =====================================================
    // GET AND LOCK PURCHASE
    // =====================================================

    const [purchases] =
      await connection.query(
        `
          SELECT
            id,
            supplier_id,
            user_id,
            status,
            total_amount,
            notes

          FROM purchases

          WHERE id = ?

          LIMIT 1

          FOR UPDATE
        `,
        [purchaseId]
      );


    if (purchases.length === 0) {

      const error = new Error(
        "Purchase not found"
      );

      error.statusCode = 404;

      throw error;
    }


    purchase = purchases[0];


    // =====================================================
    // PURCHASE MUST BE PENDING
    // =====================================================

    if (purchase.status !== "PENDING") {

      const error = new Error(
        `Purchase cannot be completed because its ` +
        `status is ${purchase.status}`
      );

      error.statusCode = 400;

      throw error;
    }


    // =====================================================
    // FIND MAIN STORE
    // =====================================================

    const [locations] =
      await connection.query(
        `
          SELECT
            id,
            name

          FROM inventory_locations

          WHERE location_type = 'MAIN_STORE'
            AND is_active = TRUE

          LIMIT 1
        `
      );


    if (locations.length === 0) {

      const error = new Error(
        "Main Store inventory location not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const mainStore =
      locations[0];


    const mainStoreId =
      mainStore.id;


    // =====================================================
    // GET PURCHASE ITEMS
    // =====================================================

    const [purchaseItems] =
      await connection.query(
        `
          SELECT

            pi.id,
            pi.ingredient_id,
            pi.quantity,
            pi.unit_price,
            pi.total_price

          FROM purchase_items pi

          WHERE pi.purchase_id = ?

          ORDER BY pi.id ASC
        `,
        [purchaseId]
      );


    if (purchaseItems.length === 0) {

      const error = new Error(
        "Cannot complete purchase without items"
      );

      error.statusCode = 400;

      throw error;
    }


    items = purchaseItems;


    // =====================================================
    // RECEIVE EACH ITEM INTO MAIN STORE
    // =====================================================

    for (const item of items) {

      const ingredientId =
        item.ingredient_id;

      const quantity =
        Number(item.quantity);


      if (
        !ingredientId ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {

        const error = new Error(
          "Invalid purchase item quantity"
        );

        error.statusCode = 400;

        throw error;
      }


      // ---------------------------------------------------
      // Check whether inventory record exists
      // ---------------------------------------------------

      const [inventoryRows] =
        await connection.query(
          `
            SELECT
              id,
              current_quantity,
              reserved_quantity

            FROM inventory

            WHERE ingredient_id = ?
              AND location_id = ?

            LIMIT 1

            FOR UPDATE
          `,
          [
            ingredientId,
            mainStoreId
          ]
        );


      let previousQuantity = 0;
      let inventoryId;


      // ---------------------------------------------------
      // Create inventory record if necessary
      // ---------------------------------------------------

      if (inventoryRows.length === 0) {

        const [insertResult] =
          await connection.query(
            `
              INSERT INTO inventory
              (
                ingredient_id,
                location_id,
                current_quantity,
                reserved_quantity,
                last_stock_update
              )

              VALUES (
                ?,
                ?,
                0,
                0,
                CURRENT_TIMESTAMP
              )
            `,
            [
              ingredientId,
              mainStoreId
            ]
          );


        inventoryId =
          insertResult.insertId;

        previousQuantity = 0;

      } else {

        inventoryId =
          inventoryRows[0].id;

        previousQuantity =
          Number(
            inventoryRows[0].current_quantity
          );
      }


      // ---------------------------------------------------
      // Calculate new quantity
      // ---------------------------------------------------

      const newQuantity =
        previousQuantity + quantity;


      // ---------------------------------------------------
      // Update inventory
      // ---------------------------------------------------

      await connection.query(
        `
          UPDATE inventory

          SET
            current_quantity = ?,
            last_stock_update = CURRENT_TIMESTAMP

          WHERE id = ?
        `,
        [
          newQuantity,
          inventoryId
        ]
      );


      // ---------------------------------------------------
      // Record stock movement
      // ---------------------------------------------------

      const [movementResult] =
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
              'PURCHASE',
              ?,
              ?,
              ?,
              'PURCHASE',
              ?,
              ?,
              ?
            )
          `,
          [
            ingredientId,
            mainStoreId,
            quantity,
            previousQuantity,
            newQuantity,
            purchaseId,
            `Purchase #${purchaseId}`,
            completedBy
          ]
        );


      // ---------------------------------------------------
      // Store result for response/event
      // ---------------------------------------------------

      stockUpdates.push({

        ingredientId,

        locationId:
          mainStoreId,

        location:
          mainStore.name,

        movementId:
          movementResult.insertId,

        movementType:
          "PURCHASE",

        quantity,

        previousQuantity,

        newQuantity

      });

    }


    // =====================================================
    // MARK PURCHASE AS COMPLETED
    // =====================================================

    await connection.query(
      `
        UPDATE purchases

        SET
          status = 'COMPLETED',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      [completedBy, purchaseId]
    );


    // =====================================================
    // COMMIT EVERYTHING
    // =====================================================

    await connection.commit();


    // =====================================================
    // EMIT EVENT AFTER SUCCESSFUL COMMIT
    // =====================================================

    eventBus.emit(
      EVENTS.PURCHASE_COMPLETED,
      {
        purchaseId,

        supplierId:
          purchase.supplier_id,

        completedBy,

        totalAmount:
          Number(purchase.total_amount),

        locationId:
          mainStoreId,

        location:
          mainStore.name,

        items:
          stockUpdates
      }
    );


    // =====================================================
    // RETURN
    // =====================================================

    return {

      purchaseId,

      supplierId:
        purchase.supplier_id,

      status:
        "COMPLETED",

      totalAmount:
        Number(purchase.total_amount),

      completedBy,

      locationId:
        mainStoreId,

      location:
        mainStore.name,

      stockUpdates

    };


  } catch (error) {

    // -----------------------------------------------------
    // IMPORTANT:
    // If anything fails, purchase + inventory +
    // stock movements are all rolled back.
    // -----------------------------------------------------

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};

// =========================================================
// CANCEL PURCHASE
// =========================================================

const cancelPurchase = async (
  purchaseId,
  cancelledBy,
  reason = null
) => {

  const connection =
    await pool.getConnection();

  try {

    await connection.beginTransaction();


    // -----------------------------------------------------
    // Get purchase and lock it
    // -----------------------------------------------------

    const [purchases] =
      await connection.query(
        `
          SELECT
            id,
            supplier_id,
            user_id,
            status,
            total_amount,
            notes

          FROM purchases

          WHERE id = ?

          LIMIT 1

          FOR UPDATE
        `,
        [purchaseId]
      );


    if (purchases.length === 0) {

      const error = new Error(
        "Purchase not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const purchase =
      purchases[0];


    // -----------------------------------------------------
    // Only PENDING purchases can be cancelled
    // -----------------------------------------------------

    if (purchase.status !== "PENDING") {

      const error = new Error(
        `Purchase cannot be cancelled because ` +
        `its status is ${purchase.status}`
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Update purchase
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE purchases

        SET
          status = 'CANCELLED',
          notes = CASE
            WHEN ? IS NULL OR ? = ''
            THEN notes
            ELSE CONCAT(
              COALESCE(notes, ''),
              '\nCancellation reason: ',
              ?
            )
          END

        WHERE id = ?
      `,
      [
        reason,
        reason,
        reason,
        purchaseId
      ]
    );


    await connection.commit();


    // -----------------------------------------------------
    // Emit event AFTER successful transaction
    // -----------------------------------------------------

    eventBus.emit(
      EVENTS.PURCHASE_CANCELLED,
      {
        purchaseId,
        supplierId:
          purchase.supplier_id,
        cancelledBy,
        reason
      }
    );


    return {
      purchaseId,
      supplierId:
        purchase.supplier_id,
      status: "CANCELLED",
      cancelledBy,
      reason
    };


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


export {
  createPurchase,
  getPurchases,
  getPurchaseById,
  completePurchase,
  cancelPurchase
};