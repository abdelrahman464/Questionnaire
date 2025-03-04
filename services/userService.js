"use strict";
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const factory = require("./handllerFactory");
const User = require("../models/userModel");
const Answer = require("../models/answerModel");
const generateToken = require("../utils/generateToken");
const { off } = require("pdfkit");
const { processExcel } = require("../middlewares/excelMiddlware");

//@desc get list of users
//@route GET /api/v1/users
//@access private
exports.getUsers = factory.getALl(
  User,
  {
    path: "allowed_keys",
    select: "name",
  },
  "allowed_keys"
);
//@desc get specific User by id
//@route GET /api/v1/User/:id
//@access private
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate({
    path: "allowed_keys",
    select: "name",
  });
  if (!user) {
    throw new ApiError(`User not found with id of ${req.params.id}`, 404);
  }
  return res.status(200).json({ status: "success", data: user });
});
//@desc generate code for user
//@route POST /api/v1/users
//@access private
const generateNumber = (char) => {
  const currentYear = new Date().getFullYear();
  const randomNumbers = Math.floor(Math.random() * 1000000000); // Generate 8 random numbers
  const result = `${char}${currentYear}${randomNumbers
    .toString()
    .padStart(8, "0")}`;
  return result;
};

//@desc create new user
//@route POST /api/v1/users
//@access private

exports.createUser = asyncHandler(async (req, res, next) => {
  //1-create user
  const code = generateNumber(req.body.email.charAt(0).toUpperCase());

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    code,
    organization: req.body.organization ? req.body.organization : null,
    allowed_keys: req.body.allowed_keys,
  });
  res.status(201).json({ data: user });
});
//@desc signuo
//@route POST /api/v1/users/signup
//@access public

exports.signUp = asyncHandler(async (req, res) => {
  //1-create user
  const code = generateNumber(req.body.name.charAt(0).toUpperCase());

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    code,
  });
  res.status(201).json({ data: user });
});
//@desc create user
//@route POST /api/v1/users/createadmin
//@access private
exports.createAdmin = asyncHandler(async (req, res, next) => {
  //1-create user
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    role: "admin",
  });
  res.status(201).json({ data: user });
});
//@desc update specific user
//@route PUT /api/v1/user/:id
//@access private
exports.updateUser = factory.updateOne(User);
//@desc delete User
//@route DELETE /api/v1/user/:id
//@access private
exports.deleteUser = factory.deleteOne(User);
//@desc get logged user data
//@route GET /api/v1/user/getMe
//@access private/protect
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  // i will set the req,pararms.id because i will go to the next middleware =>>> (getUser)
  req.params.id = req.user._id;
  next();
});

//@desc update logged user password
//@route PUT /api/v1/user/changeMyPassword
//@access private/protect
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  //update user password passed on user payload (req.user._id)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  //genrate token
  const token = generateToken(req.user._id);

  res.status(200).json({ data: user, token });
});

//-------------------------------------------------------------------------------------------------
//@desc send emails to raters' emails to user with his code
//@route PUT /api/v1/user/sendEmails rater emails
//@access public/protect
//@params  code='ZMxs'

exports.availUserTakeQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res
      .status(401)
      .json({ status: "faild", msg: "هذا المستخدم غير موجود" });
  }
  if (user.quizStatus === "ready" && !user.retakeQuizAt) {
    return res.status(401).json({
      status: "faild",
      msg: "المستخدم بالفعل جاهز لأخذ الاختبار القبلي ",
    });
  }
  if (user.quizStatus === "inProgress" && !user.retakeQuizAt) {
    return res
      .status(401)
      .json({ status: "faild", msg: "المستخدم لم يتم انهاء الاختبار القبلي " });
  }
  if (user.quizStatus === "ready" && user.retakeQuizAt) {
    return res.status(401).json({
      status: "faild",
      msg: "المستخدم بالفعل جاهز لأخذ الاختبار البعدي ",
    });
  }
  if (user.quizStatus === "inProgress" && user.retakeQuizAt) {
    return res
      .status(401)
      .json({ status: "faild", msg: "المستخدم لم يتم انهاء الاختبار البعدي " });
  }

  user.quizStatus = "ready";
  user.retakeQuizAt = Date.now();
  user.save();
  return res.status(200).json({
    status: "success",
    msg: "يستطيع الطالب ان يأحذ الاختبار مره اخري",
  });
});
//---------------------------------------------------------------------------------------------
///@desc add keys to user
//@route PUT /api/v1/user/addKeysToUser/:id
//@access public/protect
exports.addKeysToUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { keys } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    if (user.allowed_keys.length === 0) {
      user.allowed_keys = keys;
    } else {
      user.allowed_keys = user.allowed_keys.concat(keys);
    }

    await user.save();

    return res.status(200).json({ status: "success", data: user });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});
//-------------------------------------------------------------------------------------------
//@desc remove keys from user
//@route PUT /api/v1/user/removeKeysFromUser/:id
//@access public/protect
exports.removeKeysFromUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { keys } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    user.allowed_keys = user.allowed_keys.filter(
      (key) => !keys.includes(key.toString())
    );
    console.log(user.allowed_keys);
    await user.save();

    return res.status(200).json({ status: "success", data: user });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});
//-------------------------------------------------------------------------------------------
// Function to transform rater answers to the desired structure
const transformRaterAnswers = (raterAnswers) => {
  const questionMap = {};

  // Iterate through each rater's answers array
  raterAnswers.forEach((raterAnswerArray, raterIndex) => {
    //Info : raterIndex is the index of the rater in the raterAnswers array
    raterAnswerArray.forEach((answer) => {
      const { questionId, answer: raterAnswer } = answer;
      // console.log(questionId, raterAnswer);
      if (!questionMap[questionId]) {
        questionMap[questionId] = [];
      }
      // Ensure there's an array to hold answers for this question
      while (questionMap[questionId].length <= raterIndex) {
        questionMap[questionId].push(null); // Placeholder for missing answers
      }
      // Add the answer at the correct index
      questionMap[questionId][raterIndex] = raterAnswer;
    });
  });

  // Convert map to array format if needed or keep as is for object mapping
  return questionMap;
};
//-------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------
//@desc get users answers report total
//@route GET /api/v1/user/getUsersAnswersReportTotal
//@access public/protect
exports.getUserReport = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const user = await User.findById(userId).select(
    "-allowed_keys -updatedAt -__v "
  );
  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }
  //check if user took quiz twice
  if (
    !user.retakeQuizAt &&
    (user.quizStatus === "ready" || user.quizStatus === "inProgress")
  ) {
    return res
      .status(404)
      .json({ status: "fail", message: "User not finished the quiz" });
  }

  const answer = await Answer.find({
    // userId: id,
    userId: userId,
  }).populate("userAnswer.questionId");

  if (answer.length < 2) {
    return res
      .status(404)
      .json({ status: "fail", message: "المستخدم لم ينهي الاختبارين" });
  }
  // return res.json({answer})
  //make array of object conatin uestion.name and uer answer before and after and rater answer
  //get question
  const questions = answer[0].userAnswer.map(
    (userAnswer) => userAnswer.questionId
  );
  console.log(questions);

  const raterBeforeObject = answer[0].raters.map((rater) => rater.answers);
  const raterAfterObject = answer[1].raters.map((rater) => rater.answers);
  const raterBeforeNumber = answer[0].raters.filter(
    (rater) => rater.answers.length > 0
  );
  const raterAfterNumber = answer[1].raters.filter(
    (rater) => rater.answers.length > 0
  );

  let beforeAnswersByQuestion = {};
  let afterAnswersByQuestion = {};

  if (raterBeforeObject.length > 0) {
    beforeAnswersByQuestion = transformRaterAnswers(raterBeforeObject);
  }
  if (raterAfterObject.length > 0) {
    afterAnswersByQuestion = transformRaterAnswers(raterAfterObject);
  }

  const report = questions.map((question) => ({
    key: question.section.name,
    question: question.text ? question.text : null,
    userAnswerBefore: answer[0].userAnswer.find(
      (ans) => ans.questionId._id.toString() === question._id.toString()
    )?.answer,
    userAnswerAfter: answer[1].userAnswer.find(
      (ans) => ans.questionId._id.toString() === question._id.toString()
    )?.answer,
    //not working herer
    raterBefore: beforeAnswersByQuestion[question._id.toString()] || [],
    raterAfter: afterAnswersByQuestion[question._id.toString()] || [],
    avgBefore: parseFloat(
      (
        (beforeAnswersByQuestion[question._id.toString()][0] +
          beforeAnswersByQuestion[question._id.toString()][1] +
          beforeAnswersByQuestion[question._id.toString()][2]) /
        raterBeforeNumber.length
      ).toFixed(2)
    ),
    avgAfter: parseFloat(
      (
        (afterAnswersByQuestion[question._id.toString()][0] +
          afterAnswersByQuestion[question._id.toString()][1] +
          afterAnswersByQuestion[question._id.toString()][2]) /
        raterAfterNumber.length
      ).toFixed(2)
    ),
  }));

  return res.status(200).json({ user: user, report: report });
});
//-------------------------------------------------------------------------------------------
//@desc avail user to skip raters
//@route PUT /api/v1/user/availUserToSkipRaters/:id
//@access public/protect
exports.availUserToSkipRaters = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }
  user.skipRaters = true;
  await user.save();
  return res.status(200).json({ status: "success", data: user });
});
//-----------------------------------------------
exports.updateManyUsers = async (req, res) => {
  try {
    const { ids, change } = req.body;
    const action = {};
    const filter = { _id: { $in: ids } };
    if (change === "deleteUsers") {
      await User.deleteMany(filter);
      return res
        .status(200)
        .json({ status: "success", msg: "تم حذف الحسابات بنجاح" });
    } else if (change === "availUsersToRetakeTakeQuiz") {
      filter.quizStatus = "finished";
      filter.retakeQuizAt = { $exists: false };

      action.quizStatus = "ready";
      action.retakeQuizAt = Date.now();
    } else if (change === "skipRaters") {
      action.skipRaters = true;
    } else if (change === "doNotSkipRaters") {
      action.skipRaters = false;
    }
    console.log(filter, action);
    const users = await User.updateMany(filter, action);
    return res
      .status(200)
      .json({ status: "success", msg: "تم تحديث الحسابات بنجاح", users });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};
//---------------------------------------------
exports.storeManyUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "failed", message: "لم يتم رفع اي ملف" });
    }
    const result = await processExcel(req.file.path);
    console.log(result);
    const users = await User.insertMany(result.usersData);

    return res.status(200).json({
      message: "تم تخزين بيانات المستخدمين بنجاح",
      users,
      existingUsers: result.existingUsers,
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};
