const Question = require("../models/questionModel");
const factory = require("./handllerFactory");

//@desc get list of Questions
//@route GET /api/v1/Questions
//@access public
exports.getQuestions = factory.getALl(Question, "Key");
//@desc get specific Question by id
//@route GET /api/v1/Questions/:id
//@access public
exports.getQuestion = factory.getOne(Question);
//@desc create Key
//@route POST /api/v1/Questions
//@access private
exports.createQuestion = factory.createOne(Question);
//@desc update specific Question
//@route PUT /api/v1/Questions/:id
//@access private
exports.updateQuestion = factory.updateOne(Question);
//@desc delete Question
//@route DELETE /api/v1/Questions/:id
//@access private
exports.deleteQuestion = factory.deleteOne(Question);
