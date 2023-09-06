const express = require("express");

const {
  createKey,
  getKey,
  getKeys,
  updateKey,
  deleteKey,
} = require("../services/categoryService");

const router = express.Router();

router.route("/").get(getKeys).post(createKey);
router.route("/:id/").get(getKey).put(updateKey).delete(deleteKey);

module.exports = router;
