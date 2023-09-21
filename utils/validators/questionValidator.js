const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Key = require("../../models/keyModel");

//--------------------------------------------------------------------------------------------//

exports.createQuestionValidator = [
  check("text")
    .notEmpty()
    .withMessage("Question required")
    .isLength({ min: 3 })
    .withMessage("too short question"),
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
  check("id")
    .notEmpty()
    .withMessage("ID is required")
    .isMongoId()
    .withMessage("Invalid ID format"),

  validatorMiddleware,
];
