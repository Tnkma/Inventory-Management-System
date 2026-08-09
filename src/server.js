import app from "./app.js";
import env from "./config/env.js";
import pool from "./config/database.js";

const startServer = async () => {
  try {
    const connection = await pool.getConnection();

    console.log("MySQL database connected successfully");

    connection.release();

    app.listen(env.port, () => {
      console.log(
        `Restaurant Inventory API running on port ${env.port}`
      );
    });
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);

    process.exit(1);
  }
};

startServer();