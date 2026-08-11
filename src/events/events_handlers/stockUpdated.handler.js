import eventBus from "../eventBus.js";

import { EVENTS }
  from "../eventTypes.js";

import {
  checkLowStock
} from "../../modules/inventory/service.js";

import {
  createNotification
} from "../../modules/notifications/service.js";

import pool
  from "../../config/database.js";


// =========================================================
// STOCK UPDATED HANDLER
// =========================================================

const handleStockUpdated = async (payload) => {

  try {

    console.log(
      "STOCK_UPDATED event received:",
      payload
    );


    const {
      ingredientId,
      movementId,
      movementType,
      quantity,
      previousQuantity,
      newQuantity,
      createdBy
    } = payload;



    // Check current stock status


    const stockStatus =
      await checkLowStock(
        ingredientId
      );


    console.log(
      "Stock status:",
      stockStatus
    );


    // Determine whether stock crossed into low stock
    const reorderLevel =
      Number(stockStatus.reorderLevel);

    const previous =
      Number(previousQuantity);

    const current =
      Number(stockStatus.availableQuantity);


    const crossedIntoLowStock =
      previous > reorderLevel &&
      current <= reorderLevel;


    // Stock did not cross into low-stock state

    if (!crossedIntoLowStock) {

      console.log(
        `Ingredient ${ingredientId} did not cross ` +
        `into low-stock state`
      );

      return;
    }



    // detect low stock
    console.log(
      `LOW STOCK: ${stockStatus.ingredientName}`
    );


    console.log(
      `Available: ${current} ${stockStatus.unit}`
    );


    console.log(
      `Reorder level: ` +
      `${reorderLevel} ${stockStatus.unit}`
    );


    // send notification 

    const [users] = await pool.query(
      `
        SELECT
          u.id

        FROM users u

        INNER JOIN roles r
          ON u.role_id = r.id

        WHERE r.name IN ('ADMIN', 'MANAGER')
          AND u.is_active = TRUE
      `
    );


   // notification will be created for each user

    for (const user of users) {

      await createNotification({

        userId: user.id,

        type: "LOW_STOCK",

        title:
          `Low Stock: ${stockStatus.ingredientName}`,

        message:
          `${stockStatus.ingredientName} is low in stock. ` +
          `Available quantity: ${current} ` +
          `${stockStatus.unit}. ` +
          `Reorder level: ${reorderLevel} ` +
          `${stockStatus.unit}.`
      });
    }


    console.log(
      `Low-stock notifications created for ` +
      `${users.length} users`
    );


  } catch (error) {

    console.error(
      "Error handling STOCK_UPDATED event:",
      error
    );

  }
};


// register event listner

eventBus.on(
  EVENTS.STOCK_UPDATED,
  handleStockUpdated
);


export default handleStockUpdated;