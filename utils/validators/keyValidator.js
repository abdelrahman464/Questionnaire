const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

//--------------------------------------------------------------------------------------------//

exports.createKeyValidator = [
  check("name")
    .notEmpty()
    .withMessage("Key required")
    .isLength({ min: 3 })
    .withMessage("too short key name")
    .isLength({ max: 48 })
    .withMessage("too long key name"),
  validatorMiddleware,
];

//--------------------------------------------------------------------------------------------//

exports.idValidator = [
  // Validation rules for deleting an Key
  check("id")
    .notEmpty()
    .withMessage("Key ID is required")
    .isMongoId()
    .withMessage("Invalid Key ID format"),

  // Middleware to handle validation errors
  validatorMiddleware,
];
//--------------------------------------------------------------------------------------------//
exports.updateKeyValidator = [
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("too short key name")
    .isLength({ max: 48 })
    .withMessage("too long key name"),
  check("id")
    .notEmpty()
    .withMessage("Key ID is required")
    .isMongoId()
    .withMessage("Invalid Key ID format"),

  validatorMiddleware,
];
