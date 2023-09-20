const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userShcema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "name required"],
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: true,
      lowercase: true,
    },
    phone: String,
    code: {
      type: String,
      minlength: [8, "too short code"],
    },
    rateCode: {
      type: String,
      minlength: [8, "too short code"],
    },
    quizTaken: {
      type: Boolean,
      default:0
    },
    password: {
      type: String,
      // required: [true, "password required"],
      // minlength: [8, "too short Password"],
    }
  ,
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ["user","admin"],
      default: "user",
    },
    
  },
  { timestamps: true }
);

userShcema.pre("save", async function (next) {
  //if password field is not modified go to next middleware
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userShcema.pre("save", async function (next) {
  //if code field is not modified go to next middleware
  if (!this.isModified("code")) return next();
  // Hashing user code
  this.code = await bcrypt.hash(this.code, 12);
  next();
});
userShcema.pre("save", async function (next) {
  //if rateCode field is not modified go to next middleware
  if (!this.isModified("rateCode")) return next();
  // Hashing user rateCode
  this.rateCode = await bcrypt.hash(this.rateCode, 12);
  next();
});
const User = mongoose.model("User", userShcema);
module.exports = User;
