import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../../config/database.js";
import env from "../../config/env.js";
import eventBus from "../../events/eventBus.js";
import { EVENTS } from "../../events/eventTypes.js";


const register = async ({
  firstName,
  lastName,
  email,
  password,
  phone
}) => {

  // 1. Check whether email already exists
  const [existingUsers] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  if (existingUsers.length > 0) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }


  // 2. Get default role
  const [roles] = await pool.query(
    "SELECT id FROM roles WHERE name = ? LIMIT 1",
    ["KITCHEN_STAFF"]
  );

  if (roles.length === 0) {
    const error = new Error("Default user role was not found");
    error.statusCode = 500;
    throw error;
  }

  const roleId = roles[0].id;


  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);


  // 4. Create user
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


  // 5. Emit domain event
  eventBus.emit(EVENTS.USER_REGISTERED, {
    userId: result.insertId,
    firstName,
    lastName,
    email,
    roleId
  });


  return {
    id: result.insertId,
    firstName,
    lastName,
    email,
    roleId
  };
};


const login = async ({ email, password }) => {

  // 1. Find user
  const [users] = await pool.query(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.password,
        u.is_active,
        r.id AS role_id,
        r.name AS role
      FROM users u
      INNER JOIN roles r
        ON u.role_id = r.id
      WHERE u.email = ?
      LIMIT 1
    `,
    [email]
  );


  if (users.length === 0) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }


  const user = users[0];


  // 2. Check active status
  if (!user.is_active) {
    const error = new Error("Your account has been disabled");
    error.statusCode = 403;
    throw error;
  }


  // 3. Compare password
  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );


  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }


  // 4. Update last login
  await pool.query(
    `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [user.id]
  );


  // 5. Generate JWT
  const token = jwt.sign(
    {
      userId: user.id,
      roleId: user.role_id,
      role: user.role,
      email: user.email
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn
    }
  );


  // 6. Emit event
  eventBus.emit(EVENTS.USER_LOGGED_IN, {
    userId: user.id,
    email: user.email,
    role: user.role
  });


  return {
    token,
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role
    }
  };
};


export {
  register,
  login
};