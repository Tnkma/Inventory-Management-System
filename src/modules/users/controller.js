import {
  getUsers,
  getUserById,
  createUser,
  updateUserRole,
  updateUserStatus
} from "./service.js";


const listUsers = async (req, res, next) => {

  try {

    const users = await getUsers();

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {

    next(error);

  }
};


const getUser = async (req, res, next) => {

  try {

    const user = await getUserById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {

    next(error);

  }
};


const createNewUser = async (req, res, next) => {

  try {

    const user = await createUser(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user
    });

  } catch (error) {

    next(error);

  }
};


const changeUserRole = async (req, res, next) => {

  try {

    const user = await updateUserRole(
      req.params.id,
      req.body.role,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user
    });

  } catch (error) {

    next(error);

  }
};


const changeUserStatus = async (req, res, next) => {

  try {

    const user = await updateUserStatus(
      req.params.id,
      req.body.isActive,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: user
    });

  } catch (error) {

    next(error);

  }
};

const userRole = async (req, res, next) => {

  try {

    const user = await getUserById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: { role: user.role }
    });

  } catch (error) {

    next(error);

  }
};


export {
  listUsers,
  getUser,
  userRole,
  createNewUser,
  changeUserRole,
  changeUserStatus
};