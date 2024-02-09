const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const factory = require("./handllerFactory");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");

//@desc get list of users
//@route GET /api/v1/users
//@access private
exports.getUsers = asyncHandler(async (req, res) => {
  const user = await User.find().populate({
    path: "allowed_keys",
    select: "name",
  });
  if (!user) {
    throw new ApiError(`لا يوجد مستخدمين`, 404);
  }
  return res.status(200).json({ status: "success", data: user });
});
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
function generateNumber(char) {
  const currentYear = new Date().getFullYear();
  const randomNumbers = Math.floor(Math.random() * 1000000000); // Generate 8 random numbers
  const result = `${char}${currentYear}${randomNumbers
    .toString()
    .padStart(8, "0")}`;
  return result;
}

//@desc create new user
//@route POST /api/v1/users
//@access private

exports.createUser = asyncHandler(async (req, res, next) => {
  //1-create user
  const code = generateNumber(req.body.email.charAt(0).toUpperCase());

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    code,
    phone: req.body.phone,
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
