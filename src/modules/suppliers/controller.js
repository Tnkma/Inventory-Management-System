import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  updateSupplierStatus
} from "./service.js";

import {
  validateCreateSupplier
} from "./validation.js";


const create = async (req, res, next) => {

  try {

    validateCreateSupplier(req.body);


    const supplier =
      await createSupplier(
        req.body,
        req.user.userId
      );


    res.status(201).json({
      success: true,
      message:
        "Supplier created successfully",
      data: supplier
    });

  } catch (error) {

    next(error);

  }

};


const list = async (req, res, next) => {

  try {

    const suppliers =
      await getSuppliers();


    res.status(200).json({
      success: true,
      data: suppliers
    });

  } catch (error) {

    next(error);

  }

};


const getOne = async (req, res, next) => {

  try {

    const supplier =
      await getSupplierById(
        req.params.id
      );


    res.status(200).json({
      success: true,
      data: supplier
    });

  } catch (error) {

    next(error);

  }

};


const update = async (req, res, next) => {

  try {

    const supplier =
      await updateSupplier(
        req.params.id,
        req.body,
        req.user.userId
      );


    res.status(200).json({
      success: true,
      message:
        "Supplier updated successfully",
      data: supplier
    });

  } catch (error) {

    next(error);

  }

};


const changeStatus = async (
  req,
  res,
  next
) => {

  try {

    const supplier =
      await updateSupplierStatus(
        req.params.id,
        req.body.isActive,
        req.user.userId
      );


    res.status(200).json({
      success: true,
      message:
        "Supplier status updated successfully",
      data: supplier
    });

  } catch (error) {

    next(error);

  }

};


export {
  create,
  list,
  getOne,
  update,
  changeStatus
};