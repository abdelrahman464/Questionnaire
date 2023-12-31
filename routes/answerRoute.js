const express = require("express");
const authServices = require("../services/authServices");
const {
  saveAnswers,
  saveRaterAnswers,
  getUserAnswersReport,
  getUserAnswers,
  getUserAnswersReportTotal,
  updateRaterEmail,
  SendEmailToRater,
  SendReportDocToUser,
  upload,
} = require("../services/answerService");

const {
  userAnswerValidator,
  raterAnswerValidator,
  getUserAnswerValidator,
  UserAnswersReportValidator,
  sendEmailToRaterValidator,
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
//make route to get raterTest  
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
//dont forget to add remove user
router.put(
  "/SendEmailToRater",
  authServices.protect,
  authServices.allowedTo("admin", "user"),
  sendEmailToRaterValidator,
  SendEmailToRater
);
router.put(
  "/SendReportDocToUser",
  authServices.protect,
  authServices.allowedTo("admin", "user"),
  upload,
  SendReportDocToUser
);

module.exports = router;
