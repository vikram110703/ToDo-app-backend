import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import { sendCookie } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";
import nodemailer from 'nodemailer';


//........................................Email Verification Start.................................................


const sendVerificationMail = async (name, email, user_id) => {
  try {
    // console.log("user_id : ", user_id);
    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: `${process.env.ethereal_user}`,
        pass: `${process.env.ethereal_pass}`
      }
    });

    let ID = user_id.toString();

    const mailOptions = {
      from: `"Tiara Prohaska" <${process.env.ethereal_user}>`,
      to: email,
      subject: 'Verification mail for ToDo App',
      html: `<p>Hello ${name}, please click <a href="${process.env.Backend_server}/users/verify?id=${ID}">here</a> to verify your email.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent ");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
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

    if (!user.isVerified) return next(new ErrorHandler(" Registered Successfully! Please Verify Your Mail ", 400));
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
