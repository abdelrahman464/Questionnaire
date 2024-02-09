const ContactUs = require("../models/contactUsModel");
const factory = require("./handllerFactory");



//@desc get list of ContactUs
//@route GET /api/v1/ContactUs
//@access public
exports.getAllContactUs = factory.getALl(ContactUs);
//@desc create Key
//@route POST /api/v1/ContactUs
//@access private
exports.createContactUs = factory.createOne(ContactUs);
//@desc update specific ContactUs
//@route PUT /api/v1/ContactUs/:id
//@access private
exports.updateContactUs = factory.updateOne(ContactUs);
//@desc delete ContactUs
//@route DELETE /api/v1/ContactUs/:id
//@access private
exports.deleteContactUs = factory.deleteOne(ContactUs);
