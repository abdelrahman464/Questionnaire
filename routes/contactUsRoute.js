const express = require("express");
const authServices = require("../services/authServices");
const {
  getAllContactUs,
  createContactUs,
  updateContactUs,
  deleteContactUs,
} = require("../services/contactUsService");

const router = express.Router();

router
  .route("/")
  .get(getAllContactUs)
  .post(authServices.protect, authServices.allowedTo("admin"), createContactUs);
router
  .route("/:id/")
  .put(authServices.protect, authServices.allowedTo("admin"), updateContactUs)
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteContactUs
  );

module.exports = router;
