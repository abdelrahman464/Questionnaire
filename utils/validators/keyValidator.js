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
  check("desc")
    .notEmpty()
    .withMessage("desc required")
    .isLength({ min: 3 })
    .withMessage("too short desc"),
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
  check("id")
    .notEmpty()
    .withMessage("Key ID is required")
    .isMongoId()
    .withMessage("Invalid Key ID format"),
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("too short key name")
    .isLength({ max: 48 })
    .withMessage("too long key name"),
  check("desc").optional().isLength({ min: 3 }).withMessage("too short desc"),

  validatorMiddleware,
];
