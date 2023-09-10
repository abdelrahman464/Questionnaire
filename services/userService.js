const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const factory = require("./handllerFactory");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");


//@desc get list of users
//@route GET /api/v1/users
//@access private
exports.getUsers = factory.getALl(User);
//@desc get specific User by id
//@route GET /api/v1/User/:id
//@access private
exports.getUser = factory.getOne(User);
//@desc generate code for user
//@route POST /api/v1/users
//@access private
function generateNumber() {
  const min = 100000000000;
  const max = 999999999999;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum;
}
//----------------------------------------------------------------------------------------//
// Function to generate a unique rateCode
 function generateUniqueCode(field) {
  // Generate a random rateCode (you can customize this logic as needed)
  const randomCode = generateNumber();

  return User.findOne({ field: randomCode })
    .then(existingUser => {
      if (existingUser) {
        // If the generated code already exists, recursively call the function again
        return generateUniqueCode(field);
      }
      return randomCode;
    })
    .catch(error => {
      throw error;
    });
}

//@desc create new user
//@route POST /api/v1/users
//@access private

exports.createUser = asyncHandler(async (req, res, next) => {
  //1-create user
  const code =  generateNumber();
  const rateCode = generateNumber();
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    code,
    rateCode,
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
    password:req.body.password,
    phone: req.body.phone,
    role:"admin"
  });
  res.status(201).json({ data: user });
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
//----------------------------------------------------------------------------------------//
//TODO 
//@desc add raters' emails to user with his code
//@route PUT /api/v1/user/addRaters emails
//@access public/protect
//@params  code='ZMxs' raterEmailsToAdd = ['rater1@example.com', 'rater2@example.com'];                                      ;

exports.addRatersEmail=asyncHandler(async(req,res,next)=> {
    const{raterEmails}=req.body;
    // Find the user by their name
    
    const user = await User.findOne({ code:req.user.code });
    
    if (!user) {
      return next(new ApiError("user not exist", 404));
    }
    
    // Add rater emails to the user's ratersEmails array
    user.ratersEmails = user.ratersEmails.concat(raterEmails.map(email => ({ raterEmail: email })));

    // Save the updated user
    await user.save();

    return res.status(200).json({status:`success`,data:user});
  
}
)


//@desc send emails to raters' emails to user with his code
//@route PUT /api/v1/user/sendEmails rater emails
//@access public/protect
//@params  code='ZMxs'    

exports.SendEmailsToRaters = asyncHandler(async (req, res,next) => {
  

  const user = await User.findOne({code:req.user.Code});
  if (!user) {
    return next(ApiError("live not found", 404));
  }
  const url=`${process.env.RATERS_URL}?code=${user.rateCode}`


  user.ratersEmails.forEach(async (rater) => {
    try {
      let emailMessage = "";
      
      emailMessage = `Hi ${rater.raterEmail} 
                            \n your friend ${user.email} invited you to
                            \n to rate him in a quick Quiz
                            \n here is the link ${url}`;
       
      await sendEmail({
        to: rater.raterEmail,
        subject: `rate your frined ${user.email}`,
        text: emailMessage,
      });
    } catch (err) {
      return next(new ApiError("there is a problem with sending Email", 500));
    }
  });

  res.status(200).json({ succes: "true" });
});
exports.availUserTakeQuiz = asyncHandler(async (req, res) => {
  const {id}=req.params;
  const user = await User.findOne({_id:id});
  if(!user){
   return res.status(401).json({status:'faild',msg:'user not found'})
  } 
  if(!user.quizTaken){
   return res.status(401).json({status:'faild',msg:'user already can take quiz'})
  }
    user.quizTaken=0;
    user.save();
    return res.status(200).json({status:'success',msg:'user can take test again'})
 });

