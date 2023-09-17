const express = require("express");

const {
  createQuestion,
  getQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} = require("../services/questionService");

const router = express.Router();

router.route("/").get(getQuestions).post(createQuestion);
router.route("/:id/").get(getQuestion).put(updateQuestion).delete(deleteQuestion);

module.exports = router;
