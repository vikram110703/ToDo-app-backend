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
      apiKey: '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',
    })
  );

  let ID = user_id.toString();
  // Use the transporter to send emails
  transporter.sendMail({
    from: `"vicky" <${process.env.ethereal_user}>`,
    to: email,
    subject: 'ToDo App Email Verification',
    html: `<p>Hello ${name}, please click <a href="${process.env.Backend_server}/users/verify?id=${ID}"><button>HERE</button> </a> to verify your email.</p>`

  }, (error, info) => {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent successfully');
    }
  });

};

export const verifyMail = async (req, resp) => {
  try {

    const user = await User.findById(req.query.id);
    // console.log(req.query.id);
    if (!user) {
      return (resp.send(`<h1> Register First  </h1>`))
    }
    const updatedInfo = await User.updateOne({ _id: req.query.id }, { $set: { isVerified: true } });
    // console.log(updatedInfo);

    resp.status(201).send(`<h1>Hello , ${user.name} Email is verified </h1>`);

  } catch (error) {
    console.log(error);
    resp.status(404).json({
      success: false,
      message: "Register before verification "
    })
  }
};

// .......................................Verification End......................................................


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

    if (!user.isVerified) return next(new ErrorHandler(" Registered Successfully!Please check your spam/junk folder for the verification Email ", 400));
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
