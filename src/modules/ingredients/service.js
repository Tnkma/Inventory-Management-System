import pool from "../../config/database.js";

import eventBus
  from "../../events/eventBus.js";

import { EVENTS }
  from "../../events/eventTypes.js";


const createIngredient = async ({
  name,
  categoryId,
  sku,
  description,
  unit,
  minimumStock = 0,
  maximumStock = null,
  reorderLevel = 0
}, createdBy) => {

  // Check category
  const [categories] = await pool.query(
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


  // Check duplicate ingredient
  const [existing] = await pool.query(
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


  // Create ingredient
  const [result] = await pool.query(
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


  // Create initial inventory record
  await pool.query(
    `
      INSERT INTO inventory
      (
        ingredient_id,
        current_quantity
      )
      VALUES (?, 0)
    `,
    [ingredientId]
  );


  const ingredient =
    await getIngredientById(
      ingredientId
    );


  eventBus.emit(
    EVENTS.INGREDIENT_CREATED,
    {
      ingredientId,
      ingredientName: ingredient.name,
      createdBy
    }
  );


  return ingredient;
};


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

        inv.current_quantity,
        inv.reserved_quantity,

        i.created_at,
        i.updated_at

      FROM ingredients i

      INNER JOIN inventory_categories c
        ON i.category_id = c.id

      INNER JOIN inventory inv
        ON i.id = inv.ingredient_id

      ORDER BY i.name ASC
    `
  );


  return ingredients;
};


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

        inv.current_quantity,
        inv.reserved_quantity,

        i.created_at,
        i.updated_at

      FROM ingredients i

      INNER JOIN inventory_categories c
        ON i.category_id = c.id

      INNER JOIN inventory inv
        ON i.id = inv.ingredient_id

      WHERE i.id = ?

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


export {
  createIngredient,
  getIngredients,
  getIngredientById
};