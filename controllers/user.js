import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import { sendCookie } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";
import nodemailer from 'nodemailer';
import sendinBlueTransport from 'nodemailer-sendinblue-transport';


//........................................Email Verification Start.................................................

const sendVerificationMail = async (name, email, user_id) => {
  const transporter = nodemailer.createTransport(
    new sendinBlueTransport({
      apiKey: `${process.env.sendingBlue_pass}`,
    })
  );

  let ID = user_id.toString();
  // Use the transporter to send emails
  transporter.sendMail({
    from: `"vicky" <${process.env.sendingBlue_user}>`,
    to: email,
    subject: 'ToDo App Email Verification',
    html: `<div> <h1>Hello ${name} </h1>
    <h2>This mail is for verification your Email for ToDo App </h2>
     Please click <a href="${process.env.Backend_server}/users/verify?id=${ID}"><button>HERE</button> </a> to verify your email.</div>`

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
    res.status(201).redirect(`${process.env.FRONTEND_URL}/login`);

  } catch (error) {
    console.log(error);
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
      
    sendVerificationMail(user.name, user.email, user._id);
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

    sendVerificationMail(name, email, user._id);

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
