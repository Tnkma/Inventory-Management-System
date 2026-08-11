import eventBus from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";

import pool
  from "../../config/database.js";



// Create a notification
const createNotification = async ({
  userId,
  type,
  title,
  message
}) => {

  const [result] = await pool.query(
    `
      INSERT INTO notifications
      (
        user_id,
        type,
        title,
        message
      )

      VALUES (?, ?, ?, ?)
    `,
    [
      userId,
      type,
      title,
      message
    ]
  );


  const notification = {

    id: result.insertId,

    userId,

    type,

    title,

    message
  };


  // Emit event AFTER notification is successfully created
  eventBus.emit(
    EVENTS.NOTIFICATION_CREATED,
    notification
  );


  return notification;
};

// get all notifications for a user
const getUserNotifications = async (
  userId
) => {

  const [notifications] = await pool.query(
    `
      SELECT

        id,
        user_id,
        type,
        title,
        message,

        is_read,
        read_at,

        created_at

      FROM notifications

      WHERE user_id = ?

      ORDER BY created_at DESC
    `,
    [userId]
  );


  return notifications;
};


// mark a notification as read

const markNotificationAsRead = async (
  notificationId,
  userId
) => {

  const [result] = await pool.query(
    `
      UPDATE notifications

      SET
        is_read = TRUE,
        read_at = CURRENT_TIMESTAMP

      WHERE id = ?
        AND user_id = ?
        AND is_read = FALSE
    `,
    [
      notificationId,
      userId
    ]
  );


  if (result.affectedRows === 0) {

    const error = new Error(
      "Notification not found or already read"
    );

    error.statusCode = 404;

    throw error;
  }


  return {
    notificationId,
    isRead: true
  };
};


export {
  createNotification,
  getUserNotifications,
  markNotificationAsRead
};