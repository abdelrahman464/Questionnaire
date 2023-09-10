const express = require("express");
const {
  getUserValidator,
  createUserValidator,
  createAdminValidator,
  updateUserValidator,
  deleteUserValidator,
  changeLoggedUserPasswordValidator,
} = require("../utils/validators/userValidator");
const authServices = require("../services/authServices");
const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getLoggedUserData,
  updateLoggedUserPassword,
  createAdmin,
} = require("../services/userService");

const router = express.Router();

router.get("/getMe", authServices.protect, getLoggedUserData, getUser);
router.put(
  "/changeMyPassword",
  authServices.protect,
  changeLoggedUserPasswordValidator,
  updateLoggedUserPassword
);
router
  .route("/createadmin")
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    createAdminValidator,
    createAdmin
  );
router
  .route("/")
  .get(authServices.protect, authServices.allowedTo("admin"), getUsers)
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    createUserValidator,
    createUser
  );
router
  .route("/:id")
  .get(
    authServices.protect,
    authServices.allowedTo("admin"),
    getUserValidator,
    getUser
  )
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    updateUserValidator,
    updateUser
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteUserValidator,
    deleteUser
  );

module.exports = router;
