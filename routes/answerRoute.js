const express = require("express");
const authServices = require("../services/authServices");
const {
  saveAnswers,
  saveRaterAnswers,
  countAnswersAverage,
  countRatersAnswersAverage,
  generatePDF,
  getUserAnswersReport,
  getUserAnswers,
} = require("../services/answerService");

const {
  userAnswerValidator,
  raterAnswerValidator,
  getUserAnswerValidator,
  UserAnswersReportValidator,
} = require("../utils/validators/answerValidator");

const router = express.Router();

router
  .route("/saveanswers")
  .post(
    authServices.protect,
    authServices.allowedTo("user"),
    userAnswerValidator,
    saveAnswers
  );
router.route("/saveRateranswers").post(raterAnswerValidator, saveRaterAnswers);
router
  .route("/countanswers")
  .get(
    authServices.protect,
    authServices.allowedTo("user"),
    countAnswersAverage
  );
router
  .route("/countanswersraters")
  .get(
    authServices.protect,
    authServices.allowedTo("user"),
    countRatersAnswersAverage
  );
router
  .route("/generatepdf")
  .get(authServices.protect, authServices.allowedTo("user"), generatePDF);
router
  .route("/getUserAnswersReport/:keyId/:userId")
  .get(
    authServices.protect,
    authServices.allowedTo("user","admin"),
    UserAnswersReportValidator,
    getUserAnswersReport
  );
router
  .route("/getUserAnswers/:userId/:status")
  .get(
    authServices.protect,
    authServices.allowedTo("admin","user"),
    getUserAnswerValidator,
    getUserAnswers
  );

module.exports = router;
