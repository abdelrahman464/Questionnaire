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
  removeCoordinator,
  getOrgStudents,
} = require("../services/organizationService");
const { addCoordinatorValidator,idValidator } = require("../utils/validators/orgValidator");

const router = express.Router();

router.get(
  "/getOrgStudents",
  authServices.protect,
  authServices.allowedTo("coordinator"),
  getOrgStudents
);

router.route("/").get(authServices.protect, getOrganizations).post(
  authServices.protect,
  // authServices.allowedTo("admin"),
  uploadOrgLogo,
  resizeImage,
  createOrganization
);
router
  .route("/:id")
  .get(authServices.protect, getOrganization)
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    idValidator,
    updateOrganization
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    idValidator,
    deleteOrganization
  );

router.put(
  "/addCoordiantor/:id",
  authServices.protect,
  addCoordinatorValidator,
  idValidator,
  addCoordiantor
);
router.put(
  "/removeCoordinator/:id",
  authServices.protect,
  idValidator,
  removeCoordinator
);

module.exports = router;
