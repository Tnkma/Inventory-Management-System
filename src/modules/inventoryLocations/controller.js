import {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  toggleLocationStatus,
  getLocationStock,
  getLocationMovements
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


    const location =
      await createLocation(
        {
          name,
          description
        },
        req.user.userId
      );


    res.status(201).json({
      success: true,
      message: "Inventory location created successfully",
      data: location
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

    const locations =
      await getLocations();


    res.status(200).json({
      success: true,
      data: locations
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
      locationId
    } = req.params;


    const location =
      await getLocationById(
        locationId
      );


    res.status(200).json({
      success: true,
      data: location
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
      locationId
    } = req.params;


    const location =
      await updateLocation(
        locationId,
        req.body,
        req.user.userId
      );


    res.status(200).json({
      success: true,
      message: "Inventory location updated successfully",
      data: location
    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// TOGGLE STATUS
// =========================================================

const toggleStatus = async (
  req,
  res,
  next
) => {

  try {

    const {
      locationId
    } = req.params;


    const result =
      await toggleLocationStatus(
        locationId,
        req.user.userId
      );


    res.status(200).json({
      success: true,
      message: "Inventory location status updated successfully",
      data: result
    });

  } catch (error) {

    next(error);

  }
};


// Get stock for a specific location
const getStock = async (
  req,
  res,
  next
) => {

  try {

    const {
      locationId
    } = req.params;


    const result =
      await getLocationStock(
        locationId
      );


    res.status(200).json({

      success: true,

      data: result

    });

  } catch (error) {

    next(error);

  }
};


// =========================================================
// GET LOCATION MOVEMENTS
// =========================================================

const getMovements = async (
  req,
  res,
  next
) => {

  try {

    const {
      locationId
    } = req.params;


    const movements =
      await getLocationMovements(
        locationId
      );


    res.status(200).json({

      success: true,

      data: movements

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
  toggleStatus,
  getStock,
  getMovements
};