const express = require("express");

const {
  saveAnswers,
  countAnswersAverage,
  countRatersAnswersAverage
} = require("../services/answerService");

const router = express.Router();

router.route("/saveanswers").post(saveAnswers);
router.route("/countanswers").get(countAnswersAverage);
router.route("/countanswersraters").get(countRatersAnswersAverage);
module.exports = router;
