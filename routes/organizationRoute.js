const express = require("express");
const authServices = require("../services/authServices");
const {
  uploadOrgLogo,
  resizeImage,
  createOrganization,
  updateOrganization,
  getOrganizations,
  getOrganization,
  deleteOrganization,
  addCoordiantor,
  getOrgStudents,
} = require("../services/organizationService");

const router = express.Router();

router
  .route("/")
  .get(authServices.protect, getOrganizations)
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    uploadOrgLogo,
    resizeImage,
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

router.get("/getOrgStudents", authServices.protect, getOrgStudents);

module.exports = router;
