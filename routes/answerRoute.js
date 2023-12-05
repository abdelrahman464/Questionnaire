const express = require("express");
const authServices = require("../services/authServices");
const {
  saveAnswers,
  saveRaterAnswers,

  getUserAnswersReport,
  getUserAnswers,
  getUserAnswersReportTotal,
  updateRaterEmail,
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
    authServices.allowedTo("user", "admin"),
    userAnswerValidator,
    saveAnswers
  );
router.route("/saveRateranswers").post(raterAnswerValidator, saveRaterAnswers);

router
  .route("/getUserAnswersReport/:keyId/:userId")
  .get(
    authServices.protect,
    authServices.allowedTo("user", "admin"),
    UserAnswersReportValidator,
    getUserAnswersReport
  );
router
  .route("/getUserAnswersReportTotal/:userId")
  .get(
    authServices.protect,
    authServices.allowedTo("user", "admin"),
    UserAnswersReportValidator,
    getUserAnswersReportTotal
  );
router
  .route("/getUserAnswers/:userId/:status")
  .get(
    authServices.protect,
    authServices.allowedTo("admin", "user"),
    getUserAnswerValidator,
    getUserAnswers
  );
router.put("/updateRaterEmail", updateRaterEmail);

module.exports = router;
