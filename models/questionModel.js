// database
const mongoose = require("mongoose");
const Answer = require("./answerModel");
//1- create schema
const questionSchema = mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // Specify that options is an array of strings
  },
  correctAnswer: {
    type: String,
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Key",
    required: true,
  },
});


//2- create model
const QuestionModel = mongoose.model("Question", questionSchema);

module.exports = QuestionModel;
