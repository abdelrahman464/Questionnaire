const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Answer = require("./answerModel");

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
    quizStatus: {
      type: String,
      enum: ["ready", "inProgress", "finished"],
      default: "ready",
    },
    retakeQuizAt: {
      type: Date,
    },
    skipRaters: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      // required: [true, "password required"],
      // minlength: [8, "too short Password"],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    allowed_keys: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Key",
      },
    ],
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

userShcema.pre(/^find/, function (next) {
  this.populate({ path: "organization", select: "name" });
  next();
});

userShcema.pre("remove", async function (next) {
  await Answer.deleteMany({ userId: this._id });
  next();
});

const User = mongoose.model("User", userShcema);
module.exports = User;
