import mongoose from "mongoose";
import crypto from 'crypto';

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    required: true,
    type: String,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken:String,
  resetPasswordExpire:String,
});

schema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // time in mili seconds 

  return resetToken;
};
// console.log(crypto.randomBytes(20).toString("hex"))



export const User = mongoose.model("User", schema);
