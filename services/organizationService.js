// Import necessary modules and dependencies
const Organization = require("../models/organizationModel");
const factory = require("./handllerFactory");

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

exports.addCoordiantor = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordiantor } = req.body;
    const organization = await Organization.findById(id);
    if (!organization) {
      return next(new AppError("No organization found with that ID", 404));
    }
    organization.coordiantors.push(coordiantor);
    await organization.save();
    res.status(200).json({
      status: "success",
      organization,
    });
  } catch (error) {
    next(error);
  }
};
