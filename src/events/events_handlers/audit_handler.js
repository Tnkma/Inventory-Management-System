import eventBus from "../eventBus.js";

import { EVENTS }
  from "../eventTypes.js";

import pool
  from "../../config/database.js";




// USER REGISTERED
eventBus.on(
  EVENTS.USER_REGISTERED,
  async (data) => {

    try {

      await pool.query(
        `
          INSERT INTO audit_logs
          (
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            metadata
          )

          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          data.userId,
          "USER_REGISTERED",
          "user",
          data.userId,
          `User ${data.email} registered`,
          JSON.stringify({
            email: data.email,
            roleId: data.roleId
          })
        ]
      );


      console.log(
        `[AUDIT] User registered: ${data.email}`
      );

    } catch (error) {

      console.error(
        "[AUDIT] Failed to save registration log:",
        error.message
      );

    }

  }
);



// USER LOGGED IN
eventBus.on(
  EVENTS.USER_LOGGED_IN,
  async (data) => {

    try {

      await pool.query(
        `
          INSERT INTO audit_logs
          (
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            metadata
          )

          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          data.userId,
          "USER_LOGGED_IN",
          "user",
          data.userId,
          `User ${data.email} logged in`,
          JSON.stringify({
            email: data.email,
            role: data.role
          })
        ]
      );


      console.log(
        `[AUDIT] User logged in: ${data.email}`
      );

    } catch (error) {

      console.error(
        "[AUDIT] Failed to save login log:",
        error.message
      );

    }

  }
);



// SUPPLIER CREATED
eventBus.on(
  EVENTS.SUPPLIER_CREATED,
  async (data) => {

    try {

      await pool.query(
        `
          INSERT INTO audit_logs
          (
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            metadata
          )

          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          data.createdBy,
          "SUPPLIER_CREATED",
          "supplier",
          data.supplierId,
          `Supplier ${data.supplierName} was created`,
          JSON.stringify(data)
        ]
      );


      console.log(
        `[AUDIT] Supplier created: ${data.supplierName}`
      );

    } catch (error) {

      console.error(
        "[AUDIT] Failed to log supplier creation:",
        error.message
      );

    }

  }
);



// STOCK UPDATED
eventBus.on(
  EVENTS.STOCK_UPDATED,
  async (data) => {

    try {

      await pool.query(
        `
          INSERT INTO audit_logs
          (
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            metadata
          )

          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          data.createdBy,
          "STOCK_UPDATED",
          "stock_movement",
          data.movementId,
          `Stock updated for ingredient ${data.ingredientId}`,
          JSON.stringify({
            ingredientId: data.ingredientId,
            movementId: data.movementId,
            movementType: data.movementType,
            quantity: data.quantity,
            previousQuantity: data.previousQuantity,
            newQuantity: data.newQuantity
          })
        ]
      );


      console.log(
        `[AUDIT] Stock updated: ` +
        `ingredient ${data.ingredientId}`
      );

    } catch (error) {

      console.error(
        "[AUDIT] Failed to save stock update log:",
        error.message
      );

    }

  }
);



// Notification Created

eventBus.on(
  EVENTS.NOTIFICATION_CREATED,
  async (data) => {

    try {

      await pool.query(
        `
          INSERT INTO audit_logs
          (
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            metadata
          )

          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          data.userId,
          "NOTIFICATION_CREATED",
          "notification",
          data.id,
          `Notification created: ${data.title}`,
          JSON.stringify({
            notificationId: data.id,
            type: data.type,
            title: data.title,
            message: data.message
          })
        ]
      );


      console.log(
        `[AUDIT] Notification created: ${data.title}`
      );

    } catch (error) {

      console.error(
        "[AUDIT] Failed to save notification log:",
        error.message
      );

    }

  }
);