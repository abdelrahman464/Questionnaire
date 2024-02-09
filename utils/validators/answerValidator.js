/* eslint-disable no-restricted-syntax */
const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Answer = require("../../models/answerModel");
//--------------------------------------------------------------------------------------------//

exports.userAnswerValidator = [
  check("answers")
    .notEmpty()
    .withMessage("User answer array cannot be empty")
    .isArray()
    .withMessage("User answer must be an array"),
  check("raterEmails")
    .optional()
    .isArray({ min: 1, max: 3 })
    .withMessage("raterEmails must be an array of 1 to 3 emails")
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
    })
    .custom((raterEmails) => {
      const uniqueEmails = new Set(raterEmails);
      return uniqueEmails.size === raterEmails.length;
    })
    .withMessage("يجب ان تكون ايميلات المقيمين غير متكرره"),

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
    .withMessage("Invalid userId format")
    .custom(async (userId, { req }) => {
      if (userId !== req.user._id.toString() && req.user.role !== "admin") {
        return Promise.reject(new Error("غير مسموح لك ب استعراض هذا التقرير"));
      }
    }),
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
  check("userId")
    .isMongoId()
    .withMessage("invalid userId format")
    .custom(async (userId, { req }) => {
      if (userId !== req.user._id.toString() && req.user.role !== "admin") {
        return Promise.reject(
          new Error("You are not allowed to view this report")
        );
      }
      const answerCount = await Answer.find({ userId: userId });
      return answerCount.length === 2;
    }),
  validatorMiddleware,
];
exports.sendEmailToRaterValidator = [
  check("raterEmail")
    .notEmpty()
    .withMessage("raterEmail is required")
    .isEmail()
    .withMessage("raterEmail must be a valid email"),
  check("docId")
    .notEmpty()
    .withMessage("docId is required")
    .isMongoId()
    .withMessage("Invalid docId format"),

  validatorMiddleware,
];
