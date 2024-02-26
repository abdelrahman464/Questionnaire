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
        min: 0, // i made this 0 instead of 1 cause , in questions with options , when he asnwer false , it will be 0
        max: 5,
        required: true,
      },
      answerText: {
        type: String,
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
  raters: [
    {
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
      answers: {
        type: [
          {
            questionId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Question",
              // required: true,
            },
            answer: {
              type: Number,
              min: 0,
              max: 5,
              // required: true,
            },
            answerText: {
              type: String,
            },
          },
        ],
        default: [],
      },
    },
  ],
});

answerSchema.index({ "raters.email": 1 }, { unique: true, sparse: true });
//2- create model
const AnswerModel = mongoose.model("Answer", answerSchema);

module.exports = AnswerModel;
