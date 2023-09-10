const express = require("express");
const authServices = require("../services/authServices");
const {
  saveAnswers,
  countAnswersAverage,
  countRatersAnswersAverage,
} = require("../services/answerService");

const router = express.Router();

router
  .route("/saveanswers")
  .post(authServices.protect, authServices.allowedTo("user"), saveAnswers);
router.route("/countanswers").get(countAnswersAverage);
router.route("/countanswersraters").get(countRatersAnswersAverage);
module.exports = router;
