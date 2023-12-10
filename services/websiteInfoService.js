const WebSiteInfo = require("../models/webSiteInfo");
const factory = require("./handllerFactory");





//@desc get list of WebSiteInfo
//@route GET /api/v1/WebSiteInfo
//@access public
exports.getAllwebSiteInfo = factory.getALl(WebSiteInfo);
//@desc get specific WebSiteInfo by id
//@route GET /api/v1/WebSiteInfo/:id
//@access public
exports.getWebSiteInfo = factory.getOne(WebSiteInfo);
//@desc create Key
//@route POST /api/v1/WebSiteInfo
//@access private
exports.createWebSiteInfo = factory.createOne(WebSiteInfo);
//@desc update specific WebSiteInfo
//@route PUT /api/v1/WebSiteInfo/:id
//@access private
exports.updateWebSiteInfo = factory.updateOne(WebSiteInfo);
//@desc delete WebSiteInfo
//@route DELETE /api/v1/WebSiteInfo/:id
//@access private
exports.deleteWebSiteInfo = factory.deleteOne(WebSiteInfo);
