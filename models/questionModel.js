// database
const mongoose = require("mongoose");
//1- create schema
const questionSchema = mongoose.Schema(
    {
        text: {
          type: String,
          required: true,
        },
        section: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Key',
          required: true,
        },
      }
);


//2- create model
const QuestionModel = mongoose.model("Question", questionSchema);

module.exports = QuestionModel;
