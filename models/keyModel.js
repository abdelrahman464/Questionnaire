// database
const mongoose = require("mongoose");
//1- create schema
const keySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "key is required"],
      unique: [true, "key must be unique"],
      minlength: [2, "too short key name"],
    },
    desc: {
      type: String,
      required: [true, "desc is required"],
      minlength: [2, "too short desc"],
    },
    
   
  },
  { timestamps: true }
);


//2- create model
const keyModel = mongoose.model("Key", keySchema);

module.exports = keyModel;
