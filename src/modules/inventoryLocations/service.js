import pool from "../../config/database.js";

import eventBus from "../../events/eventBus.js";

import { EVENTS } from "../../events/eventTypes.js";


// =========================================================
// CREATE LOCATION
// =========================================================

const createLocation = async ({
  name,
  description = null
}, createdBy) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // Check duplicate location
    const [existing] = await connection.query(
      `
        SELECT id
        FROM inventory_locations
        WHERE name = ?
        LIMIT 1
      `,
      [name]
    );


    if (existing.length > 0) {

      const error = new Error(
        "Inventory location already exists"
      );

      error.statusCode = 409;

      throw error;
    }


    // Create location
    const [result] = await connection.query(
      `
        INSERT INTO inventory_locations
        (
          name,
          description
        )
        VALUES (?, ?)
      `,
      [
        name,
        description
      ]
    );


    const locationId = result.insertId;


    await connection.commit();


    const location =
      await getLocationById(locationId);


    // Emit AFTER successful transaction
    eventBus.emit(
      EVENTS.INVENTORY_LOCATION_CREATED,
      {
        locationId,
        locationName: location.name,
        createdBy
      }
    );


    return location;


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// GET ALL LOCATIONS
// =========================================================

const getLocations = async () => {

  const [locations] = await pool.query(
    `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at

      FROM inventory_locations

      ORDER BY name ASC
    `
  );


  return locations;
};


// =========================================================
// GET LOCATION BY ID
// =========================================================

const getLocationById = async (
  locationId
) => {

  const [locations] = await pool.query(
    `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at

      FROM inventory_locations

      WHERE id = ?

      LIMIT 1
    `,
    [locationId]
  );


  if (locations.length === 0) {

    const error = new Error(
      "Inventory location not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return locations[0];
};


// =========================================================
// UPDATE LOCATION
// =========================================================

const updateLocation = async (
  locationId,
  {
    name,
    description
  },
  updatedBy
) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    const [existing] = await connection.query(
      `
        SELECT id
        FROM inventory_locations
        WHERE id = ?
        LIMIT 1
      `,
      [locationId]
    );


    if (existing.length === 0) {

      const error = new Error(
        "Inventory location not found"
      );

      error.statusCode = 404;

      throw error;
    }


    if (name) {

      const [duplicate] = await connection.query(
        `
          SELECT id
          FROM inventory_locations
          WHERE name = ?
            AND id != ?
          LIMIT 1
        `,
        [
          name,
          locationId
        ]
      );


      if (duplicate.length > 0) {

        const error = new Error(
          "Inventory location name already exists"
        );

        error.statusCode = 409;

        throw error;
      }
    }


    await connection.query(
      `
        UPDATE inventory_locations

        SET
          name = COALESCE(?, name),
          description = COALESCE(?, description)

        WHERE id = ?
      `,
      [
        name || null,
        description ?? null,
        locationId
      ]
    );


    await connection.commit();


    const location =
      await getLocationById(locationId);


    eventBus.emit(
      EVENTS.INVENTORY_LOCATION_UPDATED,
      {
        locationId,
        locationName: location.name,
        updatedBy
      }
    );


    return location;


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// TOGGLE LOCATION STATUS
// =========================================================

const toggleLocationStatus = async (
  locationId,
  updatedBy
) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    const [locations] = await connection.query(
      `
        SELECT
          id,
          name,
          is_active

        FROM inventory_locations

        WHERE id = ?

        FOR UPDATE
      `,
      [locationId]
    );


    if (locations.length === 0) {

      const error = new Error(
        "Inventory location not found"
      );

      error.statusCode = 404;

      throw error;
    }


    const location = locations[0];

    const newStatus =
      !Boolean(location.is_active);


    await connection.query(
      `
        UPDATE inventory_locations

        SET is_active = ?

        WHERE id = ?
      `,
      [
        newStatus,
        locationId
      ]
    );


    await connection.commit();


    eventBus.emit(
      EVENTS.INVENTORY_LOCATION_STATUS_CHANGED,
      {
        locationId,
        locationName: location.name,
        isActive: newStatus,
        updatedBy
      }
    );


    return {
      locationId,
      locationName: location.name,
      isActive: newStatus
    };


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


export {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  toggleLocationStatus
};