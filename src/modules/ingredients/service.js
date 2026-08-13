import pool from "../../config/database.js";

import eventBus from "../../events/eventBus.js";

import { EVENTS } from "../../events/eventTypes.js";


// =========================================================
// CREATE INGREDIENT
// =========================================================

const createIngredient = async (
  {
    name,
    categoryId,
    sku,
    description,
    unit,
    minimumStock = 0,
    maximumStock = null,
    reorderLevel = 0
  },
  createdBy
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
          AND is_active = TRUE
        LIMIT 1
      `,
      [categoryId]
    );


    if (categories.length === 0) {

      const error = new Error(
        "Invalid inventory category"
      );

      error.statusCode = 400;

      throw error;
    }


    // -----------------------------------------------------
    // Check duplicate ingredient
    // -----------------------------------------------------

    const [existing] = await connection.query(
      `
        SELECT id
        FROM ingredients
        WHERE name = ?
        LIMIT 1
      `,
      [name]
    );


    if (existing.length > 0) {

      const error = new Error(
        "Ingredient already exists"
      );

      error.statusCode = 409;

      throw error;
    }


    // -----------------------------------------------------
    // Create ingredient
    // -----------------------------------------------------

    const [result] = await connection.query(
      `
        INSERT INTO ingredients
        (
          category_id,
          name,
          sku,
          description,
          unit,
          minimum_stock,
          maximum_stock,
          reorder_level,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        categoryId,
        name,
        sku || null,
        description || null,
        unit,
        minimumStock,
        maximumStock,
        reorderLevel,
        createdBy
      ]
    );


    const ingredientId = result.insertId;


    // -----------------------------------------------------
    // Get newly created ingredient
    // -----------------------------------------------------

    const [ingredients] = await connection.query(
      `
        SELECT

          i.id,
          i.name,
          i.sku,
          i.description,
          i.unit,

          i.minimum_stock,
          i.maximum_stock,
          i.reorder_level,

          i.is_active,

          c.id AS category_id,
          c.name AS category,

          i.created_at,
          i.updated_at

        FROM ingredients i

        INNER JOIN inventory_categories c
          ON i.category_id = c.id

        WHERE i.id = ?

        LIMIT 1
      `,
      [ingredientId]
    );


    if (ingredients.length === 0) {

      const error = new Error(
        "Failed to retrieve created ingredient"
      );

      error.statusCode = 500;

      throw error;
    }


    const ingredient = ingredients[0];


    await connection.commit();


    // -----------------------------------------------------
    // Emit event AFTER successful transaction
    // -----------------------------------------------------

    eventBus.emit(
      EVENTS.INGREDIENT_CREATED,
      {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        categoryId: ingredient.category_id,
        unit: ingredient.unit,
        createdBy
      }
    );


    return ingredient;


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
};


// =========================================================
// GET ALL INGREDIENTS
// =========================================================

const getIngredients = async () => {

  const [ingredients] = await pool.query(
    `
      SELECT

        i.id,
        i.name,
        i.sku,
        i.description,
        i.unit,

        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,

        i.is_active,

        c.id AS category_id,
        c.name AS category,

        COALESCE(
          SUM(inv.current_quantity),
          0
        ) AS current_quantity,

        COALESCE(
          SUM(inv.reserved_quantity),
          0
        ) AS reserved_quantity,

        (
          COALESCE(
            SUM(inv.current_quantity),
            0
          )
          -
          COALESCE(
            SUM(inv.reserved_quantity),
            0
          )
        ) AS available_quantity,

        i.created_at,
        i.updated_at

      FROM ingredients i

      INNER JOIN inventory_categories c
        ON i.category_id = c.id

      LEFT JOIN inventory inv
        ON i.id = inv.ingredient_id

      GROUP BY
        i.id,
        i.name,
        i.sku,
        i.description,
        i.unit,
        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,
        i.is_active,
        c.id,
        c.name,
        i.created_at,
        i.updated_at

      ORDER BY i.name ASC
    `
  );


  return ingredients;
};


// =========================================================
// GET INGREDIENT BY ID
// =========================================================

const getIngredientById = async (
  ingredientId
) => {

  const [ingredients] = await pool.query(
    `
      SELECT

        i.id,
        i.name,
        i.sku,
        i.description,
        i.unit,

        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,

        i.is_active,

        c.id AS category_id,
        c.name AS category,

        COALESCE(
          SUM(inv.current_quantity),
          0
        ) AS current_quantity,

        COALESCE(
          SUM(inv.reserved_quantity),
          0
        ) AS reserved_quantity,

        (
          COALESCE(
            SUM(inv.current_quantity),
            0
          )
          -
          COALESCE(
            SUM(inv.reserved_quantity),
            0
          )
        ) AS available_quantity,

        i.created_at,
        i.updated_at

      FROM ingredients i

      INNER JOIN inventory_categories c
        ON i.category_id = c.id

      LEFT JOIN inventory inv
        ON i.id = inv.ingredient_id

      WHERE i.id = ?

      GROUP BY
        i.id,
        i.name,
        i.sku,
        i.description,
        i.unit,
        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,
        i.is_active,
        c.id,
        c.name,
        i.created_at,
        i.updated_at

      LIMIT 1
    `,
    [ingredientId]
  );


  if (ingredients.length === 0) {

    const error = new Error(
      "Ingredient not found"
    );

    error.statusCode = 404;

    throw error;
  }


  return ingredients[0];
};

const updateIngredient = async (
  ingredientId,
  data
) => {

  const {
    name,
    sku,
    description,
    unit,
    minimum_stock,
    maximum_stock,
    reorder_level,
    category_id
  } = data;


  const [existing] = await pool.query(
    `
      SELECT id
      FROM ingredients
      WHERE id = ?
      LIMIT 1
    `,
    [ingredientId]
  );


  if (existing.length === 0) {

    const error = new Error(
      "Ingredient not found"
    );

    error.statusCode = 404;

    throw error;

  }


  await pool.query(
    `
      UPDATE ingredients

      SET
        name = ?,
        sku = ?,
        description = ?,
        unit = ?,
        minimum_stock = ?,
        maximum_stock = ?,
        reorder_level = ?,
        category_id = ?

      WHERE id = ?
    `,
    [
      name,
      sku,
      description,
      unit,
      minimum_stock,
      maximum_stock,
      reorder_level,
      category_id,
      ingredientId
    ]
  );


  const [rows] = await pool.query(
    `
      SELECT
        i.id,
        i.name,
        i.sku,
        i.description,
        i.unit,
        i.minimum_stock,
        i.maximum_stock,
        i.reorder_level,
        i.is_active,
        i.category_id,

        c.name AS category,

        i.created_at,
        i.updated_at

      FROM ingredients i

      INNER JOIN inventory_categories c
        ON i.category_id = c.id

      WHERE i.id = ?

      LIMIT 1
    `,
    [ingredientId]
  );


  return rows[0];

};


export {
  createIngredient,
  getIngredients,
  getIngredientById,
  updateIngredient
};