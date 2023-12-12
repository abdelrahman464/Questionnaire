const express = require("express");
const authServices = require("../services/authServices");
const {
  createQuestionValidator,
  idValidator,
  updateQuestionValidator,
} = require("../utils/validators/questionValidator");
const {
  createQuestion,
  getQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  takeTest,
  takeTestForRater,
} = require("../services/questionService");
const { checkRaterAuth } = require("../middlewares/answerMiddleware");

const router = express.Router();

router.route("/takeTest").get(authServices.protect, takeTest);
router
  .route("/takeRaterTest")
  .put(authServices.protect, checkRaterAuth, takeTestForRater);
router
  .route("/")
  .get(getQuestions)
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    createQuestionValidator,
    createQuestion
  );
router
  .route("/:id")
  .get(authServices.protect, idValidator, getQuestion)
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    updateQuestionValidator,
    updateQuestion
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    idValidator,
    deleteQuestion
  );

module.exports = router;
