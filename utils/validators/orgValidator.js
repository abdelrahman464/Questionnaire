const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Organization = require("../../models/organizationModel");

//--------------------------------------------------------------------------------------------//

exports.addCoordinatorValidator = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name is too short")
    .isString()
    .withMessage("Name must be a string"),
  //-------------

  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ min: 3 })
    .withMessage("Email is too short")
    .isString()
    .withMessage("Email must be a string")
    .custom(async (email) => {
      const existingOrganization = await Organization.findOne({
        "coordiantors.email": email,
      });
      if (existingOrganization) {
        throw new Error("Email already in use");
      }
      return true;
    }),

  //-------------------------------------------------------------------------------------------
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one digit"
    ),

  //-------------

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
