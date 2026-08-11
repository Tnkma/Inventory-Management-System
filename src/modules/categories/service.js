import pool from "../../config/database.js";

import eventBus from "../../events/eventBus.js";

import { EVENTS } from "../../events/eventTypes.js";


// =========================================================
// CREATE CATEGORY
// =========================================================

const createCategory = async (
  {
    name,
    description = null
  },
  createdBy
) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // -----------------------------------------------------
    // Normalize category name
    // -----------------------------------------------------

    const cleanName = name.trim();


    // -----------------------------------------------------
    // Check duplicate category
    // -----------------------------------------------------

    const [existing] = await connection.query(
    `
        SELECT id
        FROM inventory_categories
        WHERE LOWER(TRIM(name)) = LOWER(?)
        LIMIT 1
    `,
    [cleanName]
    );


    if (existing.length > 0) {

    const error = new Error(
        "Category already exists"
    );

    error.statusCode = 409;

    throw error;
    }


    // -----------------------------------------------------
    // Create category
    // -----------------------------------------------------

    const [result] = await connection.query(
    `
        INSERT INTO inventory_categories
        (
        name,
        description
        )
        VALUES (?, ?)
    `,
    [
        cleanName,
        description || null
    ]
    );


    const categoryId = result.insertId;

    // -----------------------------------------------------
    // Get created category
    // -----------------------------------------------------

    const [categories] = await connection.query(
      `
        SELECT
          id,
          name,
          description,
          is_active,
          created_at,
          updated_at

        FROM inventory_categories

        WHERE id = ?

        LIMIT 1
      `,
      [categoryId]
    );


    const category = categories[0];


    await connection.commit();


    // -----------------------------------------------------
    // Emit event AFTER successful transaction
    // -----------------------------------------------------

    eventBus.emit(
      EVENTS.CATEGORY_CREATED,
      {
        categoryId: category.id,
        categoryName: category.name,
        createdBy
      }
    );


    return category;


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// GET ALL CATEGORIES
// =========================================================

const getCategories = async () => {

  const [categories] = await pool.query(
    `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at

      FROM inventory_categories

      ORDER BY name ASC
    `
  );


  return categories;
};


// =========================================================
// GET CATEGORY BY ID
// =========================================================

const getCategoryById = async (
  categoryId
) => {

  const [categories] = await pool.query(
    `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at

      FROM inventory_categories

      WHERE id = ?

      LIMIT 1
    `,
    [categoryId]
  );


  if (categories.length === 0) {

    const error = new Error(
      "Category not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return categories[0];
};


// =========================================================
// UPDATE CATEGORY
// =========================================================

const updateCategory = async (
  categoryId,
  {
    name,
    description
  },
  updatedBy
) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // -----------------------------------------------------
    // Check category
    // -----------------------------------------------------

    const [categories] = await connection.query(
      `
        SELECT id
        FROM inventory_categories
        WHERE id = ?
        LIMIT 1
      `,
      [categoryId]
    );


    if (categories.length === 0) {

      const error = new Error(
        "Category not found"
      );

      error.statusCode = 404;

      throw error;
    }


    // -----------------------------------------------------
    // Check duplicate name
    // -----------------------------------------------------

    if (name) {

      const [existing] = await connection.query(
        `
          SELECT id
          FROM inventory_categories

          WHERE name = ?
            AND id != ?

          LIMIT 1
        `,
        [
          name,
          categoryId
        ]
      );


      if (existing.length > 0) {

        const error = new Error(
          "Category name already exists"
        );

        error.statusCode = 409;

        throw error;
      }
    }


    // -----------------------------------------------------
    // Update category
    // -----------------------------------------------------

    await connection.query(
      `
        UPDATE inventory_categories

        SET
          name = COALESCE(?, name),
          description = COALESCE(?, description)

        WHERE id = ?
      `,
      [
        name || null,
        description !== undefined
          ? description
          : null,
        categoryId
      ]
    );


    // -----------------------------------------------------
    // Get updated category
    // -----------------------------------------------------

    const [updatedCategories] =
      await connection.query(
        `
          SELECT
            id,
            name,
            description,
            is_active,
            created_at,
            updated_at

          FROM inventory_categories

          WHERE id = ?

          LIMIT 1
        `,
        [categoryId]
      );


    const category =
      updatedCategories[0];


    await connection.commit();


    eventBus.emit(
      EVENTS.CATEGORY_UPDATED,
      {
        categoryId: category.id,
        categoryName: category.name,
        updatedBy
      }
    );


    return category;


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// UPDATE CATEGORY STATUS
// =========================================================

const updateCategoryStatus = async (
  categoryId,
  isActive,
  updatedBy
) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    const [categories] =
      await connection.query(
        `
          SELECT id
          FROM inventory_categories
          WHERE id = ?
          LIMIT 1
        `,
        [categoryId]
      );


    if (categories.length === 0) {

      const error = new Error(
        "Category not found"
      );

      error.statusCode = 404;

      throw error;
    }


    await connection.query(
      `
        UPDATE inventory_categories

        SET
          is_active = ?

        WHERE id = ?
      `,
      [
        isActive,
        categoryId
      ]
    );


    const [updatedCategories] =
      await connection.query(
        `
          SELECT
            id,
            name,
            description,
            is_active,
            created_at,
            updated_at

          FROM inventory_categories

          WHERE id = ?

          LIMIT 1
        `,
        [categoryId]
      );


    const category =
      updatedCategories[0];


    await connection.commit();


    eventBus.emit(
      EVENTS.CATEGORY_STATUS_UPDATED,
      {
        categoryId: category.id,
        categoryName: category.name,
        isActive: category.is_active,
        updatedBy
      }
    );


    return category;


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus
};