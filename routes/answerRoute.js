const express = require("express");

const {
  saveAnswers,
  countAnswersAverage,
  countRatersAnswersAverage
} = require("../services/answerService");

const router = express.Router();

router.route("/:id/saveanswers").post(saveAnswers);
router.route("/:id/countanswers").get(countAnswersAverage);
router.route("/:id/countanswersraters").get(countRatersAnswersAverage);
module.exports = router;
