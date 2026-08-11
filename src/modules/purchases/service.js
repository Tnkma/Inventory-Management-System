import pool from "../../config/database.js";

import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";

import {
  updateStock
} from "../inventory/service.js";


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


  // -----------------------------------------------------
  // Get purchase items
  // -----------------------------------------------------

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
  let items;


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


    purchase = purchases[0];


    // -----------------------------------------------------
    // Make sure purchase is still PENDING
    // -----------------------------------------------------

    if (purchase.status !== "PENDING") {

      const error = new Error(
        `Purchase cannot be completed because its ` +
        `status is ${purchase.status}`
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Get purchase items
    // -----------------------------------------------------

    const [purchaseItems] =
      await connection.query(
        `
          SELECT

            id,
            ingredient_id,
            quantity,
            unit_price,
            total_price

          FROM purchase_items

          WHERE purchase_id = ?

          ORDER BY id ASC
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


    // -----------------------------------------------------
    // Mark purchase as COMPLETED
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE purchases

        SET
          status = 'COMPLETED'

        WHERE id = ?
      `,
      [purchaseId]
    );


    await connection.commit();


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }


  // =====================================================
  // Update inventory AFTER purchase transaction commits
  // =====================================================

  const stockUpdates = [];


  try {

    for (const item of items) {

      const stockUpdate =
        await updateStock(
          {
            ingredientId:
              item.ingredient_id,

            quantity:
              Number(item.quantity),

            movementType:
              "PURCHASE",

            reason:
              `Purchase #${purchaseId}`,

            referenceType:
              "PURCHASE",

            referenceId:
              purchaseId

          },
          completedBy
        );


      stockUpdates.push(
        stockUpdate
      );
    }


    // ---------------------------------------------------
    // Emit purchase completed event
    // ---------------------------------------------------

    eventBus.emit(
      EVENTS.PURCHASE_COMPLETED,
      {
        purchaseId,
        supplierId: purchase.supplier_id,
        completedBy,
        totalAmount:
          Number(purchase.total_amount),
        items: stockUpdates
      }
    );


    return {
      purchaseId,
      supplierId:
        purchase.supplier_id,
      status: "COMPLETED",
      totalAmount:
        Number(purchase.total_amount),
      completedBy,
      stockUpdates
    };


  } catch (error) {

    /*
      IMPORTANT:

      At this point the purchase is already COMPLETED.

      If stock updating fails, we must not silently
      pretend everything succeeded.

      For now we surface the error so it can be handled
      and logged properly.
    */

    throw error;
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