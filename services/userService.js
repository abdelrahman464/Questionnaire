const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const factory = require("./handllerFactory");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");


//@desc get list of users
//@route GET /api/v1/users
//@access private
exports.getUsers = factory.getALl(User);
//@desc get specific User by id
//@route GET /api/v1/User/:id
//@access private
exports.getUser = factory.getOne(User);
//@desc create user
//@route POST /api/v1/users
//@access private
function generateNumber() {
  const min = 100000000000;
  const max = 999999999999;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum;
}
exports.createUser = asyncHandler(async (req, res, next) => {
  //1-create user
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    code:generateNumber(),
  });
  res.status(201).json({ data: user, token });
});
//@desc create user
//@route POST /api/v1/users/createadmin
//@access private
exports.createAdmin = asyncHandler(async (req, res, next) => {
  //1-create user
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    role:"admin"
  });
  res.status(201).json({ data: user, token });
});
//@desc update specific user
//@route PUT /api/v1/user/:id
//@access private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    },
    {
      new: true,
    }
  );
  if (!user) {
    return next(new ApiError(`User Not Found`, 404));
  }

  res.status(200).json({ data: user });
});
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