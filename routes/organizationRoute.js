const express = require("express");
const authServices = require("../services/authServices");
const {
  createOrganization,
  updateOrganization,
  getOrganizations,
  getOrganization,
  deleteOrganization,
  addCoordiantor,
} = require("../services/organizationService");

const router = express.Router();

router
  .route("/")
  .get(authServices.protect, getOrganizations)
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    createOrganization
  );
router
  .route("/:id/")
  .get(authServices.protect, getOrganization)
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    updateOrganization
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteOrganization
  );

router.put("/addCoordiantor/:id", authServices.protect, addCoordiantor);

module.exports = router;
