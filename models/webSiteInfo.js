const mongoose = require("mongoose");

const webSiteInfoSchema = mongoose.Schema({
  whoAreWe: String,
  aboutUs: String,
});

module.exports = mongoose.model("webSiteInfo", webSiteInfoSchema);
