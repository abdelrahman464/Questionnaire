const mongoose = require("mongoose");

const contactUsSchema = mongoose.Schema({
  phone: String,
  address: String,
  facebook: String,
  whatsApp: String,
  linkedIn: String,
  instagram: String,
});

module.exports = mongoose.model("contactUs", contactUsSchema);
