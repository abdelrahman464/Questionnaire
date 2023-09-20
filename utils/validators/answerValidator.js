/* eslint-disable no-restricted-syntax */
const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const { Answer } = require("../../models/answerModel");
//--------------------------------------------------------------------------------------------//

exports.userAnswerValidator = [
  check("answers")
    .notEmpty()
    .withMessage("User answer array cannot be empty")
    .isArray()
    .withMessage("User answer must be an array"),
  check("raterEmails")
    .notEmpty()
    .withMessage("raterEmails is required")
    .isArray({ min: 3, max: 3 })
    .withMessage("raterEmails must be an array with exactly 3 names")
    .custom((raterEmails) => {
      // Validate each email in the raterEmails array
      // eslint-disable-next-line no-restricted-syntax
      for (const email of raterEmails) {
        // eslint-disable-next-line no-use-before-define
        if (!isValidEmail(email)) {
          throw new Error("Invalid email address");
        }
      }
      return true;
    }),
  check("raterEmails")
    .custom((raterEmails) => {
      const uniqueEmails = new Set(raterEmails);
      return uniqueEmails.size === raterEmails.length;
    })
    .withMessage("All Emails in raterEmails must be unique"),

  validatorMiddleware,
];

// Custom function to validate an email address
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
//--------------------------------------------------------------------------------------------//

exports.raterAnswerValidator = [
  check("answers")
    .notEmpty()
    .withMessage("rater's answer array cannot be empty")
    .isArray()
    .withMessage("rater's answer must be an array"),
  check("raterEmail")
    .notEmpty()
    .withMessage("raterEmails array cannot be empty")
    .isEmail()
    .withMessage("raterEmails must be an email"),
  check("docId")
    .notEmpty()
    .withMessage("docId cannot be empty")
    .isMongoId()
    .withMessage("invalid id"),
  validatorMiddleware,
];
//--------------------------------------------------------------------------------------------//
exports.deleteAnswerValidator = [
  // Validation rules for deleting an answer
  check("id")
    .notEmpty()
    .withMessage("Answer ID is required")
    .isMongoId()
    .withMessage("Invalid Answer ID format"),

  // Middleware to handle validation errors
  validatorMiddleware,
];
//--------------------------------------------------------------------------------------------//

exports.getUserAnswerValidator = [
  // Validation rules for deleting an answer
  check("userId")
    .notEmpty()
    .withMessage("userId is required")
    .isMongoId()
    .withMessage("Invalid userId format"),
  check("status")
    .notEmpty()
    .withMessage("status is required")
    .isIn([0, 1])
    .withMessage("un supported status only "),

  // Middleware to handle validation errors
  validatorMiddleware,
];
//--------------------------------------------------------------------------------------------//

exports.UserAnswersReportValidator = [
  check("userId").custom(async (userId) => {
    console.log(userId)
   
    const answerCount = await Answer.find({userId:userId});
    console.log(answerCount)
    return answerCount.length === 2;
  }),

  // Check if the answers of raters in each document are not empty
  check("userId").custom(async (userId) => {
    const userAnswers = await Answer.find({ userId });

    for (const userAnswer of userAnswers) {
      for (const rater of userAnswer.raters) {
        if (rater.answers.length === 0) {
          return false; // At least one document has an empty `raters` answers array
        }
      }
    }

    return true; // All documents have non-empty `raters` answers arrays
  }),

  validatorMiddleware,
];
