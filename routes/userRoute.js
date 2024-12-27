const express = require("express");
const {
  getUserValidator,
  createUserValidator,
  createAdminValidator,
  updateUserValidator,
  deleteUserValidator,
  changeLoggedUserPasswordValidator,
  // Added validator for changeUserOrganization
  updateManyUsersValidator,
} = require("../utils/validators/userValidator");
const authServices = require("../services/authServices");
const {
  signUp,
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
  getUserReport,
  availUserToSkipRaters,
  updateManyUsers,
  storeManyUsers,
} = require("../services/userService");

const { uploadFile } = require("../middlewares/uploadImageMiddleware");

const router = express.Router();
// 1 - getMe
router.get("/getMe", authServices.protect, getLoggedUserData, getUser);
// 2 - get user's report
router
  .route("/getUserReport/:id")
  .get(authServices.protect, authServices.allowedTo("admin"), getUserReport);
// 3- avail User To SkipRaters
router.put(
  "/availUserToSkipRaters/:id",
  authServices.protect,
  authServices.allowedTo("admin"),
  availUserToSkipRaters
);
router.put(
  "/changeMyPassword",
  authServices.protect,
  changeLoggedUserPasswordValidator,
  updateLoggedUserPassword
);

router.put(
  "/updateManyUsers",
  authServices.protect,
  updateManyUsersValidator,
  updateManyUsers
);
router.post("/storeManyUsers", uploadFile.single("file"), storeManyUsers);

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

router.post("/signUp", createUserValidator, signUp);

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
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    availUserTakeQuiz
  );

router
  .route("/removeKeysFromUser/:id")
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    removeKeysFromUser
  );

router
  .route("/addKeysToUser/:id")
  .put(authServices.protect, authServices.allowedTo("admin"), addKeysToUser);

module.exports = router;
