import bcrypt from "bcryptjs";

import pool from "../config/database.js";


const createAdmin = async () => {

  try {

    const [roles] = await pool.query(
      "SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1"
    );


    if (roles.length === 0) {
      throw new Error(
        "ADMIN role does not exist"
      );
    }


    const adminRoleId = roles[0].id;


    const password = process.env.ADMIN_PASSWORD;

    const hashedPassword =
      await bcrypt.hash(password, 12);


    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [process.env.ADMIN_EMAIL]
    );


    if (existing.length > 0) {

      console.log(
        "Admin account already exists"
      );

      return;
    }


    await pool.query(
      `
        INSERT INTO users
        (
          role_id,
          first_name,
          last_name,
          email,
          password
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        adminRoleId,
        "System",
        "Administrator",
        process.env.ADMIN_EMAIL,
        hashedPassword
      ]
    );


    console.log(
      "Admin account created successfully"
    );

  } catch (error) {

    console.error(
      "Failed to create admin:",
      error.message
    );

  } finally {

    await pool.end();

  }
};


createAdmin();