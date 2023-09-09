// database
const mongoose = require("mongoose");
//1- create schema
const answerSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userAnswer: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      answer: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
    },
  ],
  raters:[{
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          // required: true,
        },
        answer: {
          type: Number,
          min: 1,
          max: 5,
          // required: true,
        },
      },
    ],
  }],
  
});

//2- create model
const AnswerModel = mongoose.model("Answer", answerSchema);

module.exports = AnswerModel;
