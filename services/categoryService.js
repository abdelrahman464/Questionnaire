const Key = require("../models/keyModel");
const factory = require("./handllerFactory");

//@desc get list of keys
//@route GET /api/v1/keys
//@access public
exports.getKeys = factory.getALl(Key, "Key");
//@desc get specific Key by id
//@route GET /api/v1/keys/:id
//@access public
exports.getKey = factory.getOne(Key);
//@desc create Key
//@route POST /api/v1/keys
//@access private
exports.createKey = factory.createOne(Key);
//@desc update specific Key
//@route PUT /api/v1/keys/:id
//@access private
exports.updateKey = factory.updateOne(Key);
//@desc delete Key
//@route DELETE /api/v1/keys/:id
//@access private
exports.deleteKey = factory.deleteOne(Key);
