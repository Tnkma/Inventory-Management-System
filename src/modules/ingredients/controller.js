import {
  createIngredient,
  getIngredients,
  getIngredientById
} from "./service.js";

import {
  validateCreateIngredient
} from "./validation.js";


const create = async (
  req,
  res,
  next
) => {

  try {

    validateCreateIngredient(
      req.body
    );


    const ingredient =
      await createIngredient(
        req.body,
        req.user.userId
      );


    res.status(201).json({
      success: true,
      message:
        "Ingredient created successfully",
      data: ingredient
    });

  } catch (error) {

    next(error);

  }

};


const list = async (
  req,
  res,
  next
) => {

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


const getOne = async (
  req,
  res,
  next
) => {

  try {

    const ingredient =
      await getIngredientById(
        req.params.id
      );


    res.status(200).json({
      success: true,
      data: ingredient
    });

  } catch (error) {

    next(error);

  }

};


export {
  create,
  list,
  getOne
};