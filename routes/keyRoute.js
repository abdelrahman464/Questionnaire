const express = require("express");
const {
  createKeyValidator,
  idValidator,
  updateKeyValidator,
} = require("../utils/validators/keyValidator");
const authServices = require("../services/authServices");
const {
  createKey,
  getKey,
  getKeys,
  updateKey,
  deleteKey,
} = require("../services/categoryService");

const router = express.Router();

router
  .route("/")
  .get(authServices.protect, getKeys)
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    createKeyValidator,
    createKey
  );
router
  .route("/:id")
  .get(authServices.protect, idValidator, getKey)
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    updateKeyValidator,
    updateKey
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    idValidator,
    deleteKey
  );

module.exports = router;
