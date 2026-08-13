import {
  createIngredient,
  getIngredients,
  getIngredientById,
  updateIngredient
} from "./service.js";


// =========================================================
// CREATE INGREDIENT
// =========================================================

const create = async (req, res, next) => {
  try {
    const {
      name,
      category_id,
      sku,
      description,
      unit,
      minimum_stock,
      maximum_stock,
      reorder_level
    } = req.body;

    const ingredient = await createIngredient(
      {
        name,
        categoryId: category_id,
        sku,
        description,
        unit,
        minimumStock: minimum_stock,
        maximumStock: maximum_stock,
        reorderLevel: reorder_level
      },
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "Ingredient created successfully",
      data: ingredient
    });

  } catch (error) {
    next(error);
  }
};


// =========================================================
// LIST INGREDIENTS
// =========================================================

const list = async (req, res, next) => {

  try {

    const ingredients =
      await getIngredients();

    res.status(200).json({
      success: true,
      data: ingredients
    });

  } catch (error) {

    next(error);

  }

};


// =========================================================
// GET ONE INGREDIENT
// =========================================================

const getOne = async (req, res, next) => {

  try {

    const { id } = req.params;

    const ingredient =
      await getIngredientById(id);

    res.status(200).json({
      success: true,
      data: ingredient
    });

  } catch (error) {

    next(error);

  }

};


// =========================================================
// UPDATE INGREDIENT
// =========================================================

const update = async (req, res, next) => {

  try {

    const { id } = req.params;

    const ingredient =
      await updateIngredient(
        id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Ingredient updated successfully",
      data: ingredient
    });

  } catch (error) {

    next(error);

  }

};


export {
  create,
  list,
  getOne,
  update
};