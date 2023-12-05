const express = require("express");
const {
  getUserValidator,
  createUserValidator,
  createAdminValidator,
  updateUserValidator,
  deleteUserValidator,
  changeLoggedUserPasswordValidator,
  changeUserOrganizationValidator, // Added validator for changeUserOrganization
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
  availUserTakeQuiz,
  removeKeysFromUser,
  addKeysToUser,
  changeUserOrganization, // Added changeUserOrganization service
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

router
  .route("/availUserToTakeQuiz/:id")
  .put(authServices.protect, authServices.allowedTo("admin"), availUserTakeQuiz);

router
  .route("/removeKeysFromUser/:id")
  .put(authServices.protect, authServices.allowedTo("admin"), removeKeysFromUser);

router
  .route("/addKeysToUser/:id")
  .put(authServices.protect, authServices.allowedTo("admin"), addKeysToUser);


module.exports = router;


