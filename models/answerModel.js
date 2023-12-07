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
  isUserAnserCompleted: {
    type: Boolean,
    default: false,
  },
  isRatersAnserCompleted: {
    type: Boolean,
    default: false,
  },
  raters:[{
    name: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    gotEmailAt: {
      type: Date,
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

answerSchema.index({ "raters.email": 1 }, { unique: true, sparse: true });
//2- create model
const AnswerModel = mongoose.model("Answer", answerSchema);

module.exports = AnswerModel;
