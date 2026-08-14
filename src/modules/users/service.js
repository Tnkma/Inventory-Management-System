import bcrypt from "bcryptjs";

import pool from "../../config/database.js";
import eventBus from "../../events/eventBus.js";
import { EVENTS } from "../../events/eventTypes.js";


const getUsers = async () => {

  const [users] = await pool.query(`
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.is_active,
      u.last_login_at,
      u.assigned_location_id,
      u.created_at,

      r.id AS role_id,
      r.name AS role,

      l.name AS assigned_location,
      l.location_type AS assigned_location_type,
      l.is_active AS assigned_location_active

    FROM users u

    INNER JOIN roles r
      ON u.role_id = r.id

    LEFT JOIN inventory_locations l
      ON u.assigned_location_id = l.id

    ORDER BY u.created_at DESC
  `);

  return users;
};


const getUserById = async (userId) => {

  const [users] = await pool.query(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        r.id AS role_id,
        r.name AS role
      FROM users u
      INNER JOIN roles r
        ON u.role_id = r.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId]
  );


  if (users.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }


  return users[0];
};


const createUser = async ({
  firstName,
  lastName,
  email,
  password,
  phone,
  role
}, createdBy) => {

  // Check email
  const [existingUsers] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email]
  );


  if (existingUsers.length > 0) {
    const error = new Error(
      "Email is already registered"
    );

    error.statusCode = 409;
    throw error;
  }


  // Find role
  const [roles] = await pool.query(
    "SELECT id, name FROM roles WHERE name = ? LIMIT 1",
    [role]
  );


  if (roles.length === 0) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }


  const roleId = roles[0].id;


  // Hash password
  const hashedPassword =
    await bcrypt.hash(password, 12);


  // Create user
  const [result] = await pool.query(
    `
      INSERT INTO users
      (
        role_id,
        first_name,
        last_name,
        email,
        password,
        phone
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      roleId,
      firstName,
      lastName,
      email,
      hashedPassword,
      phone || null
    ]
  );


  eventBus.emit(EVENTS.USER_REGISTERED, {
    userId: result.insertId,
    firstName,
    lastName,
    email,
    roleId,
    createdBy
  });


  return getUserById(result.insertId);
};


const updateUserRole = async (
  userId,
  role,
  updatedBy
) => {

  const [roles] = await pool.query(
    "SELECT id, name FROM roles WHERE name = ? LIMIT 1",
    [role]
  );


  if (roles.length === 0) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }


  const roleId = roles[0].id;


  const [result] = await pool.query(
    `
      UPDATE users
      SET role_id = ?
      WHERE id = ?
    `,
    [roleId, userId]
  );


  if (result.affectedRows === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }


  eventBus.emit(EVENTS.USER_ROLE_UPDATED, {
    userId,
    roleId,
    role,
    updatedBy
  });


  return getUserById(userId);
};


const updateUserStatus = async (
  userId,
  isActive,
  updatedBy
) => {

  const [result] = await pool.query(
    `
      UPDATE users
      SET is_active = ?
      WHERE id = ?
    `,
    [isActive, userId]
  );


  if (result.affectedRows === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }


  eventBus.emit(EVENTS.USER_STATUS_UPDATED, {
    userId,
    isActive,
    updatedBy
  });


  return getUserById(userId);
};


// Update user assignment to inventory location
const updateUserAssignment = async (
  userId,
  assignedLocationId,
  updatedBy
) => {

  // -------------------------------------------------------
  // Get user
  // -------------------------------------------------------

  const user =
    await getUserById(userId);


  // -------------------------------------------------------
  // If removing assignment
  // -------------------------------------------------------

  if (
    assignedLocationId === null ||
    assignedLocationId === undefined ||
    assignedLocationId === ""
  ) {

    await pool.query(
      `
        UPDATE users

        SET assigned_location_id = NULL

        WHERE id = ?
      `,
      [userId]
    );


    eventBus.emit(
      EVENTS.USER_LOCATION_UPDATED,
      {
        userId,
        assignedLocationId: null,
        updatedBy
      }
    );


    return getUserById(userId);
  }


  // -------------------------------------------------------
  // Verify location
  // -------------------------------------------------------

  const [locations] =
    await pool.query(
      `
        SELECT
          id,
          name,
          location_type,
          is_active

        FROM inventory_locations

        WHERE id = ?

        LIMIT 1
      `,
      [assignedLocationId]
    );


  if (locations.length === 0) {

    const error = new Error(
      "Inventory location not found"
    );

    error.statusCode = 404;

    throw error;
  }


  const location =
    locations[0];


  // -------------------------------------------------------
  // Only kitchens can be assigned to kitchen staff
  // -------------------------------------------------------

  if (
    user.role === "KITCHEN_STAFF" &&
    location.location_type !== "KITCHEN"
  ) {

    const error = new Error(
      "Kitchen staff can only be assigned to a kitchen"
    );

    error.statusCode = 400;

    throw error;
  }


  // -------------------------------------------------------
  // Assignment
  // -------------------------------------------------------

  await pool.query(
    `
      UPDATE users

      SET assigned_location_id = ?

      WHERE id = ?
    `,
    [
      assignedLocationId,
      userId
    ]
  );


  eventBus.emit(
    EVENTS.USER_LOCATION_UPDATED,
    {
      userId,

      assignedLocationId,

      locationName:
        location.name,

      updatedBy
    }
  );


  return getUserById(userId);
};


export {
  getUsers,
  getUserById,
  createUser,
  updateUserRole,
  updateUserStatus,
  updateUserAssignment
};