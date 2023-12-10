const express = require("express");

const {
  login,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
  loginUser,
  loginCoordinator,
} = require("../services/authServices");

const router = express.Router();

router.route("/login").post(login);
router.route("/loginUser").post(loginUser);
router.route("/loginCoordinator").post(loginCoordinator);
router.route("/forgotPassword").post(forgotPassword);
router.route("/verifyResetCode").post(verifyPassResetCode);
router.route("/resetPassword").put(resetPassword);

module.exports = router;
