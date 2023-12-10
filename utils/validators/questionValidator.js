const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Key = require("../../models/keyModel");

//--------------------------------------------------------------------------------------------//

exports.createQuestionValidator = [
  check("text")
    .notEmpty()
    .withMessage("Question required")
    .isLength({ min: 3 })
    .withMessage("too short question")
    .isString()
    .withMessage("text must be a string"),
  //-------------
  check("options")
    .optional()
    .isArray()
    .withMessage("options must be an array")
    .custom((options) => {
      if (!options.every((option) => typeof option === "string")) {
        throw new Error("options must be an array of strings");
      }
      return true;
    }),
  //-------------
  check("correctAnswer")
    .if(check("options").exists())
    .notEmpty()
    .withMessage("correctAnswer required")
    .isLength({ min: 3 })
    .withMessage("too short correctAnswer")
    .isString()
    .withMessage("correctAnswer must be a string"),
  //-------------
  check("section")
    .notEmpty()
    .withMessage("section ID is required")
    .isMongoId()
    .withMessage("Invalid section ID format")
    .custom((sectionId) =>
      Key.findById(sectionId).then((section) => {
        if (!section) {
          return Promise.reject(new Error(`Key not found`));
        }
      })
    ),
  validatorMiddleware,
];

//--------------------------------------------------------------------------------------------//

exports.idValidator = [
  // Validation rules for deleting an Key
  check("id")
    .notEmpty()
    .withMessage("ID is required")
    .isMongoId()
    .withMessage("Invalid ID format"),

  // Middleware to handle validation errors
  validatorMiddleware,
];
//--------------------------------------------------------------------------------------------//
exports.updateQuestionValidator = [
  check("id")
    .notEmpty()
    .withMessage("ID is required")
    .isMongoId()
    .withMessage("Invalid ID format"),
  check("text")
    .optional()
    .isLength({ min: 3 })
    .withMessage("too short question"),
  check("section")
    .optional()
    .isMongoId()
    .withMessage("Invalid section ID format")
    .custom((sectionId) =>
      Key.findById(sectionId).then((section) => {
        if (!section) {
          return Promise.reject(new Error(`Key not found`));
        }
      })
    ),
  check("options")
    .optional()
    .isArray()
    .withMessage("options must be an array")
    .custom((options) => {
      if (!options.every((option) => typeof option === "string")) {
        throw new Error("options must be an array of strings");
      }
      return true;
    }),
  //-------------
  check("correctAnswer")
    .optional()
    .isLength({ min: 3 })
    .withMessage("too short correctAnswer")
    .isString()
    .withMessage("correctAnswer must be a string"),

  validatorMiddleware,
];
