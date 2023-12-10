const express = require("express");
const authServices = require("../services/authServices");
const {
  createWebSiteInfo,
  getAllwebSiteInfo,
  getWebSiteInfo,
  updateWebSiteInfo,
  deleteWebSiteInfo,
} = require("../services/websiteInfoService");

const router = express.Router();

router
  .route("/")
  .get(getAllwebSiteInfo)
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    createWebSiteInfo
  );
router
  .route("/:id/")
  .get(authServices.protect, getWebSiteInfo)
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),

    updateWebSiteInfo
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteWebSiteInfo
  );

module.exports = router;
