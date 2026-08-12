import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus
} from "./service.js";


// =========================================================
// CREATE
// =========================================================

const create = async (
  req,
  res,
  next
) => {

  try {

    const {
      name,
      description
    } = req.body;


    const category =
      await createCategory(
        {
          name,
          description
        },
        req.user.userId
      );


    res.status(201).json({

      success: true,

      message:
        "Category created successfully",

      data: category

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET ALL
// =========================================================

const getAll = async (
  req,
  res,
  next
) => {

  try {

    const categories =
      await getCategories();


    res.status(200).json({

      success: true,

      data: categories

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET BY ID
// =========================================================

const getOne = async (
  req,
  res,
  next
) => {

  try {

    const {
      categoryId
    } = req.params;


    const category =
      await getCategoryById(
        categoryId
      );


    res.status(200).json({

      success: true,

      data: category

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// UPDATE
// =========================================================

const update = async (
  req,
  res,
  next
) => {

  try {

    const {
      categoryId
    } = req.params;


    const {
      name,
      description
    } = req.body;


    const category =
      await updateCategory(
        categoryId,
        {
          name,
          description
        },
        req.user.userId
      );


    res.status(200).json({

      success: true,

      message:
        "Category updated successfully",

      data: category

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// UPDATE STATUS
// =========================================================

const updateStatus = async (
  req,
  res,
  next
) => {

  try {

    const {
      categoryId
    } = req.params;


    const {
      isActive
    } = req.body;


    const category =
      await updateCategoryStatus(
        categoryId,
        isActive,
        req.user.userId
      );


    res.status(200).json({

      success: true,

      message:
        "Category status updated successfully",

      data: category

    });

  } catch (error) {

    next(error);

  }
};


export {
  create,
  getAll,
  getOne,
  update,
  updateStatus
};