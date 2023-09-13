const express = require("express");
const authServices = require("../services/authServices");
const {
  saveAnswers,
  countAnswersAverage,
  countRatersAnswersAverage,
  generatePDF,
} = require("../services/answerService");

const router = express.Router();

router
  .route("/saveanswers")
  .post(authServices.protect, authServices.allowedTo("user"), saveAnswers);
router.route("/countanswers").get(authServices.protect, authServices.allowedTo("user"),countAnswersAverage);
router.route("/countanswersraters").get(authServices.protect, authServices.allowedTo("user"),countRatersAnswersAverage);
router.route("/generatepdf").post(authServices.protect, authServices.allowedTo("user"),generatePDF);
module.exports = router;
