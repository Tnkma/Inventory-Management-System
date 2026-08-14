import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../../config/database.js";
import env from "../../config/env.js";
import eventBus from "../../events/eventBus.js";
import { EVENTS } from "../../events/eventTypes.js";


// =========================================================
// REGISTER
// =========================================================

const register = async ({
  firstName,
  lastName,
  email,
  password,
  phone
}) => {

  // =======================================================
  // CHECK WHETHER EMAIL ALREADY EXISTS
  // =======================================================

  const [existingUsers] =
    await pool.query(
      `
        SELECT id

        FROM users

        WHERE email = ?

        LIMIT 1
      `,
      [email]
    );


  if (existingUsers.length > 0) {

    const error =
      new Error(
        "Email is already registered"
      );

    error.statusCode = 409;

    throw error;
  }


  // =======================================================
  // DEFAULT ROLE
  // =======================================================
  //
  // Public registration creates a Kitchen Staff account.
  // Admin/Manager can later change the role from Users.
  //
  // =======================================================

  const [roles] =
    await pool.query(
      `
        SELECT
          id,
          name

        FROM roles

        WHERE name = ?

        LIMIT 1
      `,
      ["KITCHEN_STAFF"]
    );


  if (roles.length === 0) {

    const error =
      new Error(
        "Default user role was not found"
      );

    error.statusCode = 500;

    throw error;
  }


  const roleId =
    roles[0].id;

  const roleName =
    roles[0].name;


  // =======================================================
  // HASH PASSWORD
  // =======================================================

  const hashedPassword =
    await bcrypt.hash(
      password,
      12
    );


  // =======================================================
  // CREATE USER
  // =======================================================

  const [result] =
    await pool.query(
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


  // =======================================================
  // DOMAIN EVENT
  // =======================================================

  eventBus.emit(
    EVENTS.USER_REGISTERED,
    {
      userId:
        result.insertId,

      firstName,

      lastName,

      email,

      roleId,

      role:
        roleName
    }
  );


  // =======================================================
  // RESPONSE
  // =======================================================

  return {

    id:
      result.insertId,

    firstName,

    lastName,

    email,

    phone:
      phone || null,

    roleId,

    role:
      roleName,

    assignedLocationId:
      null,

    assignedLocation:
      null,

    assignedLocationType:
      null
  };
};


// =========================================================
// LOGIN
// =========================================================

const login = async ({
  email,
  password
}) => {

  // =======================================================
  // FIND USER
  // =======================================================

  const [users] =
    await pool.query(
      `
        SELECT

          u.id,

          u.first_name,

          u.last_name,

          u.email,

          u.password,

          u.phone,

          u.is_active,

          u.last_login_at,

          u.assigned_location_id,

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


        WHERE u.email = ?

        LIMIT 1
      `,
      [email]
    );


  // =======================================================
  // USER NOT FOUND
  // =======================================================

  if (users.length === 0) {

    const error =
      new Error(
        "Invalid email or password"
      );

    error.statusCode = 401;

    throw error;
  }


  const user =
    users[0];


  // =======================================================
  // CHECK ACTIVE USER
  // =======================================================

  if (!user.is_active) {

    const error =
      new Error(
        "Your account has been disabled"
      );

    error.statusCode = 403;

    throw error;
  }


  // =======================================================
  // CHECK PASSWORD
  // =======================================================

  const passwordMatches =
    await bcrypt.compare(
      password,
      user.password
    );


  if (!passwordMatches) {

    const error =
      new Error(
        "Invalid email or password"
      );

    error.statusCode = 401;

    throw error;
  }


  // =======================================================
  // UPDATE LAST LOGIN
  // =======================================================

  await pool.query(
    `
      UPDATE users

      SET last_login_at =
        CURRENT_TIMESTAMP

      WHERE id = ?
    `,
    [user.id]
  );


  // =======================================================
  // GENERATE JWT
  // =======================================================

  const token =
    jwt.sign(
      {
        userId:
          user.id,

        roleId:
          user.role_id,

        role:
          user.role,

        email:
          user.email
      },

      env.jwt.secret,

      {
        expiresIn:
          env.jwt.expiresIn
      }
    );


  // =======================================================
  // DOMAIN EVENT
  // =======================================================

  eventBus.emit(
    EVENTS.USER_LOGGED_IN,
    {
      userId:
        user.id,

      email:
        user.email,

      role:
        user.role
    }
  );


  // =======================================================
  // RESPONSE
  // =======================================================

  return {

    token,

    user: {

      id:
        user.id,

      firstName:
        user.first_name,

      lastName:
        user.last_name,

      email:
        user.email,

      phone:
        user.phone,

      roleId:
        user.role_id,

      role:
        user.role,


      // ---------------------------------------------------
      // KITCHEN / LOCATION ASSIGNMENT
      // ---------------------------------------------------

      assignedLocationId:
        user.assigned_location_id,

      assignedLocation:
        user.assigned_location,

      assignedLocationType:
        user.assigned_location_type,

      assignedLocationActive:
        user.assigned_location_active

    }

  };
};


export {
  register,
  login
};