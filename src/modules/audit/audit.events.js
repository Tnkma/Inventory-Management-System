import eventBus from "../../events/eventBus.js";
import pool from "../../config/database.js";
import { EVENTS } from "../../events/eventTypes.js";


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