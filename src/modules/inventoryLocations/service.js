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


// Get stock information for a specific location
const getLocationStock = async (locationId) => {

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


  const [items] = await pool.query(
    `
      SELECT

        inv.id AS inventory_id,

        inv.ingredient_id,

        i.name AS ingredient,
        i.sku,
        i.unit,

        i.category_id,
        c.name AS category,

        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,

        inv.current_quantity,
        inv.reserved_quantity,

        (
          inv.current_quantity -
          inv.reserved_quantity
        ) AS available_quantity,

        inv.last_stock_update,

        inv.created_at,
        inv.updated_at

      FROM inventory inv

      INNER JOIN ingredients i
        ON inv.ingredient_id = i.id

      INNER JOIN inventory_categories c
        ON i.category_id = c.id

      WHERE inv.location_id = ?
        AND i.is_active = TRUE

      ORDER BY i.name ASC
    `,
    [locationId]
  );


  return {
    location: locations[0],
    items
  };
};


// =========================================================
// GET LOCATION STOCK MOVEMENTS
// =========================================================

const getLocationMovements = async (
  locationId
) => {

  // -------------------------------------------------------
  // Verify location
  // -------------------------------------------------------

  const [locations] = await pool.query(
    `
      SELECT
        id,
        name

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


  // -------------------------------------------------------
  // Get movement history
  // -------------------------------------------------------

  const [movements] = await pool.query(
    `
      SELECT

        sm.id,

        sm.ingredient_id,

        i.name AS ingredient,
        i.unit,

        sm.location_id,

        il.name AS location,

        sm.movement_type,

        sm.quantity,

        sm.previous_quantity,
        sm.new_quantity,

        sm.reference_type,
        sm.reference_id,

        sm.reason,

        sm.created_by,

        CONCAT(
          u.first_name,
          ' ',
          u.last_name
        ) AS created_by_name,

        sm.created_at

      FROM stock_movements sm

      INNER JOIN ingredients i
        ON sm.ingredient_id = i.id

      INNER JOIN inventory_locations il
        ON sm.location_id = il.id

      LEFT JOIN users u
        ON sm.created_by = u.id

      WHERE sm.location_id = ?

      ORDER BY sm.created_at DESC,
               sm.id DESC
    `,
    [locationId]
  );


  return movements;
};

export {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  toggleLocationStatus,
  getLocationStock,
  getLocationMovements
};