const Question = require("../models/questionModel");
const Key = require("../models/keyModel");
const factory = require("./handllerFactory");
const { getAnsweredQuestions } = require("./answerService");

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

exports.takeTest = async (req, res) => {
  // get questions which it's key exists in req.user.allowed_keys
  const questions = await Question.find({
    keyId: { $in: req.user.allowed_keys },
  });
  const answeredQuestionIds = await getAnsweredQuestions(req.user._id);
  //help : it don't filter
  // const filteredQuestions = questions.filter(question => !answeredQuestionIds.includes(question._id));
  const filteredQuestions = questions.filter((question) => {
    const questionIdString = question._id.toString();
    return !answeredQuestionIds.some(
      (answeredQuestion) => answeredQuestion._id.toString() === questionIdString
    );
  });
  console.log(filteredQuestions);
  // get key of each group of questions share same key and add it to the question object
  const keyQuestions = {};
  filteredQuestions.forEach((question) => {
    if (!keyQuestions[question.section]) {
      keyQuestions[question.section] = [];
    }
    keyQuestions[question.section].push(question);
  });
  //help : select each key with Key model and replace key object instead of id and inside it array of objects

  console.log(keyQuestions);
  return res.status(200).json({
    status: "success",
    data: {
      questions: keyQuestions,
    },
  });
};
