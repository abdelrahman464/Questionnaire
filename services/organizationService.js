// Import necessary modules and dependencies
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const Organization = require("../models/organizationModel");
const User = require("../models/userModel");
const factory = require("./handllerFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const ApiError = require("../utils/apiError");

//upload Singel image
exports.uploadOrgLogo = uploadSingleImage("logo");
//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (req.file) {
    console.log("sac");
    const imageFile = req.file;
    if (imageFile.mimetype.startsWith("image/")) {
      const imageFileName = `org-${uuidv4()}-${Date.now()}.jpeg`;
      const imagePath = `uploads/organizations/${imageFileName}`;

      fs.writeFileSync(imagePath, imageFile.buffer);
      req.body.logo = imageFileName;
    } else {
      return next(new ApiError("Invalid image file format", 400));
    }
  } else {
    // Handle case where no file was uploaded
    return next(new ApiError("No image file uploaded", 400));
  }
  return next();
});
//@desc get list of Organizations
//@route GET /api/v1/Organizations
//@access public
exports.getOrganizations = factory.getALl(Organization);
//@desc get specific Organization by id
//@route GET /api/v1/Organizations/:id
//@access public
exports.getOrganization = factory.getOne(Organization);
//@desc create Organization
//@route POST /api/v1/Organizations
//@access private
exports.createOrganization = factory.createOne(Organization);
//@desc update specific Organization
//@route PUT /api/v1/Organizations/:id
//@access private
exports.updateOrganization = factory.updateOne(Organization);
//@desc delete Organization
//@route DELETE /api/v1/Organizations/:id
//@access private
exports.deleteOrganization = factory.deleteOne(Organization);

//@desc Add a coordinator to an organization
//@route PUT /api/v1/Organizations/addCoordinator/:id
//@access Admin
exports.addCoordiantor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coordiantor = req.body;

    // Hash the coordinator's password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(coordiantor.password, saltRounds);

    // Replace the plain text password with the hashed one
    coordiantor.password = hashedPassword;

    // const organization = await Organization.findById(id);

    const organization = await Organization.findByIdAndUpdate(
      id,
      {
        $addToSet: { coordiantors: coordiantor },
      },
      { new: true }
    );
    if (!organization) {
      return next(new AppError("No organization found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      organization,
    });
  } catch (error) {
    next(error);
  }
};
//@desc Remove a coordinator from an organization
//@route PUT /api/v1/Organizations/removeCoordinator/:coordinatorId
//@access Admin
exports.removeCoordinator = async (req, res, next) => {
  try {
    //this id is for coordinator not for organization
    const { id } = req.params;

    // Find the organization containing the coordinator with coordinatorId
    const organization = await Organization.findOne({
      "coordiantors._id": id,
    });

    if (!organization) {
      return next(
        new ApiError("Coordinator not found in any organization", 404)
      );
    }

    // Remove the coordinator from the array
    organization.coordiantors = organization.coordiantors.filter(
      (coordinator) => coordinator._id.toString() !== id
    );

    // Save the updated organization
    await organization.save();

    res.status(200).json({
      status: "success",
      msg: "Coordinator removed successfully",
      organization,
    });
  } catch (error) {
    next(error);
  }
};

//@desc get list of students in an organization
//@route GET /api/v1/Organizations/getOrgStudents
//@access private
exports.getOrgStudents = async (req, res) => {
  try {
    const organization = await Organization.findOne({
      "coordiantors.email": req.user.email,
    });

    if (!organization) {
      return next(new ApiError("انت لا تنتمي لاي منظمه", 404));
    }
    const users = await User.find({ organization: organization._id }).populate({
      path: "allowed_keys",
      select: "name",
    });

    return res.status(200).json({
      status: "success",
      users,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};
