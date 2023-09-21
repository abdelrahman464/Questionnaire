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
} = require("../services/questionService");

const router = express.Router();

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
  .route("/:id/")
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
