import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import { sendCookie } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";
import nodemailer from 'nodemailer';
import sendinBlueTransport from 'nodemailer-sendinblue-transport';
import crypto from 'crypto';


//........................................Email Verification Start.................................................
export const sendVerificationMail = async (email, message, subject) => {
  const transporter = nodemailer.createTransport(
    new sendinBlueTransport({
      apiKey: `${process.env.sendingBlue_pass}`,
    })
  );
  // let ID = user_id.toString();
  // Use the transporter to send emails
  transporter.sendMail({
    from: `"vicky" <${process.env.sendingBlue_user}>`,
    to: email,
    subject: subject,
    html: message
  }, (error, info) => {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent successfully');
    }
  });

};

export const verifyMail = async (req, res) => {
  try {

    const user = await User.findById(req.query.id);
    // console.log(req.query.id);
    if (!user) {
      return (res.send(`<h1> Register First  </h1>`))
    }
    const updatedInfo = await User.updateOne({ _id: req.query.id }, { $set: { isVerified: true } });
    // console.log(updatedInfo);

    // res.status(201).send(`<h1>Hello , ${user.name} Email is verified </h1>`);
    res.status(201)
      .redirect(`${process.env.FRONTEND_URL}/login`);
  } catch (error) {
    // console.log(error);
    res.status(404).json({
      success: false,
      message: "Register before verification "
    })
  }
};

// .......................................Verification End......................................................

export const resendEmail = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    const user = await User.findOne({ email: newEmail });

    if (!user) return next(new ErrorHandler("User Not Found", 400));
    //.....send Mail ......................
    let ID = user._id.toString();
    const subject = `Account Verification for ToDo-App`;
    const message = `<div> <h1>Hello ${user.name} </h1>
    <h2>This mail is for verification your Email for ToDo App </h2>
     Please click <a href="${process.env.Backend_server}/users/verify?id=${ID} "><button>HERE</button> </a> to verify your email.</div>`;

    sendVerificationMail(user.email, message, subject);
    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) return next(new ErrorHandler("Invalid Email or Password", 400));

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return next(new ErrorHandler("Invalid Email or Password", 400));
    if (!user.isVerified)
      return next(new ErrorHandler("Please ! Verify Your Mail ", 400));

    sendCookie(user, res, `Welcome back, ${user.name}`, 200);
  } catch (error) {
    next(error);
  }
};


export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) return next(new ErrorHandler("User Already Exist", 400));

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({ name, email, password: hashedPassword });
    //............ for sending Email .................
    let ID = user._id.toString();
    const subject = `Account Verification ToDo-App `
    const message = `<div> <h1>Hello ${name} </h1>
    <h2>This mail is for verification your Email for ToDo App </h2> <br/><br/>
     Please click  <a href="${process.env.Backend_server}/users/verify?id=${ID} "> <button> HERE </button> </a> to verify your email.</div>`;

    sendVerificationMail(email, message, subject);

    if (!user.isVerified) return next(new ErrorHandler("Registered Successfully! Please Verify Your Email ", 201));
    sendCookie(user, res, "Registered Successfully", 201);


  } catch (error) {
    next(error);
  }
};

export const getMyProfile = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const logout = (req, res) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? false : true,
    })
    .json({
      success: true,
      user: req.user,
    });
};

export const forgotPassword = async (req, resp, next) => {
  try {
    const { newEmail } = req.body;
    const user = await User.findOne({ email:newEmail });
    if (!user) return next(new ErrorHandler("User not found ", 401));

    const resetToken = await user.getResetToken();
    await user.save(); // to save token in Db 

    //send email 
    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    const message = `<div> <h1>Hello ${user.name} </h1>
    <h2> Click on this button to reset your password </h2>
     <a href="${url} "><button> Reset Password  </button> </a> <br/><br/>
     If you have not requested then please ignore it .
     </div>`;
    const subject = "Reset Password (ToDo-App)"

    await sendVerificationMail(user.email, message, subject);

    resp.status(200).json({
      success: true,
      message: `Reset token has been sent to ${user.email} `,

    });

  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, resp, next) => {
  try {
    const { token } = req.params;

    const resetPasswordToken = crypto.createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) return next(new ErrorHandler("Reset token is invalid/Expired"));
    user.password = req.body.password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;

    await user.save();

    resp.status(200).json({
      success: true,
      message: "Password  has been changed successfully "
    })

  } catch (error) {
    next(error);
  }

};
