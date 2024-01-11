const express = require("express");
const authServices = require("../services/authServices");
const {
  saveAnswers,
  saveRaterAnswers,
  getUserAnswers,
  getUserAnswersReportTotal,
  updateRaterEmail,
  SendEmailToRater,
  SendReportDocToUser,
  upload,
  getAnswerEmails,
} = require("../services/answerService");

const {
  userAnswerValidator,
  raterAnswerValidator,
  getUserAnswerValidator,
  UserAnswersReportValidator,
  sendEmailToRaterValidator,
} = require("../utils/validators/answerValidator");

const router = express.Router();
//-------------------------------------------------------------------------
router
  .route("/saveanswers")
  .post(
    authServices.protect,
    authServices.allowedTo("user", "admin"),
    userAnswerValidator,
    saveAnswers
  );
//-------------------------------------------------------------------------
//make route to get raterTest
router.route("/saveRateranswers").post(raterAnswerValidator, saveRaterAnswers);
//-------------------------------------------------------------------------
router
  .route("/getUserAnswersReportTotal/:userId")
  .get(
    authServices.protect,
    authServices.allowedTo("user", "admin"),
    UserAnswersReportValidator,
    getUserAnswersReportTotal
  );
//-------------------------------------------------------------------------
router
  .route("/getUserAnswers/:userId/:status")
  .get(
    authServices.protect,
    authServices.allowedTo("admin", "user"),
    getUserAnswerValidator,
    getUserAnswers
  );
//-------------------------------------------------------------------------
router
  .route("/getAnswerEmails/:userId")
  .get(
    authServices.protect,
    authServices.allowedTo("admin", "user"),
    getAnswerEmails
  );
//-------------------------------------------------------------------------
router.put(
  "/updateRaterEmail",
  authServices.protect,
  authServices.allowedTo("admin", "user"),
  updateRaterEmail
);
//dont forget to add remove user
//-------------------------------------------------------------------------
router.put(
  "/SendEmailToRater",
  authServices.protect,
  authServices.allowedTo("admin", "user"),
  sendEmailToRaterValidator,
  SendEmailToRater
);
//-------------------------------------------------------------------------
router.put(
  "/SendReportDocToUser",
  authServices.protect,
  authServices.allowedTo("admin", "user"),
  upload,
  SendReportDocToUser
);
//-------------------------------------------------------------------------
module.exports = router;
