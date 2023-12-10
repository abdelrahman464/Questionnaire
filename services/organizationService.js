// Import necessary modules and dependencies
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require('bcrypt');
const Organization = require("../models/organizationModel");
const User = require("../models/userModel");
const factory = require("./handllerFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const ApiError = require("../utils/ApiError");

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

exports.addCoordiantor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { coordiantor } = req.body;
    
    // Hash the coordinator's password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(coordiantor.password, saltRounds);
    
    // Replace the plain text password with the hashed one
    coordiantor.password = hashedPassword;

    const organization = await Organization.findById(id);
    if (!organization) {
      return next(new AppError("No organization found with that ID", 404));
    }

    organization.coordiantors.push(coordiantor);
    await organization.save();
    
    // Avoid sending the hashed password in the response
    coordiantor.password = undefined;

    res.status(200).json({
      status: "success",
      organization,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrgStudents = async (req, res) => {
  try {
    const organization = await Organization.findOne({
      "coordiantors.email": req.user.email,
    });
    if (!organization) {
      return next(new AppError("انت لا تنتمي لاي منظمه", 404));
    }
    const users = User.find({ organization: organization._id });

    res.status(200).json({
      status: "success",
      users,
    });
  } catch (error) {
    next(error);
  }
};
